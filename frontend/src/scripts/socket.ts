import { handleSocketDataforChat } from "../components/chat.js";
import { handleSocketDataforGame } from "../pages/game.js"

export interface SocketCallbacks {
    onDisconnect: () => void
    onAuthError: () => void
    onReconnect: () => void
}

export const socketHandler = {
	socket: null as WebSocket | null,
	isAlreadyAuthorized: false as boolean,
	chatCallbacks: null as SocketCallbacks | null,
    gameCallbacks: null as SocketCallbacks | null,
	reconnectTimer: null as number | null,
	init() {
		if (this.socket && this.socket.readyState === WebSocket.OPEN && this.isAlreadyAuthorized) {
			return;
		}

		if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
			return;
		}

		if (this.socket) {
			this.socket.onopen = null;
			this.socket.onmessage = null;
			this.socket.onerror = null;
			this.socket.onclose = null;
			this.socket.close();
			this.socket = null;
		}
		try {
			const link = window.location.host;
			this.socket = new WebSocket(`wss://${link}/api/ws`);

			this.socket.onclose = (event) => {
				if (event.code === 4001) {
					if (this.chatCallbacks) this.chatCallbacks.onAuthError();
            		if (this.gameCallbacks) this.gameCallbacks.onAuthError();
				}
				else if (event.code === 4002) {
					if (this.chatCallbacks) this.chatCallbacks.onAuthError();
            		if (this.gameCallbacks) this.gameCallbacks.onAuthError();
				}
				else {
					if (this.chatCallbacks) this.chatCallbacks.onDisconnect();
            		if (this.gameCallbacks) this.gameCallbacks.onDisconnect();
					this.reconnectTimer = window.setTimeout(() => {
						this.reconnectTimer = null
                        this.init();
                    }, 3000);
				}
			}
			this.socket.onerror = (event) => {
				console.log("Erreur de connection au WebSocket");
			}
			this.socket.addEventListener("message", (e) => {
				try {
					const parsed = JSON.parse(e.data);
					if (parsed.scope === 'sys') {
						if (parsed.type === 'auth') {
							this.isAlreadyAuthorized = true
							if (this.chatCallbacks) this.chatCallbacks.onReconnect();
            				if (this.gameCallbacks) this.gameCallbacks.onReconnect();
						}
					} else if (parsed.scope === 'chat') 
						handleSocketDataforChat(parsed)
					else if (parsed.scope === 'game')
						handleSocketDataforGame(parsed)
				} catch (error) {
					console.log("Failed to parse Message:", error);
				}
			});

		} catch (err) {
			console.log("Error ws:", err)
			if (this.chatCallbacks) this.chatCallbacks.onDisconnect();
            if (this.gameCallbacks) this.gameCallbacks.onDisconnect();
		}
	},


	disconnect() {
		if (this.chatCallbacks) this.chatCallbacks.onAuthError()
		if (this.gameCallbacks) this.gameCallbacks.onAuthError()
        if (this.socket) {
            this.socket.onopen = null;
            this.socket.onclose = null;
            this.socket.onerror = null;
            this.socket.onmessage = null;
            this.socket.close();
            this.socket = null;
        }
        this.gameCallbacks = null
        this.chatCallbacks = null
        
        if (this.reconnectTimer)  {
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = null
		}
    },
	
	sendMessage(data: any) {
		if (this.socket !== null && this.socket.readyState === 1)
			this.socket.send(JSON.stringify(data))
	},
	setChatCallbacks(callbacks: SocketCallbacks) {
        this.chatCallbacks = callbacks;
        if (callbacks && this.socket?.readyState === WebSocket.OPEN) callbacks.onReconnect();
    },
    setGameCallbacks(callbacks: SocketCallbacks | null) {
        this.gameCallbacks = callbacks;
        if (callbacks && this.socket?.readyState === WebSocket.OPEN) callbacks.onReconnect();
    }
}