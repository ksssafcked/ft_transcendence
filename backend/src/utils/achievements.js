const db = require('../../data/connection.js')

async function addAchievements(achievements) {
    if (!achievements.length) {
        return
    }

    const drawers = achievements.map(() => '(?, ?, CURRENT_TIMESTAMP)').join(', ')

    const values = []
    for (const a of achievements) {
        values.push(a.user_id, a.label)
    }

    const sql = `
        INSERT INTO achievements (user_id, label, date)
        VALUES ${drawers}
        ON CONFLICT(user_id, label) DO NOTHING
    `

    return new Promise((resolve, reject) => {
        db.run(sql, values, function(err) {
            if (err) {
                return reject(err)
            }

            resolve(this)
        })
    })
}

module.exports = { addAchievements }
