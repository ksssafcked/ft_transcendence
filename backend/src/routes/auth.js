const db = require('../../data/connection.js')

module.exports = [
    {
        method: 'GET',
        url: '/api/me',
        handler: (request, reply) => {
            if (!request.isAuthenticated)
                return reply.send({success: false, code: 1})
            const userId = request.user.userId

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

                    reply.code(200).send({ success: true, message: "", data: row })
                }
            )
        }
    }
]
