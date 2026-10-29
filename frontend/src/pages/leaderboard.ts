import { handleLogout } from "./account.js"
type Player = {
    rank: number
    user: string
    avatar: string
    hue: number
    wins: number
    losses: number
}

type PlayerWithProgression = Player & {
    xp: number
    level: number
    score: number
}

function xpRequiredToReachLevel(level: number) {
  return (level * (level + 1) / 2) * 100;
}


function computeLevelFromXp(xp: number) {
    let level = 0
    while (xp >= xpRequiredToReachLevel(level + 1)) {
        level++
    }
    return level
}

async function loadLeaderboard() {
    const res = await fetch("/api/leaderboard", { credentials: "include" })

    const result = await res.json()

    if (!result.success) {
        if (result.code === 1)
            return handleLogout()
        return
    }

    const data: Player[] = (result.data ?? []).map((u: any, i: number): Player => ({
        rank: i + 1,
        user: u.username,
        avatar: u.avatarUrl,
        hue: u.hue,
        wins: Number(u.wins ?? 0),
        losses: Number(u.losses ?? 0),
    }))

    const dataWithProgression: PlayerWithProgression[] = data.map((p: Player): PlayerWithProgression => {
        const xp = (p.wins - p.losses) * 100;
        const level = computeLevelFromXp(xp)
        return { ...p, xp, level, score: xp }
    })

    dataWithProgression.sort((a,b) => {
        if (b.score !== a.score) return b.score - a.score
        return a.user.localeCompare(b.user)
    })

    let rank = 1;
    for (let i = 0; i < dataWithProgression.length; i++){
        if (i > 0 && dataWithProgression[i].score < dataWithProgression[i - 1].score){
            rank = i + 1
        }
        dataWithProgression[i].rank = rank
    }

    const container = document.querySelector('#leaderboard-list')!
    if (dataWithProgression.length > 0) {
        container.innerHTML = dataWithProgression.map((p: PlayerWithProgression) => {
            const isTop3 = p.rank <= 3
            return `
                <article ${isTop3 ? `style="
                    background: linear-gradient(
                        90deg,
                        oklch(0.80 0.25 ${p.hue - 30}),
                        oklch(0.80 0.25 ${p.hue}),
                        oklch(0.80 0.25 ${p.hue + 30})
                    );
                "` : ``} class="
                    p-[1rem] gap-[1rem] rounded-[1rem]
                    border-[0.125rem] border-[#FFF]
                    flex flex-row
                ">
                    <span class="
                        title-reverse bg-[#FFF]
                        w-[4rem] p-[1rem]
                        grid place-items-center
                        mt-[-1.125rem] mb-[-1.125rem] ml-[-1.125rem]
                        rounded-tl-[1rem] rounded-bl-[1rem]
                    ">
                        ${p.rank}
                    </span>

                    <div class="flex flex-row flex-wrap flex-1 items-center gap-[1rem] min-w-0">
                        <img
                            src="/api${p.avatar}"
                            alt="Avatar de ${p.user}"
                            style="background: oklch(0.70 0.25 ${p.hue});"
                            class="w-[2rem] h-[2rem] border-[0.125rem] border-[#FFF] rounded-full object-cover sp:hidden"
                        >
                        <a
                            href="/@${p.user}"
                            style="color: #FFF;"
                            class="link font-bold truncate"
                        >${p.user}</a>

                        <div class="flex flex-row flex-wrap gap-[1rem]">
                            <span>
                                Lv. ${p.level}
                            </span>

                            <span>
                                Xp. ${p.xp}
                            </span>
                        </div>
                    </div>

                    <div class="
                        flex flex-col justify-center items-center
                        w-[12rem] sc:w-[16rem] xs:w-[10rem] xxs:w-[10rem] bg-[#FFF]
                        gap-[0.5rem] p-[1rem]
                        mt-[-1.125rem] mr-[-1.125rem] mb-[-1.125rem]
                        rounded-tr-[1rem] rounded-br-[1rem]
                    ">
                        <div class="flex flex-row items-center gap-[0.5rem] w-full">
                            <span class="title-reverse">${p.wins}</span>
                            <div class="flex flex-row flex-1 border-[0.125rem] border-[#000] rounded-[0.25rem] overflow-hidden">
                                <span style="
                                    flex: ${p.wins != 0 || p.losses != 0 ? p.wins : 1};
                                    background: oklch(0.95 0.25 ${p.hue});
                                " class="
                                    h-[0.25rem]
                                "></span>

                                <span class="
                                    ${(p.wins == 0 && p.losses != 0) || (p.losses == 0 && p.wins != 0) ? 'hidden' : ''}
                                    w-[0.125rem] h-[0.25rem] bg-[#000]
                                "></span>

                                <span style="
                                    flex: ${p.wins != 0 || p.losses != 0 ? p.losses : 1};
                                    background: oklch(0.80 0.25 ${p.hue});
                                " class="
                                    h-[0.25rem]
                                "></span>
                            </div>
                            <span class="title-reverse">${p.losses}</span>
                        </div>
                        <div class="flex flex-row justify-between gap-[0.5rem] w-full">
                            <span class="text-[#000] leading-[1rem]">Victoires</span>
                            <span class="text-[#000] leading-[1rem]">Défaites</span>
                        </div>
                    </div>
                </article>
            `
        }).join("")
    }
}

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
    status: string
    score1: number
    score2: number
    winner_id: number
    created_at: string
}

async function loadMatchHistory() {
    const res = await fetch("/api/matches?limit=11", { credentials: "include" })

    const result = await res.json()

    if (!result.success) {
        if (result.code === 1)
            return handleLogout()
        return
    }

    const matches: Match[] = result.data.filter((m: Match) => m.status === 'finished' || m.status === 'abandoned')

    const formatDateFR = (dateString: string): string => {
        const d: Date = new Date(dateString)
        return d.toLocaleDateString("fr-FR").replace(/\//g, " / ")
    }

    const container = document.querySelector('#match-history')!
    if (matches.length > 0) {
        container.innerHTML = matches.map((m, i) => `
            ${i >= 10 ? `
                <a href="/history" class="button">Voir l'historique complet</a>
            ` : `
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
                                style="background: oklch(0.70 0.25 ${m.player1_hue});" 
                                class="w-[2rem] h-[2rem] rounded-full object-cover sp:hidden"
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
                                style="background: oklch(0.70 0.25 ${m.player2_hue});" 
                                class="w-[2rem] h-[2rem] rounded-full object-cover sp:hidden"
                            >
                        </div>
                    </div>

                    <p class="text-[#000] text-center italic">
                        ${formatDateFR(m.created_at)}
                    </p>
                </article>
            `}
        `).join("")
    }
}

export function renderLeaderboard(app: HTMLElement) {
    app.innerHTML = `
    <div id="page-leaderboard" class="
        flex flex-col items-center gap-[1.5rem] p-[1rem]
        animate-page-in
    ">

        <!-- CLASSEMENT -->
        <section class="
        card border-[0.125rem] p-[1.25rem] rounded-[2rem]
        flex flex-col gap-[1rem] w-[min(48rem,100%)]
        ">
            <h1 class="title text-center">Classement</h1>

            <div id="leaderboard-list" class="flex flex-col gap-3">
                <p class="text-center italic">Aucun joueur n'a encore été classé.</p>
            </div>
        </section>

        <!-- HISTORIQUE -->
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

    loadLeaderboard()
    loadMatchHistory()
}
