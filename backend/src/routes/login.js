const db = require('../../data/connection.js')
const bcrypt = require('bcrypt')

const JWT_SECRET = process.env.JWT_SECRET

module.exports = [
    // Connecter un utilisateur
    {
        method: 'POST',
        url: '/api/login',
        handler: async function (request, reply) {

            const { email, password } = request.body; 

            if (!email || !password) {
                return reply.code(200).send({ success: false, error: "Champs manquants" })
            }

            try {
                const row = await new Promise((resolve, reject) => {
                    db.get(
                        `
                            SELECT *
                            FROM users
                            WHERE email = ?
                        `,
                        [email],
                        (err, row) => {
                            if (err) reject(err)
                            else resolve(row)
                    
                        }
                    )
                })

                if (!row) {
                    return reply.code(200).send({ success:false, error: "Utilisateur introuvable" })
                }

                const match = await bcrypt.compare(password, row.password)
                if (!match) {
                    return reply.code(200).send({ success: false, error: "Mot de passe incorrect" })
                }

                const token = this.jwt.sign({
                    userId: row.id
                })
                reply.setCookie('access_token', token, {
                    path: '/',
                    httpOnly: true,
                    secure: true,
                    sameSite: 'strict',
                    maxAge: 7200
                });

                const data = {
                    userId: row.id,
                    email: row.email,
                    username: row.username,
                    hue: row.hue
                }

                return reply.code(200).send({ success: true, message: "Connexion effectuée", data })
            } catch (err) {
                return reply.code(500).send({ success: false, error: "Erreur serveur" })
            }
        }
    },

    // Déconnecter un utilisateur
    {
        method: 'POST',
        url: '/api/logout',
        handler: async function (request, reply) {
            try {
                reply.clearCookie('access_token', { path: '/' });

                return reply.code(200).send({ success: true, message: "Déconnexion effectuée" });
            } catch (err) {
                return reply.code(500).send({ success: false, error: 'Erreur serveur' });
            }
        }
    }
]
