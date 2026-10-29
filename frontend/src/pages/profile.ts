import { renderPieChart } from "../components/pie_chart.js"
import { renderBarChart } from "../components/bar_chart.js"
import { navigate } from "../scripts/router.js"
import { handleLogout } from "./account.js";

function xpRequiredToReachLevel(level: number) {
  return (level * (level + 1) / 2) * 100;
}

function computeLevelFromXp(xp: number) {
    let level = 0
    while (xp >= xpRequiredToReachLevel(level + 1)) level++
    return level
}

type FinishedAchievement = {
    label: string
    date: string
}

type Achievement = {
    id: string
    title: string
    desc: string
    target: number
    getValue: () => number
}

function renderAchievementsHTML(
    achievements: Achievement[],
    fAchievements: FinishedAchievement[]
) {
    const unlockedCount = achievements.filter(a => a.getValue() >= a.target).length

    const formatDateFR = (dateString: string): string => {
        const d: Date = new Date(dateString)
        return d.toLocaleDateString("fr-FR").replace(/\//g, " / ")
    }

    return `
        <section class="
            card border-[0.125rem] p-[0.875rem] rounded-[2rem]
            flex flex-col gap-[1rem] w-[min(48rem,100%)]
        ">
            <h1 class="title text-center">Succès</h1>
            ${fAchievements.length > 0 ? `
                <div class="flex flex-row flex-wrap justify-center gap-[1rem]">
                    ${achievements.map(a => {
                        return fAchievements.some(ach => ach.label === a.id) ? `
                            <article class="
                                gap-[0.5rem] p-[1rem]
                                flex flex-col
                                bg-[#FFF] rounded-[1rem]
                                items-center
                                w-[10rem]
                            ">
                                <span class="leading-[1rem] text-center text-[#000] italic truncate">${formatDateFR(fAchievements.find(ach => ach.label === a.id)!.date)}</span>
                                <img
                                    src="/public/images/${a.id}.svg"
                                    alt="Illustartion de « ${a.title} »"
                                    class="w-[8rem] h-[8rem] object-cover"
                                >
                                <h1 class="soft-title-reverse text-center font-tektur">${a.title}</h1>
                                <span class="leading-[1rem] text-center text-[#000]">${a.desc}</span>
                            </article>
                        ` : ``
                    }).join("")}
                </div>
            ` : `
                <p class="text-center italic">Jouez pour commencer à gagner des récompenses&nbsp;!</p>
            `}
            
            ${fAchievements.length < achievements.length ? `
                <h1 class="title text-center">Disponibles</h1>
                <div class="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-[1rem]">
                    ${achievements.map(a => {
                        const value = a.getValue()
                        return !fAchievements.some(ach => ach.label === a.id) ? `
                            <article class="
                                p-[1rem] gap-[0.5rem] rounded-[1rem]
                                border-[0.125rem] border-[#FFF]
                                flex flex-col
                            ">
                                <div class="flex flex-row flex-1 gap-[1rem]">
                                    <img
                                        src="/public/images/waiting_${a.id}.svg"
                                        alt="Illustartion de « ${a.title} »"
                                        class="w-[4rem] h-[4rem] object-cover mb-[0.5rem]"
                                    >

                                    <div class="flex flex-col justify-between flex-1 gap-[1rem] min-w-0">
                                        <h1 class="soft-title font-tektur">${a.title}</h1>

                                        <div class="flex flex-row justify-between gap-[1rem]">
                                            <span class="leading-[1rem] truncate">${a.desc}</span>
                                            <span class="leading-[1rem] whitespace-nowrap">${value} / ${a.target}</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="flex flex-row bg-[#FFF] border-[0.125rem] border-[#FFF] rounded-[0.25rem] overflow-hidden">
                                    <span style="
                                        flex: ${value};
                                        background: oklch(0.65 0.25 var(--hue));
                                    " class="
                                        rounded-[0.125rem]
                                        h-[0.25rem]
                                    "></span>

                                    <span class="
                                        ${value == 0 || value >= a.target ? 'hidden' : ''}
                                        w-[0.125rem] h-[0.25rem] bg-[#FFF]
                                    "></span>

                                    <span style="
                                        flex: ${a.target - value};
                                    " class="
                                        h-[0.25rem]
                                    "></span>
                                </div>
                            </article>
                        ` : ``
                    }).join("")}
                <div>
            ` : ``}
        </section>
    `
}

function get_labels_last_matches(): string[] {
    const labels: string[] = []
    const today = new Date()

    for (let i = 1; i <= 7; i++) {
        const d = new Date()
        d.setDate(today.getDate() - 7 + i)

        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')

        labels.push(`${day} / ${month}`)
    }

    return labels
}

function get_data_last_matches(matches: any[]): Record<string, number> {
    const today = new Date()
    const last_dates = new Map<string, number>()

    for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(today.getDate() - i)
        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const key = `${day} / ${month}`
        last_dates.set(key, 0)
    }

    if (matches) {
        matches.forEach(match => {
            const d = new Date(match.created_at)
            const day = String(d.getDate()).padStart(2, '0')
            const month = String(d.getMonth() + 1).padStart(2, '0')
            const key = `${day} / ${month}`
            if (last_dates.has(key)) {
                last_dates.set(key, last_dates.get(key)! + 1)
            }
        })
    }

    const result: Record<string, number> = {}
    last_dates.forEach((value, key) => {
        result[key] = value
    })

    return result
}

export function renderProfile(app: HTMLElement, login: string) {
	let chart_cleaners: (() => void)[] = []
    let unmount = () => {}

    load(app, login)
    
    async function load(app: HTMLElement, login: string) {
        // Vérifie l'utilisateur connecté via token
        let connectedUser
        try {
            const res = await fetch("/api/me", {
                credentials: "include"
            })

            const result = await res.json()

            if (!result.success) {
                if (result.code === 1)
                    return handleLogout()
                return navigate("/login")
            }
            connectedUser = result.data
        } catch (err) {
            localStorage.clear()
            return navigate("/login")
        }

        // Récupérer l’utilisateur par login
        const resUser = await fetch(`/api/user/by-username/${login}`, {credentials: "include"})

        const resultUser = await resUser.json()

        if (!resultUser.success) {
            if (resultUser.code === 1)
                return handleLogout()
            app.innerHTML = `<div id="page-404" class="
                grid place-items-center p-[1rem]

                sp:min-h-[calc(100vh-4rem)]
                st:min-h-[100vh]
                sc:min-h-[calc(100vh-4rem)]

                animate-page-in
            ">
                    <h1 class="title">Profil introuvable</h1>
            </div>`
            return
        }
        const user = resultUser.data

        // Récupérer les achievements de l'utilisateur
        const resAchievements = await fetch(`/api/achievements/${user.id}`, { credentials: "include" })

        const resultAchievements = await resAchievements.json()

        if (!resultAchievements.success) {
            if (resultAchievements.code === 1)
                return handleLogout()
            app.innerHTML = `<div id="page-404" class="
                grid place-items-center p-[1rem]

                sp:min-h-[calc(100vh-4rem)]
                st:min-h-[100vh]
                sc:min-h-[calc(100vh-4rem)]

                animate-page-in
            ">
                    <h1 class="title">Erreur serveur</h1>
            </div>`
            return
        }
        const finishedAchievements = resultAchievements.data

        // Modification de la teinte de la page
        document.documentElement.style.setProperty(`--hue`, user.hue)
        unmount = () => {
            document.documentElement.style.setProperty(`--hue`, connectedUser.hue)
        }

        const resMatches = await fetch(`/api/matches/${user.id}`, { credentials: "include" })

        const resultMatches = await resMatches.json()

        if (!resultMatches.success) {
            if (resultMatches.code === 1)
                return handleLogout()
            app.innerHTML = `<div id="page-404" class="
                grid place-items-center p-[1rem]

                sp:min-h-[calc(100vh-4rem)]
                st:min-h-[100vh]
                sc:min-h-[calc(100vh-4rem)]

                animate-page-in
            ">
                    <h1 class="title">Erreur serveur</h1>
            </div>`
            return
        }
        const wins = Number(user.wins ?? 0)
        const losses = Number(user.losses ?? 0)

        const resFriends = await fetch(`/api/user/${user.id}/friends`)

        const resultFriends = await resFriends.json()

        if (!resultFriends.success) {
            if (resultFriends.code === 1)
                return handleLogout()
            return
        }

        const friends = resultFriends.data

        const xp = (wins - losses) * 100
        const level = computeLevelFromXp(xp)

        const currentLevelXpFloor = xpRequiredToReachLevel(level)
        const nextLevelXpFloor = xpRequiredToReachLevel(level + 1)

        const xpIntoLevel = xp - currentLevelXpFloor
        const xpToNext = nextLevelXpFloor - currentLevelXpFloor

        const progressPct = xpToNext > 0 ? Math.round((xpIntoLevel / xpToNext) * 100) : 100

        const gamesPlayed = wins + losses
        const friendsNumber = friends.length
        const totalVictories = 0
        const leaderbordPositions = 0

        const achievements: Achievement[] = [
            {
                id: "1_game",
                title: "Press start&nbsp;!",
                desc: "Jouer 1 partie",
                target: 1,
                getValue: () => gamesPlayed,
            },
            {
                id: "1_friend",
                title: "Best friend&nbsp;!",
                desc: "Avoir 1 ami",
                target: 1,
                getValue: () => friendsNumber,
            },
            {
                id: "1_defeat",
                title: "Game over&nbsp;!",
                desc: "Perdre 1 partie",
                target: 1,
                getValue: () => losses,
            },
            {
                id: "1_victory",
                title: "First win&nbsp;!",
                desc: "Gagner 1 partie",
                target: 1,
                getValue: () => wins,
            },
            {
                id: "1_level",
                title: "Beginner&nbsp;!",
                desc: "Atteindre le niveau 1",
                target: 1,
                getValue: () => level,
            },
            {
                id: "3_victories",
                title: "Regular&nbsp;!",
                desc: "Gagner 3 parties",
                target: 3,
                getValue: () => wins,
            },
            {
                id: "7_games",
                title: "No life&nbsp;!",
                desc: "Jouer 7 parties",
                target: 7,
                getValue: () => gamesPlayed,
            },
            {
                id: "7_victories",
                title: "Arena veteran&nbsp;!",
                desc: "Gagner 7 parties",
                target: 7,
                getValue: () => wins,
            },
            {
                id: "3_levels",
                title: "Fighter&nbsp;!",
                desc: "Atteindre le niveau 3",
                target: 3,
                getValue: () => level,
            },
            {
                id: "7_levels",
                title: "Grand master&nbsp;!",
                desc: "Atteindre le niveau 7",
                target: 7,
                getValue: () => level,
            },
            {
                id: "1_total_victory",
                title: "Sniper&nbsp;!",
                desc: "Gagner 10 à 0",
                target: 1,
                getValue: () => totalVictories,
            },
            {
                id: "1_leaderboard_position",
                title: "Satisfied&nbsp;?",
                desc: "Rejoindre le top 10",
                target: 1,
                getValue: () => leaderbordPositions,
            }
        ]

        app.innerHTML = `<div id="page-profile" class="
            flex flex-col items-center
            gap-[1rem] p-[1rem]
            relative

            animate-page-in
        ">
            <section class="
                card border-[0.125rem] p-[0.875rem] rounded-[2rem]
                flex flex-row gap-[1rem] w-[min(48rem,100%)]
            ">
                <img
                    id="avatar-preview"
                    src="/api${user.avatarUrl}"
                    alt="Avatar de ${user.username}"
                    style="background: oklch(0.70 0.25 ${user.hue});"
                    class="w-[6rem] h-[6rem] rounded-full border-[0.125rem] border-[#FFF] object-cover"
                >

                <div class="flex flex-col flex-1 justify-between gap-[1rem] min-w-0">
                    <h1 class="title truncate">${login}</h1>

                    <div class="flex flex-col gap-[0.5rem]">
                        <div class="flex flex-row justify-between gap-[0.5rem]">
                            <span class="leading-[1rem]">Lv. ${level}</span>
                            <span class="leading-[1rem]">Xp. ${xp} / ${nextLevelXpFloor}</span>
                        </div>

                        <div class="flex flex-row flex-1 bg-[#FFF] border-[0.125rem] border-[#FFF] rounded-[0.25rem] overflow-hidden">
                            <span style="
                                flex: ${progressPct};
                                background: oklch(0.65 0.25 var(--hue));
                            " class="
                                rounded-[0.125rem]
                                h-[0.25rem]
                            "></span>

                            <span class="
                                ${progressPct == 0 || progressPct == 100 ? 'hidden' : ''}
                                w-[0.125rem] h-[0.25rem] bg-[#FFF]
                            "></span>

                            <span style="
                                flex: ${100 - progressPct};
                            " class="
                                h-[0.25rem]
                            "></span>
                        </div>
                    </div>
                </div>
            </section>

            ${renderAchievementsHTML(achievements, finishedAchievements)}

            <section class="
                card border-[0.125rem] p-[0.875rem] rounded-[2rem]
                flex flex-col gap-[1rem] w-[min(48rem,100%)]
            ">
                <h1 class="title text-center">Statistiques</h1>

                <!-- Statistiques -->
                <div class="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-[1rem]">
                    <div id="victories-chart"></div>
                    <div id="games-chart"></div>
                </div>
            </section>

            <section class="
                card border-[0.125rem] p-[0.875rem] rounded-[2rem]
                flex flex-col gap-[1rem] w-[min(48rem,100%)]
            ">
                <h1 class="title text-center">Amis</h1>
                <ul id="friends-list" class="grid grid-cols-[repeat(auto-fit,minmax(6rem,1fr))] gap-4 justify-items-center"></ul>
            </section>

            <!-- Bouton accéder à mon espace personnel -->
            ${connectedUser.username?.toLowerCase() === login.toLowerCase() ? `
            <div class="w-full flex justify-center">
                <a href="/account" id="account-btn" class="button">
                    Accéder à mon espace personnel
                </a>
            </div>
            ` : ''}
        </div>`

        // Ajout des graphiques
        const victories_chart = document.querySelector(`#victories-chart`) as HTMLElement
        chart_cleaners.push(renderPieChart(victories_chart, `Résultats`, {
            'victoires': wins,
            'défaites': losses
        }))

        const matches = resultMatches.data
        const labels_last_matches = get_labels_last_matches()
        const data_last_matches = get_data_last_matches(matches)
        const chart_last_matches: Record<string, number> = {}

        labels_last_matches.forEach(day => {
            chart_last_matches[day] = data_last_matches[day] || 0;
        })

        const games_chart = document.querySelector(`#games-chart`) as HTMLElement
        chart_cleaners.push(renderBarChart(games_chart, `Parties jouées`, chart_last_matches))

        const list = document.getElementById("friends-list")!

        if(friends.length === 0) {
            list.innerHTML = `<p class="text-white-500 text-sm">${connectedUser.username?.toLowerCase() === login.toLowerCase() ? "Vous n'avez" : "Cet utilisateur n'a"} pas encore d'amis.</p>`
            return
        }

        list.innerHTML = friends.map((f: any) => `
            <li class="
                flex flex-col items-center
                gap-[0.5rem] p-[1rem]
                bg-[#FFF] rounded-[1rem]
                w-full overflow-hidden
            ">
                <img
                    src="/api${f.avatarUrl}"
                    alt="Avatar de ${f.username}"
                    style="background: oklch(0.70 0.25 ${f.hue});" 
                    class="w-[4rem] h-[4rem] rounded-full object-cover"
                >
                <a href="/@${f.username}" class="link font-bold max-w-[100%] truncate" style="color: oklch(0.7 0.2  ${f.hue});" data-friend="${f.username}">
                    ${f.username}
                </a>
            </li>
        `).join("")
    }

	return () => {
        chart_cleaners.forEach(chart_cleaner => chart_cleaner())
        unmount()
    }
}
