const signinRoute = require('./signin')
const loginRoute = require('./login')
const profileRoute = require('./profile')
const friendsRoute = require('./friends')
const matchesRoute = require('./matches')
const authRoute = require('./auth')
const leaderboardRoute = require('./leaderboard')
const chatRoute = require('./chat')
const gameRoute = require('./games')

module.exports = [
    ...signinRoute,
    ...loginRoute,
    ...authRoute,
    ...leaderboardRoute,
    ...profileRoute,
    ...friendsRoute,
    ...matchesRoute,
    ...chatRoute,
    ...gameRoute,
    {
        method: 'GET',
        url: '/api',
        handler: (request, reply) => {
            return reply.code(200).send({ success: true, message: "Bienvenue sur l'API de Holy Pong" })
        }
    }
]