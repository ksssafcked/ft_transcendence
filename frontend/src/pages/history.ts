import { handleLogout } from "./account.js"

interface Match {
    id: number
    player1_id: number
    player2_id: number
    player1_username: string
    player2_username: string
    player1_avatarUrl: string
    player2_avatarUrl: string
    player1_hue: number
    player2_hue: number
    score1: number
    score2: number
    winner_id: number
    created_at: string
}

async function loadMatchHistory() {
    const res = await fetch("/api/matches")

    const result = await res.json()

    if (!result.success) {
        if (result.code === 1)
            return handleLogout()
        return
    }

    const matches: Match[] = result.data

    const formatDateFR = (dateString: string): string => {
        const d: Date = new Date(dateString)
        return d.toLocaleDateString("fr-FR").replace(/\//g, " / ")
    }

    const container = document.querySelector('#match-history')!
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
                        ${m.winner_id == m.player1_id ? `
                            <span>🏆</span>
                        ` : ``}
                    </div>
                    <span id="score" class="title-reverse">${m.score1} &ndash; ${m.score2}</span>
                    <div class="flex flex-row justify-end items-center gap-[1rem] min-w-0">
                        ${m.winner_id == m.player2_id ? `
                            <span>🏆</span>
                        ` : ``}
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

                <p class="text-[#000] text-center italic">
                    ${formatDateFR(m.created_at)}
                </p>
            </article>
        `).join("")
    }
}

export function renderHistory(app: HTMLElement) {
    app.innerHTML = `
    <div id="page-history" class="
        flex flex-col items-center gap-[1.5rem] p-[1rem]
        animate-page-in
    ">
        <section class="
            card border-[0.125rem] p-[1.25rem] rounded-[2rem]
            flex flex-col gap-[1rem] w-[min(48rem,100%)]
        ">
            <h1 class="title text-center">Historique des parties</h1>

            <div id="match-history" class="flex flex-col gap-[0.75rem]">
                <p class="text-center italic">Aucune partie n'a encore été jouée.</p>
            </div>
        </section>
    </div>
    `

    loadMatchHistory()
}
