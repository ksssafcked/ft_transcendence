const db = require("../../data/connection.js")

module.exports = [
    // Récupérer les dix utilisateurs les mieux classés
    {
        method: "GET",
        url: "/api/leaderboard",
        handler: (request, reply) => {
            if (!request.isAuthenticated)
                return reply.send({success: false, code: 1})
            db.all(
                `
                    SELECT id,
                           username,
                           hue,
                           avatarUrl,
                           wins,
                           losses,
                           (wins - losses) * 100 AS xp
                    FROM (
                        SELECT u.id,
                               u.username,
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
                    ) stats
                    WHERE wins > 0 OR losses > 0
                    ORDER BY xp DESC, wins DESC, losses ASC, username ASC
                    LIMIT 10
                `,
                function (err, rows) {
                    if (err) {
                        return reply.code(500).send({ success: false, error: "Erreur serveur" })
                    }

                    return reply.code(200).send({ success: true, message: "Utilisateurs retournés", data: rows })
                }
            )
        }
    }
]
