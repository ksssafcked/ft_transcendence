const db = require('../../data/connection.js')
const { addAchievements } = require('../utils/achievements.js')

module.exports = [
    // Récupérer un utilisateur par son nom d'utilisateur
	{
        method: 'GET',
        url: '/api/user/by-username/:username',
        handler: (request, reply) => {
            if (!request.isAuthenticated)
                return reply.send({success: false, code: 1})
            const username = request.params.username

            db.get(
                `
                    SELECT u.id,
                           u.username,
                           u.email,
                           u.avatarUrl,
                           u.hue,
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
                    WHERE u.username = ?
                `,
                [username],
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

    // Récupérer la liste des amis
	{
        method: 'GET',
        url: '/api/user/:id/friends',
        handler: (request, reply) => {
            if (!request.isAuthenticated)
                return reply.send({success: false, code: 1})
            const userId = request.params.id

            db.all(
                `
                    SELECT u.id, u.username, u.avatarUrl, u.hue
                    FROM friends f
                    JOIN users u ON f.friend_id = u.id
                    WHERE f.user_id = ?
                `,
                [userId],
                function (err, rows) {
                    if (err) {
                        return reply.code(500).send({ success: false, error: "Erreur serveur" })
                    }  

                    return reply.code(200).send({ success: true, message: "Amis retournés", data: rows })
                }
            )
        }
    },

    // Ajouter un ami
    {
        method: 'GET',
        url: '/api/user/friends/:fname/add',
        handler: (request, reply) => {
            if (!request.isAuthenticated)
                return reply.send({success: false, code: 1})
            const userId = request.user.userId
            const friendName = request.params.fname

            if (!friendName) {
                return reply.code(200).send({ success: false, error: "Nom de l'ami manquant" })
            }

            db.get(
                `
                    SELECT id
                    FROM users
                    WHERE username = ?
                `,
                [friendName],
                function (err, row) {
                    if (err) {
                        return reply.code(500).send({ success: false, error: "Erreur serveur" })
                    }

                    if (!row) {
                        return reply.code(200).send({ success: false, error: "Utilisateur introuvable" })
                    }

                    const friendId = row.id

					if (friendId == userId) {
						return reply.code(200).send({ success: false, error: "Impossible de s'ajouter soi-même en ami" })
					}

                    db.get(
                        `
                            SELECT id
                            FROM friends
                            WHERE user_id = ? AND friend_id = ?
                        `,
                        [userId, friendId],
                        async function (err, existing) {
                            if (err) {
                                return reply.code(500).send({ success: false, error: "Erreur serveur" })
                            }

                            if (existing) {
                                return reply.code(200).send({ success: false, error: "Déjà ami" })
                            }

                            db.run(
                                `
                                    INSERT INTO friends (user_id, friend_id)
                                    VALUES (?, ?)
                                `,
                                [userId, friendId],
                                async function (err) {
                                    if (err) {
                                        return reply.code(500).send({ success: false, error: "Erreur serveur" })
                                    }

                                    try {
                                        await addAchievements([{ user_id: userId, label: '1_friend' }])
                                    } catch (err) {}

                                    return reply.code(200).send({ success: true, message: "Ami ajouté" })
                                }
                            )
                        }
                    )
                }
            )
        }
    },

    // Supprimer un ami
    {
        method: 'DELETE',
        url: '/api/user/friends/:fid/remove',
        handler: (request, reply) => {
            if (!request.isAuthenticated)
                return reply.send({success: false, code: 1})
            const userId = request.user.userId
            const friendId = request.params.fid

            if (!friendId) {
                return reply.code(200).send({ success: false, error: "ID de l'ami manquant" })
            }

            db.run(
                `
                    DELETE FROM friends
                    WHERE user_id = ? AND friend_id = ?
                `,
                [userId, friendId],
                function (err) {
                    if (err) {
                        return reply.code(500).send({ success: false, error: "Erreur serveur" })
                    }

                    if (this.changes === 0) {
                        return reply.code(200).send({ success: false, error: "Ami introuvable" })
                    }

                    return reply.code(200).send({ success: true, message: "Ami supprimé"})
                }
            )
        }
    }
]
