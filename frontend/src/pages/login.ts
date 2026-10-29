import { renderChat } from "../components/chat.js"
import { navigate } from "../scripts/router.js"
import { handleLogout } from "./account.js"

export function renderLogin(app: HTMLElement) {
    let userId = localStorage.getItem("userId")
    let username = localStorage.getItem("username")
    if (userId && username) {
		return navigate(`/@${username}`)
	}

    const params = new URLSearchParams(window.location.search)

    app.innerHTML = `<div id="page-login" class="
		grid place-items-center p-[1rem]

		sp:min-h-[calc(100vh-4rem)]
		st:min-h-[100vh]
		sc:min-h-[calc(100vh-4rem)]

		animate-page-in
	">
        <section class="
			w-[min(32rem,100%)] text-center
			card border-[0.125rem] p-[0.875rem] rounded-[2rem]
			flex flex-col gap-[1rem]
		">
            <form id="loginForm" class="flex flex-col gap-[1rem]">
                <h1 class="text-[32px] title">Connexion</h1>

                ${params.get('from') === 'signin' ? `
                    <span class="message">
                        Vous avez bien été inscrit !
                    </span>
                ` : ``}

                ${params.get('from') === 'logout' ? `
                    <span class="message">
                        Vous avez bien été déconnecté !
                    </span>
                ` : ``}

                <input
                    type="email" 
                    name="email"
                    placeholder="Email" 
                    required 
                    class="input"
                />
                <input
                    type="password" 
                    name="password"
                    placeholder="Mot de passe" 
                    required 
                    class="input"
                />
                <button
                    type="submit" 
                    class="button"
                >
                    Se connecter
                </button>

                <p>
                    Pas encore inscrit ?
                    <a href="/signin" id="registerLink" class="link">
                        S'inscrire
                    </a>
                </p>
            </form>
        </section>
    </div>`

    // Gestion du formulaire de login
    const form = document.getElementById("loginForm") as HTMLFormElement
    form.addEventListener("submit", async (e) => {
        e.preventDefault()

        const email = (form.elements.namedItem("email") as HTMLInputElement).value
        const password = (form.elements.namedItem("password") as HTMLInputElement).value

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
                credentials: "include"
            })

            const result = await res.json()

            if (!result.success) {
                alert(result.error)
                return
            }

            const data = result.data

            localStorage.setItem("userId", data.userId)
            localStorage.setItem("username", data.username)
            localStorage.setItem("hue", data.hue)

            document.documentElement.style.setProperty(`--hue`, data.hue)

            renderChat()
            navigate(`/@${data.username}`)
        } catch (err) {
            alert("Erreur serveur")
        }
    })
}
