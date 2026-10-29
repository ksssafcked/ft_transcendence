const { addAchievements } = require('./utils/achievements.js')
const { broadcastGameNotif } = require('./chatHandler.js')
let frame = 1000 / 60

class Obstacle {
    w
    h
    x
    y
    v
    hGame
    wGame
    isLeft
    inputUp = false
    inputDown = false

    constructor(isLeft = true, hGame = 720, wGame = 960, v = 512, w = 16, h = 64, y = 2) {
        this.w = w
        this.hGame = hGame
        this.wGame = wGame
        this.h = h
        this.y = y
        this.v = v
        this.isLeft = isLeft
        this.x = isLeft ? 0 : (wGame - w)
    }

    isInside(oldx, x, w) {
        const xToCheck = this.isLeft ? this.x + this.w : this.x

        if (oldx > xToCheck && x <= xToCheck) {
            return true
        }
        if (oldx + w < xToCheck && x + w >= xToCheck) {
            return true
        }
        return false
    }

    setInput(key, pressed) {
        if (key === 'w') this.inputUp = pressed
        if (key === 's') this.inputDown = pressed
    }

    updatePosition(dt) {
        const move = this.v * dt
        if (this.inputUp) this.go_up(move)
        if (this.inputDown) this.go_down(move)
    }

    go_up(move) {
        this.y = Math.max(this.y - move, 0)
    }

    go_down(move) {
        this.y = Math.min(this.y + move, this.hGame - this.h)
    }
}

class Ball {
    game
    wGame
    hGame
    d
    x
    y
    vx
    vy
    x_start
    v_start
    v_plus
    dir
    cooldown

    constructor(game, hGame = 720, wGame = 960, v_max = 768, d = 16, x = (wGame - d) / 2) {
        this.game = game
        this.hGame = hGame
        this.wGame = wGame
        this.d = d
        this.x = 0
        this.y = 0
        this.vx = 0
        this.vy = 0
        this.x_start = x
        this.v_start = v_max / 2
        this.v_plus = 0
        this.dir = Math.random() < 0.5 ? -1 : 1
        this.cooldown = 0
        this.place_start()
    }

    place_start() {
        this.cooldown = 1
        this.v_plus = this.v_start

        this.x = this.x_start
        this.y = Math.random() * (this.hGame - this.d)

        let span = Math.random() * 2 - 1

        const angle_max = Math.PI / 4
        const angle = span * angle_max

        this.vx = this.dir * this.v_start * Math.cos(angle)
        this.vy = this.v_start * Math.sin(angle)
        this.dir *= -1
    }

    move(dt) {
        if (this.cooldown > 0) {
            this.cooldown -= dt
        } else {
            this.x += this.vx * dt
            this.y += this.vy * dt
        }
    }

    isOutside(oldy, y) {
        if (oldy + this.d < this.hGame && y + this.d >= this.hGame) return true
        if (oldy > 0 && y <= 0) return true
        return false
    }

    checkDistToPad(obstacle, oldx, x) {
        const padX = x > oldx ? obstacle.x : obstacle.x + obstacle.w
        return x > padX ? x - padX : padX - (x + this.d)
    }

    checkDistToWall(oldy, y) {
        return y > oldy ? this.hGame - y + this.d : y
    }

    bounceWall(dt) {
        const distToWall = Math.min(this.hGame - (this.y + this.d), this.y)
        const vyStep = this.vy * dt
        const distFinal = Math.abs(vyStep)
        if (distFinal === 0) return null
        const frac = distToWall / distFinal
        const time = (dt * 1000) * frac
        const hitTop = distToWall === this.y
        const remaining = distFinal - distToWall
        const finalY = hitTop ? 0 + remaining : (this.hGame - this.d) -remaining
        const message = {
            scope: 'game',
            type: 'game_data',
            ball: {
                x: this.x + this.vx * dt,
                y: finalY
            },
            time: time,
        }
        this.vy *= -1

        this.y = hitTop
            ? 0 + remaining
            : (this.hGame - this.d) - remaining

        return message
    }

    checkClosestPad(obstacle1, obstacle2) {
        const x1 = obstacle1.x
        const x2 = obstacle2.x
        if (this.vx < 0)
            return x1 < x2 ? obstacle1 : obstacle2
        else
            return x1 < x2 ? obstacle2 : obstacle1
    }

    getHitBox(paddle) {
        return this.vx > 0
            ? paddle.x - this.d
            : paddle.x + paddle.w
    }

    getFractionInter(xTarget, dx) {
        if (dx === 0)
            return -1
        const frac = (xTarget - this.x) / dx
        return frac
    }

    bouncePadd(obstacle1, obstacle2, dt) {
        const paddle = this.checkClosestPad(obstacle1, obstacle2)
        const xTarget = this.getHitBox(paddle)

        const vxStep = this.vx * dt
        const vyStep = this.vy * dt

        const frac = this.getFractionInter(xTarget, vxStep)
        if (frac < 0 || frac > 1) return null

        const interY = this.y + vyStep * frac

        if (interY + this.d < paddle.y || interY > paddle.y + paddle.h) return null

        const time = dt * frac * 1000
        const message = {
            scope: 'message',
            type: 'game_data',
            ball: { x: xTarget, y: interY },
            time: time
        }

        const paddleMiddle = paddle.y + paddle.h / 2
        const ballMiddle = interY + this.d / 2

        let span = (ballMiddle - paddleMiddle) / (paddle.h / 2)
        span = Math.max(-1, Math.min(span, 1))

        const angleMax = Math.PI / 4
        const angle = span * angleMax

        this.v_plus /= 2
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy) + this.v_plus

        const dir = (this.vx < 0) ? 1 : -1

        this.vx = dir * speed * Math.cos(angle)
        this.vy = speed * Math.sin(angle)

        const remainingFrac = 1 - frac
        this.x = xTarget + this.vx * dt * remainingFrac
        this.y = interY + this.vy * dt * remainingFrac

        return message
    }

    bounceToClosest(obstacle1, obstacle2, oldx, oldy, dt) {
        const vxStep = this.vx * dt
        const vyStep = this.vy * dt

        const paddle = this.checkClosestPad(obstacle1, obstacle2)
        const distToPad = this.checkDistToPad(paddle, oldx, this.x + vxStep)
        const distToWall = this.checkDistToWall(oldy, this.y + vyStep)
        return distToWall < distToPad ? this.bounceWall(dt) : this.bouncePadd(obstacle1, obstacle2, dt)
    }

    checkBounce(obstacle1, obstacle2, dt) {
        const vxStep = this.vx * dt
        const vyStep = this.vy * dt

        const newX = this.x + vxStep
        const newY = this.y + vyStep

        if ((obstacle1.isInside(this.x, newX, this.d) || obstacle2.isInside(this.x, newX, this.d)) && this.isOutside(this.y, newY)) {
            return this.bounceToClosest(obstacle1, obstacle2, this.x, this.y, dt)
        }
        if (obstacle1.isInside(this.x, newX, this.d) || obstacle2.isInside(this.x, newX, this.d)) {
            return this.bouncePadd(obstacle1, obstacle2, dt)
        }
        else if (this.isOutside(this.y, newY)) {
            return this.bounceWall(dt)
        }
        return null
    }

    score(obstacle1, obstacle2) {
        if (this.x + this.d < obstacle1.x) {
            this.game.addScore(1)
            this.place_start()
            this.game.sendScore()
        }
        if (this.x > obstacle2.x + obstacle2.w) {
            this.game.addScore(0)
            this.place_start()
            this.game.sendScore()
        }
    }
}

const { sendMessageToUser } = require('./chatHandler.js')
const db = require('../data/connection.js')

class Client {
    /**
 * @param {number} userId
 */
    constructor(userId, isLeft) {
        /** @type {number} */
        this.userId = userId
        /** @type {string} */
        this.state = 'OFFLINE'
        /** @type {boolean} */
        this.isLeft = isLeft
    }
}


class GameState {
    id
    maxScore = 10
    hGame = 720
    wGame = 960
    paused = true
    loopInterval = null
    cleanupTimer = null
    startTimer = null
    reconnectPlayerLeft = null
    reconnectPlayerRight = null
    lastTime = 0
    gameOver
    status
    /** @type {Map<string, Client>} */
    spectators = new Map()

    constructor(id, player1Id = null, player2Id = null) {
        this.id = id
        this.player1Id = player1Id
        this.player2Id = player2Id
        this.leftUserId = player1Id
        this.rightUserId = player2Id
        /** @type {Map<string, Client>} */
        this.players = new Map()
        /** @type {Ball} */
        this.ball = new Ball(this, this.hGame, this.wGame)
        /** @type {Map<string, Obstacle>} */
        this.paddles = new Map()
        /** @type {Record<string, number>} */
        this.score = { [0]: 0, [1]: 0 }
        /** @type {boolean} */
        this.gameOver = false
        this.status = 'waiting'
        this.cleanupTimer = setTimeout(() => this.checkGameLaunched(), 1 * 30 * 1000)
        this.lastTime = Date.now()
    }

    addSpectator(userId) {
        if (this.players.has(userId) || this.spectators.has(userId)) return
        const spectator = new Client(userId, null)
        this.spectators.set(userId, spectator)

        this.sendGameInfoToPlayer(userId, 'game_info', this.id)
    }

    addScore(index) {
        if (index > 1 || index < 0)
            return
        this.score[index]++
    }

    checkGameOver() {
        if (this.score[0] >= this.maxScore || this.score[1] >= this.maxScore) {
            if (!this.gameOver)
                this.saveToDatabase('finished')
            return true
        }
        return false
    }

    startGame() {
        this.paused = false
        if (this.gameOver)
            return
        if (this.startTimer)
            this.startTimer = null
        const time = Date.now()
        let dt = Math.min((time - this.lastTime) / 1000, 0.1)

        if (this.checkGameOver()) {
            this.gameOver = true
            deleteGame(this.id)
            return
        }
        const [obstacle1, obstacle2] = this.paddles.values()

        obstacle1.updatePosition(dt)
        obstacle2.updatePosition(dt)

        const result = this.ball.checkBounce(obstacle1, obstacle2, dt)

        if (result !== null) {
            const stepDurationMs = dt * 1000
            const interTime = time - (stepDurationMs - result.time)
            this.sendInterGameData(interTime, result.ball.x, result.ball.y)
        }
        else if (result === null) {
            this.ball.move(dt)
            this.ball.score(obstacle1, obstacle2)
        }
        this.sendDirectGameData(time)
        this.lastTime = time
    }

    checkGameLaunched() {
        if (this.players.size !== 2) {
            this.saveToDatabase('abandoned')
            deleteGame(this.id)
        }
        const leftPlayer = this.players.get(this.leftUserId)
        const rightPlayer = this.players.get(this.rightUserId)
        if (!leftPlayer || !rightPlayer || leftPlayer.state === 'OFFLINE' || rightPlayer.state === 'OFFLINE') {
            this.saveToDatabase('abandoned')
            deleteGame(this.id)
        }
    }

    checkReconnectionLeft(userId) {
        this.reconnectPlayerLeft = null
        if (this.players.size !== 2) {
            this.saveToDatabase('abandoned')
            deleteGame(this.id)
        }
        const player = this.players.get(userId)
        if (!player)
            return
        if (player.state === 'DISCONNECTED')
        {
            this.saveToDatabase('abandoned', this.rightUserId)
            deleteGame(this.id)
        }
    }

    checkReconnectionRight(userId) {
        this.reconnectPlayerRight = null
        if (this.players.size !== 2) {
            this.saveToDatabase('abandoned')
             deleteGame(this.id)
        }
        const player = this.players.get(userId)
        if (!player)
            return
        if (player.state === 'DISCONNECTED')
        {
            this.saveToDatabase('abandoned', this.leftUserId)
            deleteGame(this.id)
        }
    }

    getOtherPlayer(userId) {
        for (const [id, player] of this.players.entries()) {
            if (id !== userId)
                return player
        }
    }

    pauseGame(userId) {
        if (this.loopInterval) {
            clearInterval(this.loopInterval)
            this.loopInterval = null
        }
        if (this.startTimer) {
            clearTimeout(this.startTimer)
            this.startTimer = null
        }
        this.paused = true
        const player = this.players.get(userId)
        if (!player)
            return
        this.setUserStatus(userId, 'DISCONNECTED')
        const secondPlayer = this.getOtherPlayer(userId)
        const msg = {
            scope: 'game',
            type: 'game_pause',
            token: this.id
        }
        if (secondPlayer && secondPlayer.state === 'READY') {
            sendMessageToUser(secondPlayer.userId, msg)
        }
        for (const userId of [...this.spectators.keys()]) {
            sendMessageToUser(userId, msg)
        }
        if (player.isLeft) {
            if (!this.reconnectPlayerLeft)
                this.reconnectPlayerLeft = setTimeout(() => this.checkReconnectionLeft(userId), 30 * 1000)
        } else {
            if (!this.reconnectPlayerRight)
                this.reconnectPlayerRight = setTimeout(() => this.checkReconnectionRight(userId), 30 * 1000)
        }
    }

    sendInterGameData(time, x, y) {
        const [paddle1, paddle2] = this.paddles.values()
        const message = {
            scope: 'game',
            type: 'game_data',
            ball: {
                x: x,
                y: y,
                cooldown: this.ball.cooldown
            },
            time: time,
            paddles: {
                left: {
                    y: paddle1.y
                },
                right: {
                    y: paddle2.y
                }
            },
            score1: this.score[0],
            score2: this.score[1],
        }
        for (const userId of [...this.players.keys(), ...this.spectators.keys()]) {
            sendMessageToUser(userId, message)
        }
    }

    sendDirectGameData(time) {
        const [paddle1, paddle2] = this.paddles.values()
        const message = {
            scope: 'game',
            type: 'game_data',
            ball: {
                x: this.ball.x,
                y: this.ball.y,
                cooldown: this.ball.cooldown
            },
            time: time,
            paddles: {
                left: {
                    y: paddle1.y
                },
                right: {
                    y: paddle2.y
                }
            },
            score1: this.score[0],
            score2: this.score[1]
        }
        for (const userId of [...this.players.keys(), ...this.spectators.keys()]) {
            sendMessageToUser(userId, message)
        }
    }

    sendScore() {
        const message = {
            scope: 'game',
            type: "game_score",
            score1: this.score[0],
            score2: this.score[1],
            time: Date.now(),
            ball: {
                x: this.ball.x,
                y: this.ball.y,
                vx: this.ball.vx,
                vy: this.ball.vy,
                dir: this.ball.dir,
                cooldown: this.ball.cooldown
            }
        }
        for (const userId of [...this.players.keys(), ...this.spectators.keys()]) {
            sendMessageToUser(userId, message)
        }
    }

    sendEndGame(status, winner) {
    let winnerId = null

    const playerIds = Array.from(this.players.keys())

    if (playerIds.length !== 2) {
        status = 'deleted'
    } else if (this.score[0] === 0 && this.score[1] === 0) {
        status = 'deleted'
    } else if (status === 'abandonned' && !winner) {
        status = 'deleted'
    } else if (status === 'abandonned' && winner) {
        winnerId = winner
    } else {
        winnerId = this.score[0] > this.score[1] ? playerIds[0] : playerIds[1]
    }

    const send = (winnerUsername = null) => {
        const message = {
        scope: 'game',
        type: 'game_over',
        gameId: this.id,
        status,
        winnerId,
        winnerUsername,
        score1: this.score[0],
        score2: this.score[1],
        }

        for (const userId of [...this.players.keys(), ...this.spectators.keys()]) {
            sendMessageToUser(userId, message)
        }
    }

    if (!winnerId) return send(null)

    db.get(`SELECT username FROM users WHERE id = ?`, [winnerId], (err, row) => {
        if (err) {
        console.error("DB error winner username:", err)
        return send(null)
        }
        send(row?.username ?? null)
    })
    }


    addPlayerToGame(userId) {
        if (this.players.size === 2 || this.players.get(userId)) {
            const player = this.players.get(userId)
            if (!player)
                return
            player.state = 'CONNECTED'
            if (player.isLeft) {
                clearTimeout(this.reconnectPlayerLeft)
                this.reconnectPlayerLeft = null
            } else {
                clearTimeout(this.reconnectPlayerRight)
                this.reconnectPlayerRight = null
            }
        }
        else {
            let isLeft
            if (this.leftUserId && userId === this.leftUserId) isLeft = true
            else if (this.rightUserId && userId === this.rightUserId) isLeft = false
            else isLeft = !this.paddles.size
            const player = new Client(userId, isLeft)
            const obst = new Obstacle(isLeft)
            this.paddles.set(userId, obst)
            this.players.set(userId, player)
        }
    }


    isPlayerConnected(userId) {
        return (this.players.get(userId) ? true : false)
    }

    setUserStatus(userId, state) {
        const player = this.players.get(userId)
        if (!player) return
        player.state = state
    }

    allUsersReady() {
        if (this.players.size !== 2) return false
        for (const player of this.players.values()) {
            if (player.state !== 'READY')
                return false
        }
        return true
    }

    saveToDatabase(status, winnerId = null) {
		if (status !== 'waiting' && status !== 'playing')
			this.sendEndGame(status, winnerId)
		if (status === 'abandoned' && (this.players.size !== 2 || (this.score[0] === 0 && this.score[1] === 0))) {
			db.run('DELETE FROM matches WHERE id = ?', [this.id], (err) => {
			if (err) console.error(`Impossible de supprimer match ${this.id}:`, err.message)
			})
			return
		}

		const leftScore = this.score[0]
		const rightScore = this.score[1]

		const score1 = (this.player1Id === this.leftUserId) ? leftScore : rightScore
		const score2 = (this.player2Id === this.leftUserId) ? leftScore : rightScore

		let winner = winnerId
		if (status === 'finished' && !winnerId) {
			if (score1 > score2) winner = this.player1Id
			else if (score2 > score1) winner = this.player2Id
			else winner = null
		}

		const sql = `
			UPDATE matches
			SET score1 = ?,
				score2 = ?,
				winner_id = ?,
				status = ?
			WHERE id = ?
		`

		const params = [score1, score2, winner, status, this.id]

		db.run(sql, params, async (err) => {
			if (err) console.error(`Erreur match ${this.id}:`, err.message)
			else {
			await updateAchievementsAfterMatch(this.id)
                if (status === 'playing') {
                    broadcastGameNotif('game_broadcast', this.player1Id, this.player2Id, this.id)
                }
			}
		})
    }

    async sendGameInfoToPlayer(userId, type, token) {
        const isSpectator = this.spectators.has(userId)
        const isPlayer = this.players.has(userId)
        if (!isPlayer && !isSpectator)
            return
        if (this.players.size !== 2 && !isSpectator)
            return

        const [paddle1, paddle2] = this.paddles.values()
        const leftId = this.leftUserId
        const rightId = this.rightUserId

        const rows = await new Promise((resolve, reject) => {
            db.all(
            `SELECT id, username, avatarUrl, hue FROM users WHERE id IN (?, ?)`,
            [leftId, rightId],
            (err, rows) => (err ? reject(err) : resolve(rows || []))
            )
        })

        const byIdUsername = new Map(rows.map(r => [r.id, r.username]))
        const byIdAvatar   = new Map(rows.map(r => [r.id, r.avatarUrl]))
        const byIdHue   = new Map(rows.map(r => [r.id, r.hue]))
        const player = this.players.get(userId)
        const mySide = player ? (player.isLeft === true ? 'Left' : 'Right') : 'Spectator'
        const message = {
            scope: 'game',
            type,
            token,
            time: Date.now(),
            side: mySide,
            players: {
                left: {
                    id: leftId,
                    username: byIdUsername.get(leftId) || "Joueur 1",
                    avatar: byIdAvatar.get(leftId) || "/public/avatars/avatar_1.png",
                    hue: byIdHue.get(leftId) || 0
                },
                right: {
                    id: rightId,
                    username: byIdUsername.get(rightId) || "Joueur 2",
                    avatar: byIdAvatar.get(rightId) || "/public/avatars/avatar_2.png",
                    hue: byIdHue.get(rightId) || 0
                },
            },
            score1: this.score[0],
            score2: this.score[1],
            game: {
                w: this.wGame,
                h: this.hGame
            },
            ball: {
                x: this.ball.x,
                y: this.ball.y,
                d: this.ball.d,
                cooldown: this.ball.cooldown
            },
            paddles: {
                v: paddle1.v,
                w: paddle1.w,
                h: paddle1.h,
                y: paddle1.y,
                left: { y: paddle1.y },
                right: { y: paddle2.y }
            }
        }
        sendMessageToUser(userId, message)
    }

    async sendToPlayers(type, token, time) {
        const message = {
            scope: 'game',
            type,
            token,
            time
        }

        for (const userId of [...this.players.keys(), ...this.spectators.keys()]) {
            sendMessageToUser(userId, message)
        }
	}

}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err)
      resolve(rows)
    })
  })
}

async function updateAchievementsAfterMatch(gameId) {
    try {
        const matchQuery = `
            SELECT player1_id, player2_id, score1, score2
            FROM matches
            WHERE id = ?
        `
        const matches = await dbAll(matchQuery, [gameId])
        if (!matches.length) return console.error(`Partie ${gameId} introuvable`)

        const match = matches[0]
        const players = [
            { id: match.player1_id, score: match.score1 },
            { id: match.player2_id, score: match.score2 }
        ]

        async function getPlayerStats(userId) {
            const statsQuery = `
                SELECT
                    (SELECT COUNT(*) FROM matches m WHERE m.status='finished' AND m.winner_id=? ) AS wins,
                    (SELECT COUNT(*) FROM matches m WHERE m.status='finished' AND (m.player1_id=? OR m.player2_id=?) AND m.winner_id IS NOT NULL AND m.winner_id != ? ) AS losses,
                    (SELECT COUNT(*) FROM matches m WHERE m.status='finished' AND (m.player1_id=? OR m.player2_id=?) ) AS played,
                    (SELECT COUNT(*) FROM matches m WHERE m.status='finished' AND m.winner_id=? AND ((m.player1_id=? AND m.score1=10 AND m.score2=0) OR (m.player2_id=? AND m.score2=10 AND m.score1=0))) AS ten_to_zero
            `
            const res = await dbAll(statsQuery, [userId, userId, userId, userId, userId, userId, userId, userId, userId])
            return res[0]
        }

        const stats1 = await getPlayerStats(players[0].id)
        const stats2 = await getPlayerStats(players[1].id)
        stats1.xp = (stats1.wins - stats1.losses) * 100
        stats2.xp = (stats2.wins - stats2.losses) * 100

        const top10Query = `
            SELECT id
            FROM (
                SELECT u.id,
                       (SELECT COUNT(*) FROM matches m WHERE m.status='finished' AND m.winner_id = u.id) AS wins,
                       (SELECT COUNT(*) FROM matches m WHERE m.status='finished' AND (m.player1_id = u.id OR m.player2_id = u.id) AND m.winner_id IS NOT NULL AND m.winner_id != u.id) AS losses
                FROM users u
            ) stats
            WHERE wins > 0 OR losses > 0
            ORDER BY (wins - losses)*100 DESC, wins DESC, losses ASC, id ASC
            LIMIT 10
        `
        const top10Users = await dbAll(top10Query)

        const achievementsToAdd = []

        function buildUserAchievements(userId, stats) {
            const userAchievements = [
                { user_id: userId, label: '1_victory', value: stats.wins, target: 1 },
                { user_id: userId, label: '3_victories', value: stats.wins, target: 3 },
                { user_id: userId, label: '7_victories', value: stats.wins, target: 7 },
                { user_id: userId, label: '1_defeat', value: stats.losses, target: 1 },
                { user_id: userId, label: '1_game', value: stats.played, target: 1 },
                { user_id: userId, label: '7_games', value: stats.played, target: 7 },
                { user_id: userId, label: '1_level', value: stats.xp, target: 100 },
                { user_id: userId, label: '3_levels', value: stats.xp, target: 600 },
                { user_id: userId, label: '7_levels', value: stats.xp, target: 2800 },
                { user_id: userId, label: '1_total_victory', value: stats.ten_to_zero, target: 1 }
            ]

            userAchievements.forEach(a => {
                if (a.value >= a.target) achievementsToAdd.push({ user_id: a.user_id, label: a.label })
            })
        }

        buildUserAchievements(players[0].id, stats1)
        buildUserAchievements(players[1].id, stats2)

        top10Users.forEach(u => {
            achievementsToAdd.push({ user_id: u.id, label: '1_leaderboard_position' })
        })

        if (achievementsToAdd.length) {
            await addAchievements(achievementsToAdd)
        }

    } catch (err) {
        console.error('Erreur lors de la mise à jour des achievements:', err)
    }
}


/** @type {Map<number, GameState>} */
const games = new Map()

function createGame(gameId, player1Id = null, player2Id = null) {
  const state = new GameState(gameId, player1Id, player2Id)
  if (player1Id) {
    const obst = new Obstacle(true)
    state.paddles.set(player1Id, obst)
    state.players.set(player1Id, new Client(player1Id, true))
  }
  if (player2Id) {
    const obst = new Obstacle(false)
    state.paddles.set(player2Id, obst)
    state.players.set(player2Id, new Client(player2Id, false))
  }
  games.set(gameId, state)
  return state
}

function isUserInAnyGame(userId) {
    for (const [gameId, game] of games.entries()) {
        if (game.players.has(userId)) {
            return gameId
        }
    }
    return null
}

function deleteGame(id) {
    const game = games.get(id)
    if (game) {
        if (game.reconnectPlayerLeft)
            clearTimeout(game.reconnectPlayerLeft)
        if (game.reconnectPlayerRight)
            clearTimeout(game.reconnectPlayerRight)
        if (game.cleanupTimer)
            clearTimeout(game.cleanupTimer)
        if (game.startTimer)
            clearTimeout(game.startTimer)
        if (game.loopInterval)
            clearInterval(game.loopInterval)
        games.delete(id)
    }
}

function pauseGame(userId) {
    const gameId = isUserInAnyGame(userId)
    if (!gameId)
        return 
    const game = games.get(gameId)
    if (game)
        game.pauseGame(userId)
}

async function joinPrivateGame(userId, data) {
    const currentGame = isUserInAnyGame(userId)
    if (currentGame && currentGame !== data.token) {
        return sendMessageToUser(userId, { scope: 'game', type: 'error', message: "Autre partie déjà en cours" })
    }
    let game = games.get(data.token)
    if (!game) {
        const match = await new Promise((resolve) => {
            db.get('SELECT * FROM matches WHERE id = ?', [data.token], (err, row) => {
                if (err) console.error(err)
                resolve(row)
            })
        })
        
        if (!match) return sendMessageToUser(userId, { scope: 'game', type: 'error', message: 'Partie introuvable' })
        if (match.status === 'finished') return sendMessageToUser(userId, { scope: 'game', type: 'error', message: 'Partie terminée' })
        const player1 = match.player1_id || null
        const player2 = match.player2_id || null
        game = createGame(data.token, player1, player2)
        if (!game)
            return sendMessageToUser(userId, { scope: 'game', type: 'error', message: 'Impossible de créer la partie' })
    }
    if (game.players.size === 2 && !game.players.has(userId)) {
        game.addSpectator(userId)
        game.sendGameInfoToPlayer(userId, 'game_info', data.token)
        return sendMessageToUser(userId, { scope: 'game', type: 'info', message: 'Vous êtes spectateur' })
    }
    if (game.players.size !== 2 && !game.players.has(userId)){
        try {
            await new Promise((resolve, reject) => {
                db.run(`
                    UPDATE matches 
                    SET player1_id = ? 
                    WHERE id = ? AND player2_id IS NULL AND player1_id != ?`, [userId, data.token, userId], function(err) {
                        if (err)
                            return reject(err)

                        if (this.changes > 0) {
                            game.addPlayerToGame(userId)
                            resolve(true)
                        } else {
                            reject(new Error("Impossible d'ajouter le joueur."))
                        }
                    })
            })
            for (const id of game.players.keys()) game.sendGameInfoToPlayer(id, 'game_info', data.token)
        } catch (err) {
            console.log(err)
        }
    } else if (game.players.size === 2 && game.players.has(userId)) {
        game.addPlayerToGame(userId)
        game.sendGameInfoToPlayer(userId, 'game_info', data.token)
    }
}

function doesGameExist(token) {
    return games.has(token)
}

function handleUserData(userId, data) {
    const game = games.get(data.token)
    if (!game || game.players.size !== 2) return
    
    const obstacle = game.paddles.get(userId)
    if (obstacle) {
        obstacle.setInput(data.key, data.pressed)
    }
}

function setUserDisconnected(userId) {
    const gameId = isUserInAnyGame(userId)
    if (!gameId)
        return
    const game = games.get(gameId)
    if (!game)
        return
    if (game.players.has(userId)) {
        game.pauseGame(userId)
    } else if (game.spectators.has(userId)) {
        game.spectators.delete(userId)
    }
}

function playerReady(data, userId) {
    const game = games.get(data.token)
    if (!game || game.gameOver)
        return
    if (!game.isPlayerConnected(userId))
        return
    game.setUserStatus(userId, 'READY')
    if (game.allUsersReady()) {
        if (game.startTimer || game.loopInterval)
            return
        if (game.cleanupTimer) {
            clearTimeout(game.cleanupTimer)
            game.cleanupTimer = null
        }

        const future = Date.now() + 5000
        if (game.status !== 'playing') {
            game.status = 'playing'
            game.saveToDatabase('playing')
        }
        game.sendToPlayers('game_start', data.token, future)
        
        game.startTimer = setTimeout(() => {
            game.loopInterval = setInterval(() => game.startGame(), frame)
            game.startTimer = null
        }, future - Date.now())
    }
}

function gameHandler(parsed, user) {
    if (parsed.type === 'join_game') {
        joinPrivateGame(user.userId, parsed)
    }
    else if (parsed.type === 'game_data') {
        handleUserData(user.userId, parsed)
    }
    else if (parsed.type === 'game_ready') {
        playerReady(parsed, user.userId)
    }
    else if (parsed.type === 'game_leave') {
        pauseGame(user.userId)
    }
}

module.exports = {
    createGame,
    deleteGame,
    doesGameExist,
    gameHandler,
    setUserDisconnected
}