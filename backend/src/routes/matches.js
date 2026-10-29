const db = require('../../data/connection.js')

module.exports = [
    // Récupérer les parties d'un utilisateur
    {
        method: 'GET',
        url: '/api/matches/:userId',
        handler: (request, reply) => {
            if (!request.isAuthenticated)
                return reply.send({success: false, code: 1})
            const userId = request.params.userId

            db.all(
                `
                    SELECT *
                    FROM matches
                    WHERE player1_id = ? OR player2_id = ?
                    ORDER BY created_at DESC
                `,
                [userId, userId],
                function (err, rows) {
                    if (err) {
                        return reply.code(500).send({ success: false, error: "Erreur serveur" })
                    }

                    return reply.code(200).send({ success: true, message: "Parties retournées", data: rows })
                }
            )
        }
    },

    // Récupérer les parties de tous les utilisateurs
    {
        method: 'GET',
        url: '/api/matches',
        handler: (request, reply) => {
            if (!request.isAuthenticated)
                return reply.send({success: false, code: 1})
            let sql = `
                SELECT m.id,
                       m.player1_id,
                       m.player2_id,
                       m.score1,
                       m.score2,
                       m.status,
                       m.winner_id,
                       m.created_at,

                       u1.username AS player1_username,
                       u2.username AS player2_username,

                       u1.avatarUrl AS player1_avatarUrl,
                       u2.avatarUrl AS player2_avatarUrl,

                       u1.hue AS player1_hue,
                       u2.hue AS player2_hue
                FROM matches m
                LEFT JOIN users u1 ON u1.id = m.player1_id
                LEFT JOIN users u2 ON u2.id = m.player2_id
                WHERE m.status = 'finished' OR m.status = 'abandoned'
                ORDER BY m.created_at DESC
            `

            const params = []

            if (request.query.limit !== undefined) {
                const limit = parseInt(request.query.limit, 10)

                if (!Number.isNaN(limit) && limit > 0) {
                    sql += ` LIMIT ?`
                    params.push(limit)
                }
            }

            db.all(
                sql,
                params,
                function (err, rows) {
                    if (err) {
                        return reply.code(500).send({ success: false, error: "Erreur serveur" })
                    }

                    return reply.code(200).send({ success: true, message: "Parties récupérées", data: rows })
                }
            )
        }
    },

    // Récupérer les parties en cours
    {
        method: 'GET',
        url: '/api/matches/in-progress',
        handler: (request, reply) => {
            if (!request.isAuthenticated)
                return reply.send({success: false, code: 1})

            db.all(
                `
                    SELECT m.id,
                           u1.username AS player1_username,
                           u2.username AS player2_username,
                           u1.avatarUrl AS player1_avatarUrl,
                           u2.avatarUrl AS player2_avatarUrl,
                           u1.hue AS player1_hue,
                           u2.hue AS player2_hue
                    FROM matches m
                    LEFT JOIN users u1 ON u1.id = m.player1_id
                    LEFT JOIN users u2 ON u2.id = m.player2_id
                    WHERE m.status = 'playing'
                    ORDER BY m.created_at DESC
                    LIMIT 42
                `,
                function (err, rows) {
                    if (err) {
                        return reply.code(500).send({ success: false, error: "Erreur serveur" })
                    }

                    return reply.code(200).send({ success: true, message: "Parties récupérées", data: rows })
                }
            )
        }
    }
]
