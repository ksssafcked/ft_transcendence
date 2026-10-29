const db = require('../../data/connection.js')
const fs = require('fs')
const path = require('path')
const { sendUpdateToUsers } = require('../chatHandler.js')
module.exports = [
    // Récupérer un utilisateur
    {
        method: 'GET',
        url: '/api/user/:id',
        handler: (request, reply) => {
            if (!request.isAuthenticated)
                return reply.send({success: false, code: 1})
            const userId = request.params.id

            db.get(
                `
                    SELECT u.id,
                           u.username,
                           u.email,
                           u.hue,
                           u.avatarUrl,
                           (
                                SELECT COUNT(*)
                                FROM matches m
                                WHERE m.status IN ('finished', 'abandoned')
                                AND m.winner_id = u.id
                            ) AS wins,
                            (
                                SELECT COUNT(*)
                                FROM matches m
                                WHERE m.status IN ('finished', 'abandoned')
                                AND (m.player1_id = u.id OR m.player2_id = u.id)
                                AND m.winner_id IS NOT NULL
                                AND m.winner_id != u.id
                            ) AS losses
                    FROM users u
                    WHERE u.id = ?
                `,
                [userId],
                function (err, row) {
                    if (err) {
                        return reply.code(500).send({ success: false, error: "Erreur serveur" })
                    }

                    if (!row) {
                        return reply.code(200).send({ success: false, error: "Utilisateur introuvable" })
                    }

                    return reply.code(200).send({ success: true, message: "Utilisateur retourné", data: row })
                }
            )
        }
    },

    // Modifier un utilisateur
    {
        method: 'PUT',
        url: '/api/user/:id',
        handler: (request, reply) => {
            if (!request.isAuthenticated)
                return reply.send({success: false, code: 1})
            const userId = request.user.userId
            const oldUsername = request.user.username
            const { username, email, hue } = request.body

            if (!username || !email || !hue) {
                return reply.code(200).send({ success: false, error: "Champ manquant" })
            }

            const usernameRegex = /^[A-Za-z0-9._-]{1,32}$/
            if (!usernameRegex.test(username)) {
                return reply.code(200).send({ success: false, error: "Nom d'utilisateur invalide" })
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(email)) {
                return reply.code(200).send({ success: false, error: "Email invalide" })
            }

            if (hue < 0 || hue > 359)
                return reply.code(200).send({ success: false, error: "Teinte invalide" })

            db.get(
                `
                    SELECT id
                    FROM users
                    WHERE (email = ? OR username = ?) AND id != ?
                `,
                [email, username, userId],
                function (err, row) {
                    if (err) {
                        return reply.code(500).send({ success:false, error: "Erreur serveur" })
                    }

                    if (row) {
                        return reply.code(200).send({ success: false, error: "Nom d'utilisateur ou email déjà utilisé" })
                    }

                    db.run(
                        `
                            UPDATE users
                            SET username = ?, email = ?, hue = ?
                            WHERE id = ?
                        `,
                        [username, email, hue % 360, userId],
                        function (err) {
                            if (err) {
                                return reply.code(500).send({ success: false, error: "Erreur serveur" })
                            }
                            if (oldUsername !== username)
                                sendUpdateToUsers(username, userId)
                            return reply.code(200).send({ success: true, message: "Profil mis à jour" })
                        }
                    )
                }
            )
        }
    },

    // Modifier l'avatar d'un utilisateur
    {
        method: 'PUT',
        url: '/api/user/:id/avatar',
        handler: async (request, reply) => {
            if (!request.isAuthenticated)
                return reply.send({success: false, code: 1})
            const userId = request.user.userId
            const filedata = await request.file()

            if (!filedata) {
                return reply.code(200).send({ success: false, error: "Fichier manquant" })
            }

            const uploadDir = path.join(__dirname, '../../public/avatars')

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true })
            }

            const filename = `avatar_${userId}_${Date.now()}${path.extname(filedata.filename)}`
            const filepath = path.join(uploadDir, filename)

            await fs.promises.writeFile(filepath, await filedata.toBuffer())
            const avatarUrl = `/public/avatars/${filename}`

            await new Promise((resolve, reject) => {
                db.run(
                    `
                        UPDATE users
                        SET avatarUrl = ?
                        WHERE id = ?
                    `,
                    [avatarUrl, userId],
                    function (err) {
                        if (err) {
                            return reject(err)
                        }

                        resolve()
                    }
                )
            }).catch(() => {
                return reply.code(500).send({ success: false, error: "Erreur serveur" })
            })

            const data = {
                avatarUrl
            }

            return reply.code(200).send({ success: true, message: "Avatar mis à jour", data })
        }
    },

    // Récupérer les succès d'un utilisateur
    {
        method: 'GET',
        url: '/api/achievements/:user_id',
        handler: (request, reply) => {
            if (!request.isAuthenticated)
                return reply.send({success: false, code: 1})
            const userId = request.params.user_id

            db.all(
                `
                    SELECT label, date
                    FROM achievements
                    WHERE user_id = ?
                `,
                [userId],
                (err, rows) => {
                    if (err) {
                        return reply.code(500).send({ success: false, error: "Erreur serveur" })
                    }

                    return reply.code(200).send({ success: true, message: "Succès retournés", data: rows })
                }
            )
        }
    }
]
