import { navigate } from "../scripts/router.js"
import { handleLogout } from "./account.js"
interface Match {
    id: number
    player1_username: string
    player2_username: string
    player1_avatarUrl: string
    player2_avatarUrl: string
    player1_hue: number
    player2_hue: number
}

async function loadMatchesInProgress() {
    const res = await fetch("/api/matches/in-progress")

    const result = await res.json()

    if (!result.success) {
        if (result.code === 1)
            return handleLogout()
        return
    }

    const matches: Match[] = result.data

    const container = document.querySelector('#in-progress')!
    if (matches.length > 0) {
        container.innerHTML = matches.map(m => `
            <article class="
                bg-[#FFF] p-[1rem] gap-[1rem] rounded-[1rem]
                flex flex-col
            ">
                <div class="
                    grid grid-cols-[1fr_auto_1fr] items-center gap-[1rem]
                ">
                    <div class="flex flex-row justify-start items-center gap-[1rem] min-w-0">
                        <img
                            src="/api${m.player1_avatarUrl}"
                            alt="Avatar de ${m.player1_username}"
                            style="background: oklch(0.70 0.25 ${m.player1_hue}); height: 2rem;" 
                            class="w-[2rem] h-[2rem]] rounded-full object-cover sp:hidden"
                        >
                        <a
                            href="/@${m.player1_username}"
                            style="color: oklch(0.70 0.25 ${m.player1_hue});"
                            class="link font-bold truncate"
                        >${m.player1_username}</a>

                    </div>
                    <span id="score" class="title-reverse">VS</span>
                    <div class="flex flex-row justify-end items-center gap-[1rem] min-w-0">

                        <a
                            href="/@${m.player2_username}"
                            style="color: oklch(0.70 0.25 ${m.player2_hue});"
                            class="link font-bold truncate"
                        >${m.player2_username}</a>
                        <img
                            src="/api${m.player2_avatarUrl}"
                            alt="Avatar de ${m.player2_username}"
                            style="background: oklch(0.70 0.25 ${m.player2_hue}); height: 2rem;" 
                            class="w-[2rem] h-[2rem]] rounded-full object-cover sp:hidden"
                        >
                    </div>
                </div>

                <a href="/${m.id}" class="button-reverse">Regarder le duel</a>
            </article>
        `).join("")
    }
}

export function renderPlay(app: HTMLElement) {
    app.innerHTML = `<div id="page-tournaments" class="
        flex flex-col items-center
        gap-[1rem] p-[1rem]

		animate-page-in
	">
        <section class="
            card border-[0.125rem] p-[0.875rem] rounded-[2rem]
            flex flex-col gap-[1rem] w-[min(48rem,100%)]
        ">
            <h1 class="title text-center">Regarder</h1>
            <p class="text-center">Observez des parties en cours&nbsp;!</p>

            <div id="in-progress" class="flex flex-col gap-[1rem]">
                <p class="text-center italic">Aucune partie n'est en cours.</p>
            </div>
        </section>
    </div>`

    // Ajout des parties en cours
    loadMatchesInProgress()
}
