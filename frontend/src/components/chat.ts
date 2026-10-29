import { handleLogout} from "../pages/account.js"

const MAX_DM_LEN = 256;

export interface User {
    id: string
	username: string
    hue: number
}

export interface Message {
    id:string
    type: string
	sender_id: string
	sender_username: string
    player1_username: string
    player2_username: string
    read: boolean
	content: string
}

export class Channel {
    public readonly convId: string
    
	private users: Map<string, User>
	private messages: Message[]
    private typing: Map<string, string>
    private type: string

    private blocked: boolean = false;

    setBlocked(b: boolean) { this.blocked = b; }
    isBlocked() { return this.blocked; }


	constructor(id:string, type:string) {
        this.convId = id
		this.users = new Map()
		this.messages = []
        this.typing = new Map()
        this.type = type
	}
    
	addUsers(users: User[]) {
        users.forEach(user => {
            this.users.set(user.id, user);
		})
	}
	removeUser(userId:string) {
        this.users.delete(userId)
	}

    updateUsername(userId: string, newName: string) {
        const user = this.users.get(userId)
        if (user) {
            user.username = newName
            this.users.set(userId, user)
        }
    }
    
	hasUser(userId: string) {
        return this.users.has(userId)
	}
	addMessages(msgs: Message[]) {
        if (!msgs)
            return
        msgs.forEach(msg => {
            this.messages.push(msg)
		})
	}
    
    getMessages() {
        return this.messages
    }

    getUsername(userId: string) {
        const user = this.users.get(userId)
        if (!user) return "Unknown"
        return (user.username)
    }

    getUserHue(userId: string): number {
        return this.users.get(userId)?.hue ?? 0
    }

    getType() {
        return this.type
    }

    addTyping(userId: string) {
        const username = this.getUsername(userId)
        this.typing.set(userId, username)
    }

    removeTyping(userId: string) {
        this.typing.delete(userId)
    }

    getNameTyping() {
        return Array.from(this.typing.values())
    }
}

import { socketHandler } from "../scripts/socket.js";
import { navigate } from "../scripts/router.js";

export function renderChat() {
    const header = document.querySelector(`#chat`)!
    header.innerHTML = `
        <section id="flow" inert class="
            fixed right-0 z-[15]
            w-[min(32rem,100%)]

            sp:top-[0rem] sp:bottom-[4rem]
            st:top-[0rem] st:bottom-[0rem]
            sc:top-[4rem] sc:bottom-[0rem]

            flex flex-col gap-[1rem]
            card backdrop-blur-[1rem]
            chat-size:border-l-[0.125rem] chat-size:pl-[0.875rem]
        ">
            
        </section>
        <button id="button-toggle-chat" class="
            conserve-focus
            soft-button fixed
            z-[20] right-[1rem]
            bottom-[1rem] sp:bottom-[5rem]
        ">
            <svg class="path-open w-[1.5rem] h-[1.5rem]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12H9.51428L5.51428 16V12H3.51428L3.51432 5H14V9M12 12V9H14M12 12V16H14V20L18 16H22.2501L22.2501 9H14" stroke-width="2" stroke-linejoin="round"/>
            </svg>
            <svg class="path-close w-[1.5rem] h-[1.5rem] absolute" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.93591 5.76422L5.76434 2.93579L12 9.1715L18.2358 2.93579L21.0642 5.76422L14.8285 11.9999L21.0642 18.2356L18.2358 21.0641L12 14.8284L5.76434 21.0641L2.93591 18.2356L9.17162 11.9999L2.93591 5.76422Z" stroke="black" stroke-width="2" stroke-linejoin="round"/>
            </svg>
        </button>
        
    `
    const chat = document.querySelector(`#chat`)!
    const isOpen = chat.classList.contains("open");
    const flow = document.querySelector(`#flow`) as HTMLElement
    const button_toggle_chat = document.querySelector(`#button-toggle-chat`) as HTMLButtonElement
    
    flow.inert = !isOpen

    button_toggle_chat.addEventListener("click", () => {
        const open = chat.classList.toggle("open")
        
        flow.inert = !open

        if (open && activeChatId && activeChatId !== 'global') {
            socketHandler.sendMessage({
                scope: 'chat',
                type: 'read',
                convId: activeChatId
            });
        }
    })
    flow.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full w-full p-6 text-center gap-6 animate-page-in">
            <div class="relative w-12 h-12">
                <div class="absolute inset-0 border-4 border-[#80F]/20 rounded-full"></div>
                <div class="absolute inset-0 border-4 border-t-[#80F] rounded-full animate-spin"></div>
            </div>
            <div class="flex flex-col gap-2">
                <h3 class="text-xl font-bold text-white animate-pulse">Connecting to Chat...</h3>
                <p class="text-white/60 text-sm max-w-[20rem]">
                    Nous préparons vos conversations et la liste d'amis. Veuillez patienter.
                </p>
            </div>
        </div>
    `;
    function resetData() {
        if (channels)
            channels.clear()
        if (activeChatId)
            activeChatId = 'global'
    }
    const onDisconnect = () => {
        resetData()
        flow.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full w-full p-6 text-center gap-6 animate-page-in">
                <div class="relative w-12 h-12">
                    <div class="absolute inset-0 border-4 border-[#80F]/20 rounded-full"></div>
                    <div class="absolute inset-0 border-4 border-t-[#80F] rounded-full animate-spin"></div>
                </div>
                <div class="flex flex-col gap-2">
                    <h3 class="text-xl font-bold text-white animate-pulse">Connexion...</h3>
                    <p class="text-white/60 text-sm max-w-[20rem]">
                        Tentative de connexion au serveur.
                    </p>
                </div>
            </div>
        `;
    }
    const onAuthError = () => {
        resetData()
        flow.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full w-full p-4 text-center gap-4 animate-page-in">
                <h3 class="text-xl font-bold text-white">Non connecté</h3>
                <p class="text-white/80">Votre session a expiré ou est invalide.</p>
                <a href="/login" class="button whitespace-nowrap" data-link>
                    Se connecter
                </a>
            </div>
        `;
    }
    const onReconnect = () => {
        renderFullChat(); 
    }
    socketHandler.setChatCallbacks({
        onDisconnect,
        onAuthError,
        onReconnect
    });
    
    if (socketHandler.socket && socketHandler.socket.readyState === WebSocket.OPEN) {
        onReconnect();
    } else {
        onDisconnect();
        socketHandler.init();
    }
}

export function renderFullChat() {
    if (channels)
        channels.clear()
    const flow = document.querySelector(`#flow`) as HTMLElement

    flow.innerHTML = `<nav id="channel-nav" class="
                soft-scroll vertical-scroll
                flex flex-row gap-[0.5rem] overflow-x-auto
            ">
                <button id="create-new-chat" convid="0" class="button whitespace-nowrap">
                    +
                </button>
                <dialog class="bg-[#FFF] p-[1rem] rounded-[2rem] text-center w-[min(32rem,100%)]"></dialog>
            </nav>
            <div id="chat-div" class="
                soft-scroll horizontal-scroll
                flex flex-col gap-[0.5rem]
                flex-1 min-h-[0rem] overflow-y-auto
            ">
            </div>
            <div id="typing-indicator" class="text-[0.75rem] leading-[0.75rem] text-white px-[1rem] my-[-0.5rem] h-[0.75rem]"></div>

            <form id="chat-form" class="hidden flex flex-row gap-[0.5rem]">
                <div class="flex-1 relative">
                    <textarea class="textarea w-full h-full" maxlength="256"></textarea>
                    <div id="msg-counter" class="
                        text-[0.75rem] text-white
                        absolute bottom-[0.5rem] right-[0.5rem]
                    ">0 / 256</div>
                </div>
                <div class="pb-[2.5rem] flex flex-col gap-[0.5rem]">
                    <button type="submit" class="soft-button">
                        <svg class="w-[1.5rem] h-[1.5rem]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6.50427 2.47632L23 12L6.50427 21.5338V15.1763L12 12L6.50427 8.82708V2.47632Z" stroke-width="2" stroke-linejoin="round"/>
                        </svg>
                    </button>

                    <button type="button" id="plus-button" class="soft-button">
                        <svg class="w-[1.5rem] h-[1.5rem]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" stroke="black" stroke-width="2"/>
                            <path d="M12 5C13.1046 5 14 4.10457 14 3C14 1.89543 13.1046 1 12 1C10.8954 1 10 1.89543 10 3C10 4.10457 10.8954 5 12 5Z" stroke="black" stroke-width="2"/>
                            <path d="M12 23C13.1046 23 14 22.1046 14 21C14 19.8954 13.1046 19 12 19C10.8954 19 10 19.8954 10 21C10 22.1046 10.8954 23 12 23Z" stroke="black" stroke-width="2"/>
                        </svg>
                    </button>

                    <dialog id="plus-popup" class="bg-[#FFF] p-[1rem] rounded-[2rem] text-center w-[min(32rem,100%)]">
                        <div class="flex flex-col gap-[1rem]">
                            <button id="invite-game-btn" class="button-reverse">Inviter</button>
                            <a id="view-user-btn" class="button-reverse">Voir le profil</a>
                            <button id="block-user-btn" class="button-reverse">Bloquer</button>
                        </div>
                    </dialog>
                </div>
            </form>
            
            <p id="chat-start" class="pr-[3rem] italic">
                Sélectionnez une conversation pour commencer
            </p>`
    
    const plus_button = document.querySelector(`#plus-button`) as HTMLButtonElement
    const plus_popup = document.querySelector(`#plus-popup`) as HTMLDialogElement

    plus_button.addEventListener('click', () => {
        plus_popup.showModal()
    })

    plus_popup.addEventListener('click', (e) => {
        const rect = plus_popup.getBoundingClientRect()
        const is_in_dialog = (rect.top <= e.clientY
                         && e.clientY <= rect.top + rect.height
                         && rect.left <= e.clientX
                         && e.clientX <= rect.left + rect.width)
        if (!is_in_dialog) {
            plus_popup.close()
        }
    })

    const navChannel = document.querySelector(`#channel-nav`) as HTMLElement
    const form = document.querySelector('#chat-form')!
    const clientInput = form.querySelector('textarea')! 

    const counter = document.querySelector("#msg-counter") as HTMLElement | null;

    clientInput.addEventListener("input", () => {
    if (clientInput.value.length > MAX_DM_LEN) {
        clientInput.value = clientInput.value.slice(0, MAX_DM_LEN);
    }

    if (counter) counter.textContent = `${clientInput.value.length} / ${MAX_DM_LEN}`;

    if (clientInput.value.length > 0) handleWriting();
    else handleStopWriting();
    });


    clientInput.addEventListener('input', () => {
        if (clientInput.value.length > 0) {
            handleWriting()
        } else {
            handleStopWriting();
        }
    })

    const viewBtn = document.querySelector('#view-user-btn') as HTMLLinkElement
    viewBtn.addEventListener('click', () => {
        const plus_popup = document.querySelector(`#plus-popup`) as HTMLDialogElement
        plus_popup.close()
    })

    const blockBtn = document.querySelector('#block-user-btn')!;
    blockBtn.addEventListener('click', async () => {
        const plus_popup = document.querySelector(`#plus-popup`) as HTMLDialogElement
        plus_popup.close()
        const channel = channels.get(activeChatId);

        if (!channel) return

        try {
            const res = await fetch('/api/chat/block', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ convId: activeChatId }),
                credentials: 'include'
            })
            const result = await res.json();

            if (!result.success) {
                if (result.code === 1)
                    return handleLogout()
                alert(result.message)
            }
            else {
                if (result.success) {
                    const channel = channels.get(activeChatId);
                    if (channel) channel.setBlocked(result.data.blocked);

                    toggleInputBlocked(result.data.blocked);
                }

            }
        } catch (err) {
            console.log(err)
        }
    })

    const inviteBtn = document.querySelector('#invite-game-btn')!;
    inviteBtn.addEventListener('click', async () => {
        const plus_popup = document.querySelector(`#plus-popup`) as HTMLDialogElement
        plus_popup.close()
        const channel = channels.get(activeChatId);
        
        if (!channel) return;

        try {
            const res = await fetch('/api/games/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ convId: activeChatId }),
                credentials: 'include'
            });
            const result = await res.json();

            if (result.success) {
                const data = result.data
                const msg = {
                    type: 'invite',
                    sender_id: data.sender_id,
                    sender_username: data.sender_username,
                    read: data.read,
                    content: data.gameId
                };
                addMessageToChat(activeChatId, msg);
            } else {
                switch (result.code) {
                    case 1:
                        alert("Erreur : Vous n'êtes pas connecté");
                        handleLogout()
                        break;
                    case 2:
                        alert("Erreur : Requête invalide (données manquantes)");
                        break;
                    case 3:
                        alert("Erreur : Impossible de trouver cette conversation");
                        break;
                    case 4:
                        alert("Erreur : L'adversaire est introuvable");
                        break;
                    case 5:
                        alert("Impossible d'inviter : Une partie est déjà en cours ou une invitation est déjà en attente avec ce joueur");
                        break;
                    default:
                        alert("Erreur inconnue lors de la création de l'invitation");
                }
            }
        } catch (err) {
            console.log("Failed to create invite:", err);
        }
    });

    form.addEventListener("submit", (e) => {
    e.preventDefault();

    const channel = channels.get(activeChatId);
    if (channel?.isBlocked()) {
        toggleInputBlocked(true);
        return;
    }

    const messageText = clientInput.value.trim();
    if (messageText.length === 0) return;

    handleStopWriting();

    const userId = localStorage.getItem("userId");
    if (!channel || !userId) return;

    const id = crypto.randomUUID();
    const msg: Message = {
        id,
        type: "message",
        sender_id: userId,
        sender_username: channel.getUsername(userId),
        player1_username: '',
        player2_username: '',
        read: false,
        content: messageText,
    };

    addMessageToChat(activeChatId, msg);

    const payload = {
        scope: "chat",
        type: "message",
        id,
        content: messageText,
        convId: activeChatId,
        timestamp: new Date().toISOString(),
    };

    socketHandler.sendMessage(payload);

    clientInput.value = "";
    if (counter) counter.textContent = `0 / ${MAX_DM_LEN}`;
    clientInput.focus();
    });


    const button = document.querySelector(`#create-new-chat`)
    if (button) {
        let dialog = navChannel.querySelector('dialog')!
        button.addEventListener("click", () => {
            renderModalList(dialog, (id, username) => {
                dialog.close()
                getOrCreateConvId(id, username)
            });

            dialog.showModal()
        })
        dialog.addEventListener("click", (e) => {
        const rect = dialog.getBoundingClientRect();
            const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height
                && rect.left <= e.clientX && e.clientX <= rect.left + rect.width);

            if (!isInDialog) {
                dialog.close();
            }
        });
    }
    createAllChats();
}

async function getMessagesOnEmptyChannel(convId: string) {
  try {
    const res = await fetch(`/api/chat/${convId}`, {
      method: "GET",
      credentials: "include",
    });

    const result = await res.json();
    if (!result.success) {
        if (result.code === 1)
            return handleLogout()
        alert(result.message)
        return undefined
    }

    const data = result.data;

    const newChannel = new Channel(convId, data.type);

    if (data.type === "private") newChannel.addUsers(data.users);
    newChannel.addMessages(data.messages);

    newChannel.setBlocked(!!data.blocked);
    channels.set(convId, newChannel);

    return newChannel;
  } catch (err) {
    console.log("channel error:", err);
    return undefined;
  }
}

async function getOrCreateConvId(id: string, username: string) {
    try {
        const res = await fetch(`/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetId: id }),
            credentials: 'include'
        })
        const result = await res.json()
        if (!result.success) {
            if (result.code === 1)
                return handleLogout()
            alert(result.error)
        }

        const data = result.data

        const btn = document.querySelector(`button[convid="${data.convId}"]`)
        if (btn)
            changeChat(btn)
        else {
            const newButton = createButton(username)
            await createNewConversation(id, newButton)
            changeChat(newButton)
            newButton.addEventListener("click", () => {
                changeChat(newButton)
            })
        }
    } catch (err) {
        console.log("channel error:", err)
    }
}

async function renderModalList(
  dialog: HTMLDialogElement,
  onSelect: (id: string, username: string) => void
) {
  dialog.innerHTML = '';

  const container = document.createElement('div');
  container.className = "flex flex-col gap-[1rem]";

  const userId = localStorage.userId;
  const res = await fetch(`/api/user/${userId}/friends`, {
    method: "GET",
    credentials: "include"
  });

  const result = await res.json();

  if (!result.success) {
    if (result.code === 1)
        return handleLogout()
  }

  const friends: { id: string; username: string }[] = result.data ?? [];

  if (friends.length === 0) {
    container.innerHTML = `
      <div class="flex flex-col gap-2 items-center justify-center p-4">
        <h3 class="title-reverse text-lg">Aucun ami</h3>
        <p class="text-black/70 text-sm">
          Ajoutez un ami pour lui envoyer un message.
        </p>
      </div>
    `;
    dialog.appendChild(container);
    return;
  }

  friends.forEach(friend => {
    const btn = document.createElement('button');
    btn.textContent = friend.username;
    btn.className = "button-reverse whitespace-nowrap";

    btn.addEventListener('click', () => {
      onSelect(friend.id, friend.username);
    });

    container.appendChild(btn);
  });

  dialog.appendChild(container);
}

function createButton(username: string) {
    const addButton = document.querySelector('#create-new-chat')!

    const newButton = document.createElement('button')
    newButton.className = "button whitespace-nowrap"
    newButton.innerText = username
    addButton.before(newButton)
    return newButton
}

async function changeChat(button: Element) {
    const chatDiv = document.querySelector(`#chat-div`)!
    if (!chatDiv) return

    const chatButtons = document.querySelectorAll(`#channel-nav > button`)
    chatButtons.forEach(b => {
        b.classList.toggle(`active`, false)
    })
    button.classList.toggle(`active`, true)

    const view_user_btn = document.querySelector(`#view-user-btn`) as HTMLLinkElement
    view_user_btn.href = `/@${button.textContent}`

    const convId = button.getAttribute("convid")
    if (convId) {
        if (convId !== activeChatId) {
            renderMessagesWithId(convId, chatDiv)
            socketHandler.sendMessage({
                scope: 'chat',
                type: 'read',
                convId: convId
            });
            activeChatId = convId
        }
    }
}

async function createAllChats() {
    const res = await fetch("/api/chat/me", {
        credentials: "include"
    });
    const result = await res.json()
    if (!result.success) {
        if (result.code === 1)
            return handleLogout()
    }

    const data = result.data

    const addButton = document.querySelector('#create-new-chat')!
    
    const conversations = data;
    for (const conv of conversations) {
        const btn = createButton(conv.name);
        btn.setAttribute("convid", conv.id);
        
        btn.addEventListener("click", async () => {
            changeChat(btn)
        });
        addButton.before(btn)
    }
}

let activeChatId = 'global'


let channels: Map<string, Channel> = new Map()

async function renderMessagesWithId(convId: string, chatDiv: Element) {
    const chatForm = document.querySelector(`#chat-form`)!
    const chatStart = document.querySelector(`#chat-start`)!
    let channel = channels.get(convId);
    if (!channel) {
        channel = await getMessagesOnEmptyChannel(convId) || undefined;
        if (!channel) return;
    }
    if (channel.getType() === 'public') {
        chatForm.classList.toggle('hidden', true)
        chatStart.classList.toggle('hidden', false)

    } else {
        chatForm.classList.toggle('hidden', false)
        chatStart.classList.toggle('hidden', true)
    }

  const messages = channel.getMessages();
  chatDiv.innerHTML = "";
  renderMessages(messages, channel, chatDiv);

  toggleInputBlocked(channel.isBlocked());
}


async function createNewConversation(targetId: string, button: Element) {
    const chatDiv = document.querySelector(`#chat-div`)!

    const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId }),
        credentials: "include"
	});
    const result = await res.json()
    if (!result.success) {
        if (result.code === 1)
            return handleLogout()
        alert(result.error)
    }

    const data = result.data
    const convId = data.convId
    const channel = new Channel(data.convId, data.type)
    channels.set(data.convId, channel)
    if (data.type === 'private')
        channel.addUsers(data.users)
    channel.addMessages(data.messages)

    channel.setBlocked(!!data.blocked);
    toggleInputBlocked(channel.isBlocked());

    const messages = channel.getMessages()
    if (!messages) return convId
    button.setAttribute("convid", convId)
    return (convId)
}

function renderSystemMessage(msg: Message, chatDiv: Element) {
  const myId = localStorage.getItem("userId");
  if (!myId) return;

  let text = msg.content;

  try {
    const data = JSON.parse(msg.content);

    if (data.kind === "block") {
      if (data.blockerId === myId) {
        text = "Cet utilisateur a été bloqué.";
      } else if (data.blockedId === myId) {
        text = "Cet utilisateur vous a bloqué.";
      } else {
        text = "Une action de blocage a eu lieu.";
      }
    }

    if (data.kind === "unblock") {
      if (data.blockerId === myId) {
        text = "Vous avez débloqué cet utilisateur.";
      } else if (data.blockedId === myId) {
        text = "Cet utilisateur vous a débloqué.";
      } else {
        text = "Une action de déblocage a eu lieu.";
      }
    }
  } catch (_) {}

  const banner = document.createElement("article")
  banner.className = "bg-[#FFF] rounded-[1rem] p-[1rem] text-[#000] opacity-80"
  banner.textContent = text
  chatDiv.appendChild(banner)
}


function renderMessages(messages: Message[], channel: Channel, chatDiv: Element) {
    messages?.forEach((msg) => {
        let username = "Unknown"
        let hue = channel.getUserHue(msg.sender_id)

        if (msg.type === "system") {
            renderSystemMessage(msg, chatDiv)
            return
        }

        if (channel.getType() === "public")
            username = "SYS"
        else username = channel.getUsername(msg.sender_id)

        if (msg.type === "invite")
            createNewInviteInChat(msg, username, hue, chatDiv)
        else if (msg.type === "message")
            createNewMessageInChat(msg, username, hue, chatDiv)
        else if (msg.type === 'notification')
            createGameNotificationInChat(msg, chatDiv)
    });
    const flux = document.querySelector('#chat-div')!
    flux.scrollTo({top: flux.scrollHeight})
}


function createNewMessageInChat(msg: Message, username: string, hue: number,  chatDiv: Element) {
    const messageArticle = document.createElement("article")
    messageArticle.className = "bg-[#FFF] rounded-[1rem] p-[1rem]"

    const p = document.createElement("p")
    p.className = "text-[#000] break-all flex flex-wrap items-end gap-2"

    const span = document.createElement("span")
    span.className = "chat-channel"

    const a = document.createElement("a")
    a.className = "link chat-name"
    a.style.color = `oklch(0.7 0.2 ${hue})`
    a.href = `/@${username}`
    a.innerText = username

    span.appendChild(a);
    span.appendChild(document.createTextNode(" :"))

    p.appendChild(span)
    p.appendChild(document.createTextNode(` ${msg.content}`))

    const myId = localStorage.getItem("userId")
    if (msg.sender_id === myId) {
        const checkContainer = document.createElement("span")
        checkContainer.className = "ml-2 select-none self-end mb-[2px]"
        const colorClass = msg.read ? "text-blue-500" : "text-gray-300"
        checkContainer.innerHTML = `
            <svg class="w-4 h-4 inline-block read-icon ${colorClass}" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/>
            </svg>
        `
        p.appendChild(checkContainer)
    }

    messageArticle.appendChild(p)
    chatDiv.appendChild(messageArticle)
}

async function joinGame(gameId: string) {
    const res = await fetch('/api/games/join', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
        credentials: 'include'
    })

    const data = await res.json()
    if (!data.success) {
        if (data.code === 1)
            return handleLogout()
        else
            alert(data.error)
    } else {
        return navigate(`/${gameId}`)
    }
}

function createNewInviteInChat(msg: Message, username: string, hue: number, chatDiv: Element) {
    const messageArticle = document.createElement("article")
    messageArticle.className = "bg-[#FFF] rounded-[1rem] p-[1rem] flex flex-col gap-[0.5rem]"

    const p = document.createElement("p")
    p.className = "text-[#000] break-words"

    const a = document.createElement("a")
    a.className = "chat-name text-[#0F8]"
    const s = document.createElement("span")

    if (msg.sender_id === localStorage.getItem("userId"))
    {
        s.innerText = `Invitation envoyée`
        p.appendChild(s)
    } else  {
        a.href = `/@${username}`
        a.className = `link chat-name`
        a.style.color = `oklch(0.7 0.2 ${hue})`
        a.innerText = `${username}`

        s.innerText = ` vous invite à jouer`

        p.appendChild(a)
        p.appendChild(s)
    }


    const b = document.createElement("button")
    b.className = "button-reverse w-full"
    b.textContent = "Rejoindre la partie"
    b.addEventListener('click', (e) => {
        e.preventDefault()
        joinGame(msg.content)
    })

    messageArticle.appendChild(p)
    messageArticle.appendChild(b)
    chatDiv.appendChild(messageArticle)
}

function createGameNotificationInChat(msg: any, chatDiv: Element) {
    const article = document.createElement("article")
    article.className = "bg-[#FFF] rounded-[1rem] p-[1rem] flex flex-col gap-[0.5rem]"

    const p = document.createElement("p")
    p.className = "text-[#000] break-words"
    p.textContent = `${msg.player1_username} VS ${msg.player2_username}`
    const sub = document.createElement("small")
    sub.className = "text-[#000] break-words"
    sub.textContent = "Match démarré !"

    article.appendChild(p)
    article.appendChild(sub)
    chatDiv.appendChild(article)
}

export async function addMessageToChat(convId: string, message: any): Promise<void> {
    const msg: Message = message

    const chatDiv = document.querySelector(`#chat-div`)
    if (!chatDiv)
        return
    let channel = channels.get(convId)

    if (!channel) {
        const btn = document.querySelector(`button[convid="${convId}"]`)

        if (!btn) {
            if (message.type === 'public')
                return
            const title = (msg.sender_username && msg.sender_username.trim().length)
                ? msg.sender_username
                : "Nouveau message"

            const newButton = createButton(title)

            newButton.setAttribute("convid", convId)

            await createNewConversation(message.sender_id, newButton)

            const realConvId = newButton.getAttribute("convid") || convId
            channel = channels.get(realConvId)
            if (!channel) return

            try {
                const myId = localStorage.getItem("userId")
                if (myId && channel.getType() === "private") {
                    newButton.innerText = msg.sender_username || title
                }
            } catch {}

            newButton.addEventListener("click", () => changeChat(newButton))
        }
        else
            return
    }
    else
        channel.addMessages([msg])

    if (activeChatId === convId) {
        const hue = channel.getUserHue(msg.sender_id) || 0
        if (msg.type === 'invite')
            createNewInviteInChat(msg, msg.sender_username, hue, chatDiv)
        else if (msg.type === 'message')
            createNewMessageInChat(msg, msg.sender_username, hue, chatDiv)
        else if (msg.type === 'notification')
            createGameNotificationInChat(msg, chatDiv)
        const flux = document.querySelector('#chat-div')!
        flux.scrollTo({top: flux.scrollHeight})
        if (msg.type === 'public')
            return
        const myId = localStorage.getItem("userId");
        const isChatOpen = document.querySelector('#chat')?.classList.contains('open');
        if (msg.sender_id !== myId && isChatOpen) {
            socketHandler.sendMessage({
                scope: 'chat',
                type: 'read',
                convId: convId
            });
        }
    }
}


function handleWriting() {
    const msg = {
        scope: 'chat',
        type: "writing",
        isTyping: true,
        convId: activeChatId
    }
    socketHandler.sendMessage(msg)
}

function handleStopWriting() {
    const msg = {
        scope: 'chat',
        type: "writing",
        isTyping : false,
        convId: activeChatId
    }
    socketHandler.sendMessage(msg)
}

export function changeTyping(convId: string, data: any) {
    if (convId != activeChatId)
        return
    const channel = channels.get(convId)
    const typingDiv = document.querySelector(`#typing-indicator`)
    if (!typingDiv)
        return

    if (!channel) {
        return
    }
    const user = channel.getUsername(data.userId)
    if (!user)
        return
    if (data.isTyping)
        channel.addTyping(data.userId)
    else
        channel.removeTyping(data.userId)
    const names = channel.getNameTyping()
    if (!names.length)
        typingDiv.innerHTML = ""
    else if (names.length === 1)
        typingDiv.innerHTML = `${names[0]} écrit...`
    else {
        const nameString = names.join(', ')
        typingDiv.innerHTML = `${nameString} écrivent...`
    }
}

function handleReadMessages(parsed: any) {
    const channel = channels.get(parsed.convId)
    const myId = localStorage.getItem("userId");
    if (channel) {
        channel.getMessages().forEach(m => {
            if (m.sender_id === myId) {
                m.read = true;
            }
        });
        if (activeChatId === parsed.convId) {
            const grayIcons = document.querySelectorAll('.read-icon.text-gray-300')
            
            grayIcons.forEach(icon => {
                icon.classList.remove('text-gray-300')
                icon.classList.add('text-blue-500')
            });
        }
    }
}

function handleChatUpdate(parsed: any) {
    const { convId, userId, newUsername } = parsed

    if (!convId || !userId || !newUsername)
        return
    const btn = document.querySelector(`button[convid="${convId}"]`)
    if (!btn)
        return
    const channel = channels.get(convId)
    btn.textContent = newUsername
    if (channel) {
        channel.updateUsername(userId, newUsername)
        if (activeChatId === convId) {
            const viewBtn = document.querySelector('#view-user-btn') as HTMLLinkElement
            if (viewBtn)
                viewBtn.href = `/@${newUsername}`
        }
    }
}

export function handleSocketDataforChat(parsed: any) {
  if (parsed.type === 'blocked' && parsed.convId) {
    const channel = channels.get(parsed.convId);
    if (channel) channel.setBlocked(true);
    if (parsed.convId === activeChatId) {
      toggleInputBlocked(true);
    }
    return;
  }

  if (parsed.type === 'writing' && parsed.convId) {
    changeTyping(parsed.convId, parsed)
  }
  else if (parsed.type === 'update') {
    handleChatUpdate(parsed)
  }
  else if ((parsed.type === 'message' || parsed.type === 'invite') && parsed.content && parsed.convId) {
    addMessageToChat(parsed.convId, parsed)
  }
  else if (parsed.type === 'notification') {
    addMessageToChat(parsed.convId, parsed)
  }
  else if (parsed.type === 'read') {
    handleReadMessages(parsed)
  }
}


function toggleInputBlocked(isBlocked: boolean) {
  const textarea = document.querySelector('#chat-form textarea') as HTMLTextAreaElement | null;
  const sendBtn = document.querySelector('#chat-form button[type="submit"]') as HTMLButtonElement | null;

  if (textarea) {
    textarea.disabled = isBlocked;
    textarea.placeholder = isBlocked ? "Utilisateur bloqué" : "";
  }
  if (sendBtn) sendBtn.disabled = isBlocked;
}
