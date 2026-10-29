import { navigate } from "../scripts/router.js";

export function renderSignin(app: HTMLElement) {
    let userId = localStorage.getItem("userId")
    let username = localStorage.getItem("username")    
    if (userId && username) {
		return navigate(`/@${username}`)
	}

    app.innerHTML = `<div id="page-signin" class="
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
            <form id="signinForm" class="flex flex-col gap-[1rem]">
                <h1 class="text-[32px] title">Inscription</h1>
                <input
                    type="text"
                    id="username"
                    placeholder="Nom d'utilisateur"
                    required
                    class="input"
                />
                <input
                    type="email"
                    id="email"
                    placeholder="Adresse e-mail"
                    required
                    class="input"
                />
                <input
                    type="password"
                    id="password"
                    placeholder="Mot de passe"
                    required
                    class="input"
                />
                <input
                    type="password"
                    id="confirmPassword"
                    placeholder="Confirmer le mot de passe"
                    required
                    class="input"
                />

                <button
                    type="submit"
                    class="button"
                >
                    S'inscrire
                </button>

                <p>Déjà inscrit ?
                    <a href="/login" id="loginLink" class="link">
                        Se connecter
                    </a>
                </p>
            </form>
        </section>
    </div>`

    const form = document.getElementById("signinForm") as HTMLFormElement;
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = (document.getElementById("username") as HTMLInputElement).value.trim();
        const email = (document.getElementById("email") as HTMLInputElement).value.trim();
        const password = (document.getElementById("password") as HTMLInputElement).value;
        const confirmPassword = (document.getElementById("confirmPassword") as HTMLInputElement).value;

        if (!username || !email || !password || !confirmPassword) {
            alert("Tous les champs sont obligatoires")
            return
        }

        if (username.length < 1 || username.length > 32) {
            alert("Le nom d'utilisateur doit contenir 1 à 32 caractères")
            return
        }
        const usernameRegex = /^[A-Za-z0-9._-]{1,32}$/;
        if (!usernameRegex.test(username)) {
            alert("Le nom d'utilisateur ne peut contenir que des lettres, chiffres, points, tirets et underscores")
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            alert("Adresse e-mail invalide")
            return
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            alert("Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre")
            return
        }
        if (password !== confirmPassword) {
            alert("Les mots de passe ne correspondent pas")
            return
        }
        try {
            const res = await fetch("/api/signin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
                credentials: "include"
            })

            const result = await res.json()

            if (!result.success) {
                alert(result.error)
                return;
            }
            navigate("/login?from=signin")
        } catch (err) {
            alert("Erreur serveur")
        }
    })
}