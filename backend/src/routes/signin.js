const db = require('../../data/connection.js')
const bcrypt = require('bcrypt')
const {randomUUID} = require('crypto')

module.exports = [
    // Incsrire un utilisateur
    {
        method: 'POST',
        url: '/api/signin',
        handler: async (request, reply) => {
            const { username, email, password } = request.body

            if (!username || !email || !password) {
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

            const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/
            if (!passwordRegex.test(password)) {
                return reply.code(200).send({ success: false, error: "Mot de passe invalide" })
            }

                

            try {
                const hashedPassword = await bcrypt.hash(password, 10)

                const randomHue = Math.floor(Math.random() * 360)

                const avatars = [
                    '/public/avatars/avatar_1.png',
                    '/public/avatars/avatar_2.png',
                    '/public/avatars/avatar_3.png',
                ]
                const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)]

                await new Promise((resolve, reject) => {
                    const newId = randomUUID()
                    const stmt = db.prepare(
                        `
                            INSERT INTO users (id, username, email, password, hue, avatarUrl)
                            VALUES (?, ?, ?, ?, ?, ?)
                        `
                    )
                    stmt.run(
                        newId,
                        username,
                        email,
                        hashedPassword,
                        randomHue,
                        randomAvatar,
                        function(err) {
                            if (err) return reject(err)
                            resolve(this.lastID)
                        }
                    )
                    stmt.finalize()
                })

                reply.code(200).send({ success: true, message: "Profil créé" })
            } catch (err) {
                if (err.message.includes("UNIQUE")) {
                    reply.code(200).send({ success: false, error: "Nom d'utilisateur ou email déjà utilisé" })
                } else {
                    reply.code(500).send({ success: false, error: "Erreur serveur" })
                }
            }
        }
    }
]
