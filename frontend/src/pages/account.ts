import { renderChat } from "../components/chat.js"
import { navigate } from "../scripts/router.js"
import { socketHandler } from "../scripts/socket.js"

interface UserProfile {
    id: string
    username: string
    email: string
    password: string
    hue: number
    avatarUrl?: string
    wins?: number
    losses?: number
}

export function renderAccount(app: HTMLElement) {
    let hue = 180

    load(app)

    async function load(app: HTMLElement) {

        let user : UserProfile;
        try {
            const res = await fetch("/api/me", {
                method: "GET",
                credentials: "include"
            })

            const result = await res.json()

            if (!result.success) {
                if (result.code === 1)
                    return handleLogout()
            }
            user = result.data

            localStorage.setItem("userId", user.id)
            localStorage.setItem("username", user.username)
            localStorage.setItem("hue", user.hue.toString())

        } catch (error) {
            return handleLogout()
        }

        hue = user.hue

        // ---- Structure HTML ----
        app.innerHTML = `<div id="page-profile" class="
            flex flex-col items-center
            gap-[1rem] p-[1rem]
            animate-page-in
        ">

            <section class="
                card border-[0.125rem] p-[0.875rem] rounded-[2rem]
                flex flex-col gap-[1rem] w-[min(48rem,100%)]
            ">
                <h1 class="title text-center">Informations</h1>

                <!-- Avatar -->
                <div class="flex flex-col items-center gap-[1rem]">
                    <img
                        id="avatar-preview"
                        src="/api${user.avatarUrl}"
                        alt="Avatar de ${user.username}"
                        style="background: oklch(0.70 0.25 var(--hue));"
                        class="w-[6rem] h-[6rem] rounded-full border-[0.125rem] border-[#FFF] object-cover"
                    >
                    <input type="file" id="avatar-upload" accept="image/*" class="hidden" />
                    <button id="change-avatar" class="button">
                        Changer l’avatar
                    </button>
                </div>

                <form id="profile-form" class="flex flex-col gap-[1rem]">
                    <div class="flex flex-col gap-[0.5rem]">
                        <label for="hue" class="font-bold leading-[1rem]">Couleur :</label>
                        <input type="range" id="hue" min="0" max="359" step="1"/>
                    </div>

                    <div class="flex flex-col gap-[0.5rem]">
                        <label for="username" class="font-bold leading-[1rem]">Pseudo :</label>
                        <input type="text" id="username" class="input"/>
                    </div>

                    <div class="flex flex-col gap-[0.5rem]">
                        <label for="email" class="font-bold leading-[1rem]">Adresse email :</label>
                        <input type="email" id="email" class="input"/>
                    </div>

                    <div class="flex flex-row flex-wrap gap-[1rem]">
                        <button type="submit" class="button flex-1 whitespace-nowrap">
                            Sauvegarder les modifications
                        </button>

                        <button id="logout-btn" type="button" class="button flex-1 whitespace-nowrap">
                            Se déconnecter
                        </button>
                    </div>
                </form>

            </section>

            <section class="card border-[0.125rem] p-[0.875rem] rounded-[2rem] flex flex-col gap-[1rem] w-[min(48rem,100%)]">
                <h1 class="title text-center">Mes amis</h1>

                <form  class="flex flex-row flex-wrap items-center gap-[1rem]">
                    <input id="add-friend-input" type="text"
                        placeholder="Ajouter un ami..."
                        class="input flex-[16]">
                    <button type="submit" id="add-friend-btn" class="button flex-1">Ajouter</button>
                </form>

                <ul id="friends-list" class="flex flex-col gap-[1rem]"></ul>
            </section>


            <!-- Bouton Retour vers profil -->
            <div class="w-full flex justify-center">
                <a href="/@${user.username}" id="back-to-profile-btn" class="
                    button
                ">
                    Voir mon profil
                </A>
            </div>
        </div>`

        const u_hue = app.querySelector(`#hue`) as HTMLInputElement
        const u_name = app.querySelector(`#username`) as HTMLInputElement
        const u_email = app.querySelector(`#email`) as HTMLInputElement
        u_hue.value = `${user.hue}`
        u_name.value = user.username
        u_email.value = user.email


        // ---- Gestion du changement d’avatar ----
        const avatarUpload = app.querySelector<HTMLInputElement>("#avatar-upload")!
        const avatarPreview = app.querySelector<HTMLImageElement>("#avatar-preview")!
        const avatarSrc = `/api${user.avatarUrl}`

        avatarPreview.src = avatarSrc;
        const changeAvatarBtn = app.querySelector<HTMLButtonElement>("#change-avatar")!

        changeAvatarBtn.addEventListener("click", () => avatarUpload.click())

        avatarUpload.addEventListener("change", async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return

            const previousAvatar = avatarPreview.src;

            // --- ENVOI AU BACKEND ---
            const formData = new FormData()
            formData.append("avatar", file)

            const res = await fetch(`/api/user/${user.id}/avatar`, {
                method: "PUT",
                body: formData,
				credentials: "include"
            })

            const result = await res.json()

            if (!result.success) {
                if (result.code === 1)
                    return handleLogout()
                alert(result.error)
                avatarPreview.src = previousAvatar
                return
            }

            avatarPreview.src = `/api${result.data.avatarUrl}`
            avatarPreview.dataset.path = result.data.avatarUrl
            alert(result.message)
        })

        // ---- Gestion de la modification de couleur ----

        const range = document.querySelector(`#hue`) as HTMLInputElement

        range.addEventListener(`input`, () => {
            const hue = range.value
            document.documentElement.style.setProperty(`--hue`, hue)
        })

        // ---- Gestion du formulaire submit ----
        const profileForm = app.querySelector<HTMLFormElement>("#profile-form")!
        profileForm.addEventListener("submit", async (e) => {
            e.preventDefault()

            const updatedData = {
                username: (app.querySelector("#username") as HTMLInputElement).value,
                email: (app.querySelector("#email") as HTMLInputElement).value,
                hue: (app.querySelector(`#hue`) as HTMLInputElement).value
            };
            if (updatedData.username.length < 1 || updatedData.username.length > 32) {
                alert("Le nom d'utilisateur doit contenir 1 à 32 caractères");
                return;
            }
            const usernameRegex = /^[A-Za-z0-9._-]{1,32}$/;
            if (!usernameRegex.test(updatedData.username)) {
                alert("Le nom d'utilisateur ne peut contenir que des lettres, chiffres, points, tirets et underscores");
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(updatedData.email)) {
                alert("Adresse e-mail invalide");
                return;
            }

            try {
                const res = await fetch(`/api/user/${user.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatedData),
					credentials: "include"
                })

                const result = await res.json()

                if (!result.success) {
                    if (result.code === 1)
                        return handleLogout()
                    alert(result.error)
                    return
                }

                localStorage.setItem("username", updatedData.username)
                localStorage.setItem("hue", updatedData.hue)
                hue = Number(updatedData.hue)
                alert(result.message)

            } catch (err) {
                alert("Erreur réseau")
            }
        })

        // ---- Bouton Retour vers profil ----
        const backToProfileBtn = app.querySelector<HTMLAnchorElement>("#back-to-profile-btn")!
        backToProfileBtn.addEventListener("click", (e) => {
            e.preventDefault()
            const username = localStorage.getItem("username")
            if (username) {
                navigate(`/@${encodeURIComponent(username)}`)
            } else {
                navigate("/login")
            }
        })


        // ---- Déconnexion ----
        const logoutBtn = app.querySelector<HTMLButtonElement>("#logout-btn")!
		logoutBtn.addEventListener("click", () => {
			handleLogout(true)
		})

        async function loadFriends() {
            const res = await fetch(`/api/user/${user.id}/friends`, {credentials: "include"})
            const result = await res.json()

            if (!result.success) {
                if (result.code === 1)
                    return handleLogout()
                return
            }

            const friends = result.data

            const list = app.querySelector("#friends-list")!
            list.classList.toggle(`hidden`, friends.length < 1)

            list.innerHTML = friends
                .map(
                    (f: any) => `
                <li class="flex flex-row justify-between items-center gap-[1rem] p-[1rem] bg-[#FFF] rounded-[1rem]">
                    <div class="flex flex-row items-center gap-[0.5rem]">
                        <img
                            src="/api${f.avatarUrl}"
                            alt="Avatar de ${f.username}"
                            style="background: oklch(0.70 0.25 ${f.hue});"
                            class="w-[3rem] h-[3rem] rounded-full"
                        >
                        <div class="flex flex-col gap-[0.5rem]">
                            <a href="/@${f.username}" class="link font-bold leading-[1rem]" style="color: oklch(0.7 0.2  ${f.hue});">
                                ${f.username}
                            </a>
                        </div>
                    </div>

                    <button data-id="${f.id}" class="remove-friend button-reverse">
                        Supprimer
                    </button>
                </li>
            `
                )
                .join("")

            // Suppression ami
            document.querySelectorAll(".remove-friend").forEach(btn =>
                btn.addEventListener("click", async e => {
                    const fid = (e.target as HTMLElement).dataset.id!
                    const res = await fetch(`/api/user/friends/${fid}/remove`, {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
						credentials: "include"
                    })

                    const result = await res.json()

                    if (!result.success) {
                        if (result.code === 1)
                            return handleLogout()
                        alert(result.error)
                        return
                    }

                    loadFriends()
                })
            )
        }

        loadFriends()


        // Ajout ami
        const addFriendInput = app.querySelector("#add-friend-input") as HTMLInputElement
        const addFriendBtn = app.querySelector("#add-friend-btn") as HTMLButtonElement

        addFriendBtn.addEventListener("click", async (e) => {
            e.preventDefault()
            const name = addFriendInput.value.trim()
            addFriendInput.value = ""
            if (!name) {
                return alert("Nom invalide")
            }

            if (name == user.username) {
                return alert ("Vous ne pouvez pas vous ajouter vous-même")
            }
            if (name.length < 1 || name.length > 32) {
                alert("Un nom d'utilisateur doit contenir 1 à 32 caractères");
                return;
            }
            const usernameRegex = /^[A-Za-z0-9._-]{1,32}$/;
            if (!usernameRegex.test(name)) {
                alert("Un nom d'utilisateur ne peut contenir que des lettres, chiffres, points, tirets et underscores");
                return;
            }

            const res = await fetch(`/api/user/friends/${name}/add`, {
                method: "GET",
				credentials: "include"
            })

            const result = await res.json()

            if (!result.success) {
                if (result.code === 1)
                    return handleLogout()
                return alert(result.error)
            }

            loadFriends()
        })
    }

    return () => {
        document.documentElement.style.setProperty(`--hue`, `${hue}`)
    }
}

export async function handleLogout(from_logout = false) {
    try {
        const res = await fetch("/api/logout", {
            method: "POST",
            credentials: "include"
        });
        if (res.ok) {
            if (socketHandler.socket) {
                socketHandler.disconnect();
            }
            localStorage.removeItem("userId")
            localStorage.removeItem("username")
            localStorage.removeItem("hue")

            navigate(`/login${from_logout ? '?from=logout}' : ''}`)
        }
    } catch (err) {
        console.log("Erreur lors de la déconnexion", err);
    }
}