import { navigate } from "../scripts/router.js"
import {socketHandler} from '../scripts/socket.js'
import { handleLogout } from "./account.js"

let player1 = `Joueur 1`
let player2 = `Joueur 2`
const wGame = 960
const hGame = 720

let wServer = 960
let hServer = 720

let currentGame: Game | null = null

export class Game {
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    scale = 1
    RENDER_DELAY = 50
    maxScore = 10
    isInitialized = false
    paused = true
    game_over = false
	isSpectator = false
    animationFrame: number | null = null
    leftPaddle: Paddle | null = null
    rightPaddle: Paddle | null = null
    ball: Ball | null = null
    score1 = 0
    score2 = 0
    mySide: 'Left' | 'Right' | null = 'Left'
    serverTimeOffset = 0
    lastTime = Date.now()
    gameId: string
	countdownEl: HTMLElement | null = null
    countdownInterval: number | null = null
	pauseTimeout: number | null = null
    keys: Record<string, boolean> = {}

    btnUp: HTMLElement | null = null
    btnDown: HTMLElement | null = null
    btnPause: HTMLElement | null = null

    boundHandleKeyDown: (e: KeyboardEvent) => void
    boundHandleKeyUp: (e: KeyboardEvent) => void
    boundUpdateSize: () => void
    boundTogglePause: () => void
    boundTouchStartUp: (e: TouchEvent) => void
    boundTouchEndUp: (e: TouchEvent) => void
    boundTouchStartDown: (e: TouchEvent) => void
    boundTouchEndDown: (e: TouchEvent) => void
    boundContextMenu: (e: Event) => void
    constructor(canvas: HTMLCanvasElement, gameId: string) {
        this.canvas = canvas
        this.ctx = canvas.getContext("2d")!
        this.gameId = gameId

        this.boundHandleKeyDown = (e) => {
			const key = e.key.toLowerCase()
			if(key === "w" || key === "s")
				this.press(key)
		}
        this.boundHandleKeyUp = (e) => {
			const key = e.key.toLowerCase()
			if(key === "w" || key === "s")
				this.release(key)
		}
        this.boundUpdateSize = () => this.updateSize()
        this.boundTogglePause = () => this.togglePause()

        this.boundTouchStartUp = (e) => { 
			e.preventDefault()
			this.press("w") 
		}
        this.boundTouchEndUp = (e) => {
			e.preventDefault()
			this.release("w")
		}
        this.boundTouchStartDown = (e) => {
			e.preventDefault()
			this.press("s")

		}
        this.boundTouchEndDown = (e) => {
			e.preventDefault()
			this.release("s")
		}
        this.boundContextMenu = (e) => e.preventDefault()
    }

    start() {
        window.addEventListener("resize", this.boundUpdateSize)
        window.addEventListener("orientationchange", this.boundUpdateSize)
        this.updateSize()

		this.countdownEl = document.getElementById("countdown-display")

		if (!this.isSpectator) {
			window.addEventListener("keydown", this.boundHandleKeyDown)
			window.addEventListener("keyup", this.boundHandleKeyUp)

			this.btnPause = document.getElementById("playBtn")
			this.btnPause?.addEventListener("click", this.boundTogglePause)

			this.btnUp = document.getElementById("button-up")
			this.btnDown = document.getElementById("button-down")
			
			if (this.btnUp) {
				this.btnUp.addEventListener("touchstart", this.boundTouchStartUp, {passive: false})
				this.btnUp.addEventListener("touchend", this.boundTouchEndUp, {passive: false})
				this.btnUp.addEventListener("touchcancel", this.boundTouchEndUp, {passive: false})
				this.btnUp.addEventListener("contextmenu", this.boundContextMenu)
			}
			if (this.btnDown) {
				this.btnDown.addEventListener("touchstart", this.boundTouchStartDown, {passive: false})
				this.btnDown.addEventListener("touchend", this.boundTouchEndDown, {passive: false})
				this.btnDown.addEventListener("touchcancel", this.boundTouchEndDown, {passive: false})
				this.btnDown.addEventListener("contextmenu", this.boundContextMenu)
			}
		}

        const joinMessage = { scope: 'game', type: "join_game", token: this.gameId }
        socketHandler.sendMessage(joinMessage)

        this.loop()
    }

    destroy() {
        this.game_over = true
        this.isInitialized = false

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame)
            this.animationFrame = null
        }
		if (this.countdownInterval) {
            clearInterval(this.countdownInterval)
            this.countdownInterval = null
        }
        if (this.countdownEl) {
            this.countdownEl.classList.add('hidden')
        }

		if (this.pauseTimeout) {
			clearInterval(this.pauseTimeout)
			this.pauseTimeout = null
		}

        window.removeEventListener("keydown", this.boundHandleKeyDown)
        window.removeEventListener("keyup", this.boundHandleKeyUp)
        window.removeEventListener("resize", this.boundUpdateSize)
        window.removeEventListener("orientationchange", this.boundUpdateSize)

		if (!this.isSpectator) {
			window.removeEventListener("keydown", this.boundHandleKeyDown)
			window.removeEventListener("keyup", this.boundHandleKeyUp)

			this.btnPause?.removeEventListener("click", this.boundTogglePause)

			if (this.btnUp) {
				this.btnUp.removeEventListener("touchstart", this.boundTouchStartUp)
				this.btnUp.removeEventListener("touchend", this.boundTouchEndUp)
				this.btnUp.removeEventListener("touchcancel", this.boundTouchEndUp)
				this.btnUp.removeEventListener("contextmenu", this.boundContextMenu)
			}
			if (this.btnDown) {
				this.btnDown.removeEventListener("touchstart", this.boundTouchStartDown)
				this.btnDown.removeEventListener("touchend", this.boundTouchEndDown)
				this.btnDown.removeEventListener("touchcancel", this.boundTouchEndDown)
				this.btnDown.removeEventListener("contextmenu", this.boundContextMenu)
			}
		}

        const leaveMessage = { scope: 'game', type: 'game_leave', token: this.gameId }
        socketHandler.sendMessage(leaveMessage)
    }

    loop = () => {
        if (this.game_over) return

        if (!this.ball || (!this.isSpectator && this.paused) || !this.isInitialized) {
			if (!this.game_over) {
				this.animationFrame = requestAnimationFrame(this.loop)
			}
            return
        }
	
        const now = Date.now()

        const dt = Math.min((now - this.lastTime) / 1000, 0.1)
        this.lastTime = now

        const renderTime = now - this.serverTimeOffset - this.RENDER_DELAY
        const currentServerTime = now - this.serverTimeOffset

        if (this.leftPaddle)
            !this.isSpectator && this.leftPaddle.isMine ? this.leftPaddle.updateMine(this.keys, currentServerTime, dt) : this.leftPaddle.interpolateOpp(renderTime)

        if (this.rightPaddle)
            !this.isSpectator && this.rightPaddle.isMine ? this.rightPaddle.updateMine(this.keys, currentServerTime, dt) : this.rightPaddle.interpolateOpp(renderTime)

        this.ball.interpolateBallPos(renderTime)
		
        if (this.ctx) {
            this.ctx.clearRect(0, 0, wGame, hGame)
            this.ball.draw(this.ctx)
            if (this.leftPaddle) this.leftPaddle.draw(this.ctx, this.scale)
            if (this.rightPaddle) this.rightPaddle.draw(this.ctx, this.scale)
        }

        this.animationFrame = requestAnimationFrame(this.loop)
    }

    press(key: string) {
		if (this.keys[key]) return
        this.keys[key] = true
        const gameUserInput = {scope: 'game', type:"game_data", token: this.gameId, key: key, pressed: true}
        socketHandler.sendMessage(gameUserInput)
    }

    release(key: string) {
		if (!this.keys[key]) return
        this.keys[key] = false
        const gameUserInput = {scope: 'game', type:"game_data", token: this.gameId, key: key, pressed: false}
        socketHandler.sendMessage(gameUserInput)
    }

    togglePause() {
		if (this.countdownEl) {
			this.countdownEl.innerText = "…"
		}
        const gameReadyMessage = {scope: 'game', type: 'game_ready', token: this.gameId}
        socketHandler.sendMessage(gameReadyMessage)
    }

    updateScores() {
        const scoreEl = document.querySelector(`#score`)
        if (scoreEl) scoreEl.innerHTML = `${this.score1} &ndash; ${this.score2}`
    }

    endGame(type: string, winner: string) {
		const popup = document.getElementById("popup") as HTMLDialogElement
		const popupText = document.getElementById("popupText") as HTMLElement
		if (!popup || !popupText)
			navigate('/play')
		if (type === 'finished' && winner) {
			if(popupText) popupText.textContent = `${winner} a gagné !`
			if(popup) popup.showModal()
		} if (type === 'abandoned') {
			if (winner) {
				popupText.textContent = `La partie a été abandonnée !`;
			} else {
				popupText.textContent = `La partie n'a pas été lancée`;
			}
		} else if (type === 'deleted') {
			popupText.textContent = `La partie n'a pas été lancée`;
		}
		this.game_over = true
        popup.showModal()
    }

    setPlayers(u1:string, u2: string, a1:string, a2:string, hue1:number, hue2:number){
        player1 = u1
        player2 = u2
        const username_1 = document.getElementById("username-1")
        const username_2 = document.getElementById("username-2")
        const avatar_1 = document.getElementById("avatar-1") as HTMLImageElement | null
        const avatar_2 = document.getElementById("avatar-2") as HTMLImageElement | null

        if (username_1) username_1.textContent = u1
        if (username_2) username_2.textContent = u2
        if (avatar_1) {
            avatar_1.alt = `Avatar de ${u1}`
            avatar_1.src = `/api${a1}`
            avatar_1.style.background = `oklch(0.70 0.25 ${hue1})`
        }
        if (avatar_2) {
            avatar_2.alt = `Avatar de ${u2}`
            avatar_2.src = `/api${a2}`
            avatar_2.style.background = `oklch(0.70 0.25 ${hue2})`
        }
    }

    updateSize() {
        const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
        const page_game = document.querySelector(`#page-game`)
        if(!page_game) return
        
        const w_page = page_game.clientWidth
        const h_page = page_game.clientHeight

        let w_max, h_max
        if (window.matchMedia("(max-width: 1024px) and (orientation: portrait)").matches) {
            w_max = w_page - 2.25 * rem
            h_max = h_page - 2.25 * rem
        } else if (window.matchMedia("(max-width: 1024px) and (orientation: landscape)").matches) {
            w_max = w_page - 2.25 * rem
            h_max = h_page - 2.25 * rem
        } else {
            w_max = w_page - 4.25 * rem
            h_max = h_page - 4.25 * rem
        }

        let w_display = wGame
        let h_display = hGame

        if (w_display > w_max) {
            w_display = w_max
            this.scale = w_display / wGame
            h_display = this.scale * hGame
        }
        if (h_display > h_max) {
            h_display = h_max
            this.scale = h_display / hGame
            w_display = this.scale * wGame
        }

        if(this.canvas) {
            this.canvas.style.width  = `${wGame * this.scale}px`
            this.canvas.style.height = `${hGame * this.scale}px`
        }
    }

	initializeGame(parsed: any) {
		if (parsed.players?.left && parsed.players?.right) {
			this.setPlayers(
			parsed.players.left.username,
			parsed.players.right.username,
			parsed.players.left.avatar,
			parsed.players.right.avatar,
			parsed.players.left.hue,
			parsed.players.right.hue,
			)
		}

		wServer = parsed.game.w
		hServer = parsed.game.h
		this.ball = new Ball(parsed.ball.x, parsed.ball.y, parsed.ball.d)

		const scaleX = wGame / wServer
		const scaleY = hGame / hServer
		const p = parsed.paddles

		this.leftPaddle = new Paddle(this.mySide === 'Left', 0, p.y * scaleY, p.w * scaleX, p.h * scaleY, p.v * scaleY, parsed.players.left.hue)
		this.rightPaddle = new Paddle(this.mySide === 'Right', (wGame - p.w * scaleX), p.y * scaleY, p.w * scaleX, p.h * scaleY, p.v * scaleY, parsed.players.right.hue)

		if (parsed.side === 'Spectator') {
			this.isSpectator = true
			this.mySide = null
		} else {
			this.mySide = parsed.side || 'Left'
			this.leftPaddle.isMine = this.mySide === 'Left'
			this.rightPaddle.isMine = this.mySide === 'Right'
		}

		const playBtn = document.getElementById("playBtn")
		if (playBtn && this.isSpectator) {
			playBtn.style.display = 'none'
		}
		this.serverTimeOffset = Date.now() - parsed.time
		this.score1 = parsed.score1
		this.score2 = parsed.score2
		this.updateScores()
		this.isInitialized = true
	}

	handleGameData(message: any) {
		const serverTime = message.time
		const paddles = message.paddles
		if (!this.isInitialized || !this.leftPaddle || !this.rightPaddle || !this.ball)
			return

		const scaleY = hGame / hServer
		this.leftPaddle.isMine ? this.leftPaddle.reconcileMine(paddles.left.y * scaleY, serverTime) : this.leftPaddle.addOppSnapshot(paddles.left.y * scaleY, serverTime)
		this.rightPaddle.isMine ? this.rightPaddle.reconcileMine(paddles.right.y * scaleY, serverTime) : this.rightPaddle.addOppSnapshot(paddles.right.y * scaleY, serverTime)
		this.ball.handle_infos(message)
	}

	showCountdown(delay: number, targetTime: number) {
		if (this.countdownEl) {
			this.countdownEl.classList.remove('hidden')
			this.countdownEl.innerText = String(Math.ceil(delay / 1000))
		}
		if (this.countdownInterval) {
			clearInterval(this.countdownInterval)
			this.countdownInterval = null
		}
		this.countdownInterval = window.setInterval(() => {
			const left = targetTime - (Date.now() - this.serverTimeOffset)
			let seconds = Math.ceil(left / 1000)
			if (seconds < 0)
				seconds = 0
			if (this.countdownEl) {
				this.countdownEl.innerText = seconds > 0 ? String(seconds) : '0'
			}
			if (left <= 0 && this.countdownInterval && this.countdownEl) {
				clearInterval(this.countdownInterval)
				this.countdownInterval = null
				this.countdownEl?.classList.add('hidden')
			}
		}, 100)
		this.pauseTimeout = window.setTimeout(() => { 
			this.paused = false
		}, delay)
	}

	showPause() {
		if (this.paused) {
			if (this.pauseTimeout) {
				clearTimeout(this.pauseTimeout)
				this.pauseTimeout = null
			}
			if (this.countdownInterval) {
				clearInterval(this.countdownInterval)
				this.countdownInterval = null
			}
			if (this.countdownEl) {
				this.countdownEl.innerText = "PAUSE"
				this.countdownEl.classList.remove('hidden')
			}
		} else {
			if (this.countdownEl) {
				this.countdownEl.classList.add('hidden')
			}
		}
	}

    handleSocketData(parsed: any) {
        const {type} = parsed

        if (type === 'error') {
            alert(parsed.message)
            return navigate('/play')
        }
        if (type === 'game_data' && !this.game_over && (!this.paused || this.isSpectator)) {
            this.handleGameData(parsed)
        } else if (type === 'game_start') {
			if (this.pauseTimeout){
				clearTimeout(this.pauseTimeout)
				this.pauseTimeout = null
			} 
            if (this.countdownInterval) {
				clearInterval(this.countdownInterval)
				this.countdownInterval = null
			}
			const targetTime = new Date(parsed.time)
            const delay = targetTime.getTime() - (Date.now() - this.serverTimeOffset)
			if (delay > 0) {
				this.showCountdown(delay, parsed.time)
			}
            else {
				this.paused = false
				if (this.countdownEl) this.countdownEl.classList.add('hidden')
			}
        } else if (type === 'game_info') {
			this.initializeGame(parsed)

        } else if (type === 'game_score') {
            this.score1 = parsed.score1
            this.score2 = parsed.score2
            this.updateScores()

        } else if (type === 'game_over') {
            this.paused = true
            this.endGame(parsed.status , parsed.winnerUsername)
        } else if (type === 'game_pause') {
			this.paused = true
			this.showPause()
		}
    }
}

class Paddle {
	x: number
	y: number
	w: number
	h: number
	v: number
	hue: number
	isMine: boolean
	localHistory: { serverTime: number, y: number }[] = []
	oppBuffer: { serverTime: number, y: number}[] = []
	serverY: number

	constructor(isMine: boolean, x: number, y: number, w: number, h: number, v: number, hue = 0) {
		this.isMine = isMine
		this.x = x
		this.y = y
		this.serverY = y
		this.w = w
		this.h = h
		this.v = v
		this.hue = hue
	}

	updateMine(keys: Record<string, boolean>, currentServerTime: number, dt: number) {
		if (!currentGame)
			return
		if (!this.isMine)
			return

		const move = this.v * dt

		if (keys['w']) this.y = Math.max(this.y - move, 0)
		if (keys['s']) this.y = Math.min(this.y + move, hGame - this.h)

		this.localHistory.push({ serverTime: currentServerTime, y: this.y})

		if (this.localHistory.length > 60) {
			this.localHistory.shift()
		}
	}

	reconcileMine(serverY: number, packetTime: number) {
		let closestSnapshot = null
		let minDiff = Infinity

		for (const snapshot of this.localHistory) {
			const diff = Math.abs(snapshot.serverTime - packetTime)
			if (diff < minDiff) {
				minDiff = diff
				closestSnapshot = snapshot
			}
		}
		
		if (closestSnapshot && minDiff < 50) {
			const error = serverY - closestSnapshot.y
			if (Math.abs(error) > 1) {
				if (Math.abs(error) > 50) {
					this.y = serverY
					this.localHistory = []
				} 
				else {
					this.y += error
				}
			}
			this.localHistory = this.localHistory.filter(s => s.serverTime > packetTime)
		}
	}

	addOppSnapshot(serverY: number, serverTime: number) {
		if (this.isMine) return

		this.oppBuffer.push({ serverTime: serverTime, y: serverY})

		if (this.oppBuffer.length > 60) {
			this.oppBuffer.shift()
		}
	}

	interpolateOpp(renderTime: number) {
		if (this.isMine || this.oppBuffer.length < 2) return

		const nextSnapshot = this.oppBuffer.find(s => s.serverTime > renderTime)

		let prevSnapshot = null;
		for (let i = this.oppBuffer.length - 1; i >= 0; i--) {
			if (this.oppBuffer[i].serverTime <= renderTime) {
				prevSnapshot = this.oppBuffer[i];
				break;
			}
		}
		if (!nextSnapshot || !prevSnapshot) {
			if (this.oppBuffer.length > 0) {
				const latest = this.oppBuffer[this.oppBuffer.length - 1]
				this.y += (latest.y - this.y) * 0.1 
			}
			return
		}

		const timeDiff = nextSnapshot.serverTime - prevSnapshot.serverTime
		const timeSincePrev = renderTime - prevSnapshot.serverTime
		if (timeDiff <= 0) return

		const t = timeSincePrev / timeDiff

		this.y = prevSnapshot.y + (nextSnapshot.y - prevSnapshot.y) * t
	}

	draw(ctx: CanvasRenderingContext2D, scale: number) {
		const w_border = 2 / scale
		ctx.lineWidth = w_border
		ctx.strokeStyle = `#FFF`
		ctx.fillStyle = `oklch(0.7 0.25 ${this.hue})`
		ctx.beginPath()
		ctx.rect(this.x + w_border / 2, this.y + w_border / 2, this.w - w_border, this.h - w_border)
		ctx.fill()
		ctx.stroke()
	}
}

class Ball {
	d: number
	x: number
	y: number
	cooldown: number
	maxSnapshots: number
	lastSnapshotTime: number
	lastActions: any[]
	constructor(x: number, y: number, d: number) {
		this.d = d
		this.x = x
		this.y = y
		this.cooldown = 0
		this.maxSnapshots = 500
		this.lastSnapshotTime = 0
		this.lastActions = []
	}

	handle_infos(data: any) {
		const x = data.ball.x
		const y = data.ball.y
		this.cooldown = data.ball.cooldown
		
		const infos = {x: x, y:y, time: data.time}

		if (!this.lastActions.length) {
			this.x = x
			this.y = y
		}
		this.lastSnapshotTime = data.time
		this.lastActions.push(infos)
		if (this.lastActions.length > this.maxSnapshots) {
			this.lastActions.shift()
		}
	}

	interpolateBallPos(renderTime: number) {
		if (this.lastActions.length < 2) return

		const nextSnapshot = this.lastActions.find(action => action.time > renderTime)

		let prevSnapshot = null;
		for (let i = this.lastActions.length - 1; i >= 0; i--) {
			if (this.lastActions[i].serverTime <= renderTime) {
				prevSnapshot = this.lastActions[i];
				break;
			}
		}

		if (!nextSnapshot || !prevSnapshot) {
			if (this.lastActions.length > 0) {
				const latest = this.lastActions[this.lastActions.length - 1]
				this.x = latest.x
				this.y = latest.y
			}
			return
		}

		const timeDiff = nextSnapshot.time - prevSnapshot.time
		const timeToRender = renderTime - prevSnapshot.time

		if (timeDiff <= 0) {
			this.x = nextSnapshot.x
			this.y = nextSnapshot.y
			return
		}

		const t = timeToRender / timeDiff

		this.x = prevSnapshot.x + (nextSnapshot.x - prevSnapshot.x) * t
		this.y = prevSnapshot.y + (nextSnapshot.y - prevSnapshot.y) * t
	}

	draw(ctx: CanvasRenderingContext2D) {
		if (!currentGame)
			return
		let r = this.d / 2
		if (this.cooldown > 0) {
			r = r * (1 - this.cooldown)
		}
		ctx.fillStyle = "#FFF"
		ctx.beginPath()
		ctx.arc(this.x + this.d / 2, this.y + this.d / 2, r, 0, Math.PI * 2)
		ctx.fill()
	}
}


export function showLoadingOverlay(gameDiv: HTMLElement) {
	const oldOverlay = document.querySelector(`#socket-loader`)
	if (oldOverlay)
		return
    const overlay = document.createElement('div')
    overlay.id = 'socket-loader'

    overlay.className = `
        absolute inset-0 z-[50] 
        bg-black/60 backdrop-blur-sm 
        rounded-[2rem] flex flex-col items-center justify-center
        animate-page-in
    `
    overlay.innerHTML = `
        <div class="flex flex-col items-center gap-4">
            <div class="w-12 h-12 border-4 border-t-[#F80] border-[#FFF]/20 rounded-full animate-spin"></div>
            <span class="text-white title animate-pulse">Connecting...</span>
        </div>
    `
    gameDiv.appendChild(overlay)
}

export function hideLoadingOverlay() {
    const overlay = document.getElementById('socket-loader')
    if (overlay) overlay.remove()
}


export function renderGame(app: HTMLElement, id: string) {
	app.innerHTML = `<div id="page-game" class="
		grid place-items-center p-[1rem]

		sp:h-[calc(100vh-4rem)]
		st:h-[100vh]
		sc:h-[calc(100vh-4rem)]

		animate-page-in
	">
		<section class="
			card border-[0.125rem] sc:p-[0.875rem] rounded-[2rem]
			flex flex-col gap-[1rem] relative

			sp:bg-transparent sp:p-0 sp:border-0 sp:rounded-[0rem]
			st:bg-transparent st:p-0 st:border-0 st:rounded-[0rem]
		">
			<div class="
				grid grid-cols-[1fr_auto_1fr] items-center gap-[1rem]
				
				sp:absolute sp:top-[1rem] sp:left-[1rem] sp:right-[1rem] sp:opacity-[50%]
				st:absolute st:top-[1rem] st:left-[1rem] st:right-[1rem] st:opacity-[50%]
			">
				<div class="flex flex-row justify-start items-center gap-[1rem] min-w-0">
					<img
						id="avatar-1"
						src="/api${'/public/avatars/avatar_1.png'}"
						alt="Avatar de ${player1}"
						style="background: oklch(0.70 0.25 ${33}); height: 2rem;" 
						class="w-[2rem] h-[2rem]] rounded-full border-[0.125rem] border-[#FFF] object-cover sp:hidden st:hidden"
					>
					<span id="username-1" class="truncate">${player1}</span>
				</div>
				<span id="score" class="title">0 &ndash; 0</span>
				<div class="flex flex-row justify-end items-center gap-[1rem] min-w-0">
					<span id="username-2" class="truncate">${player2}</span>
					<img
						id="avatar-2"
						src="/api${'/public/avatars/avatar_2.png'}"
						alt="Avatar de ${player2}"
						style="background: oklch(0.70 0.25 ${233}); height: 2rem;" 
						class="w-[2rem] h-[2rem]] rounded-full border-[0.125rem] border-[#FFF] object-cover sp:hidden st:hidden"
					>
				</div>
			</div>

			<div class="absolute inset-0 flex flex-col opacity-[0%] cc:animate-disappearance">
				<button id="button-up" tabindex="-1" class="
					flex-1 p-[1rem] pb-[0.5rem] select-none touch-none cursor-default
					outline-none focus:outline-none focus-visible:outline-none active:outline-none
				">
					<div class="
						border-[0.125rem] border-[#FFF]
						h-[100%] grid place-items-center
					">
						<svg class="w-[4rem] h-[4rem]" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
							<g clip-path="url(#clip0_115_2)">
								<path d="M1 32L32 1L63 32H47V63H17V32H1Z" fill="white" stroke="white" stroke-width="2" stroke-linejoin="round"/>
							</g>
							<defs>
								<clipPath id="clip0_115_2">
									<rect width="64" height="64" fill="white"/>
								</clipPath>
							</defs>
						</svg>
					</div>
				</button>
				<button id="button-down" tabindex="-1" class="
					flex-1 p-[1rem] pt-[0.5rem] select-none touch-none cursor-default
					outline-none focus:outline-none focus-visible:outline-none active:outline-none
				">
					<div class="
						border-[0.125rem] border-[#FFF]
						h-[100%] grid place-items-center
					">
						<svg class="w-[4rem] h-[4rem]" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
							<g clip-path="url(#clip0_115_42)">
								<path d="M1 32L32 63L63 32H47V1H17V32H1Z" fill="white" stroke="white" stroke-width="2" stroke-linejoin="round"/>
							</g>
							<defs>
								<clipPath id="clip0_115_42">
									<rect width="64" height="64" fill="white"/>
								</clipPath>
							</defs>
						</svg>
					</div>
				</button>
			</div>

			<div id="countdown-display" class="
                absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                text-[6rem] font-bold text-white z-20
            ">
				<button id="playBtn" class="
					button text-[1rem]
					sc:text-[2rem] sc:leading-[2rem]
					sc:h-[3rem] sc:w-[32rem] sc:rounded-[1.5rem]
				">
					Prêt
				</button>
			</div>

			<canvas
				id="pongCanvas"
				width="960" height="720"
				class="
					m-auto
					rounded-[1rem]
					border-[0.125rem]
					border-t-[#FFF] border-b-[#FFF]
					border-l-transparent border-r-transparent

					sp:bg-[#FFF]/25 sp:border-l-[#FFF]/25 sp:border-r-[#FFF]/25
					st:bg-[#FFF]/25 st:border-l-[#FFF]/25 st:border-r-[#FFF]/25
				"
			></canvas>

			<dialog id="popup" class="
				bg-[#FFF] p-[1rem] rounded-[2rem]
				text-center w-[min(32rem,100%)]
			">
				<div class="flex flex-col gap-[1rem]">
					<h2 id="popupText" class="title-reverse">Test</h2>
					<span class="text-[4rem]">
						🏆
					</span>
					<a href="/play" id="popupBtn" class="button-reverse">
						Retour aux parties
					</a>
				</div>
			</dialog>
		</section>
	</div>`

	const gameDiv = app.querySelector(`#page-game`) as HTMLElement
	showLoadingOverlay(gameDiv)

    const onDisconnect = () => {
        if (!document.body.contains(app)) return
        showLoadingOverlay(gameDiv)
    }

    const onAuthError = () => {
        if (!document.body.contains(app)) return
        const popupText = document.getElementById("popupText")
        if (popupText) {
			popupText.textContent = "Session expirée. Veuillez vous reconnecter."
		}
		handleLogout();
        (document.getElementById("popup") as HTMLDialogElement).showModal()
    }

    const onReconnect = () => {
        if (!document.body.contains(app)) return
        hideLoadingOverlay()
        renderGameWithSocket(app, id)
    }

    socketHandler.setGameCallbacks({onDisconnect, onAuthError, onReconnect })

    socketHandler.init()

	return () => {
		if (currentGame) {
            currentGame.destroy()
            currentGame = null
        }
		player1 = `Joueur 1`
		player2 = `Joueur 2`
        socketHandler.setGameCallbacks(null)
    }
}

export function handleSocketDataforGame(parsed: any) {
    if (currentGame) {
        currentGame.handleSocketData(parsed)
    }
}

export function renderGameWithSocket(app: HTMLElement, id: string) {
	if (currentGame) {
        currentGame.destroy()
        currentGame = null
    }

	const canvas = document.getElementById("pongCanvas") as HTMLCanvasElement
    currentGame = new Game(canvas, id)
    currentGame.start()
}