import { renderHome } from "../pages/home.js"
import { renderLogin } from "../pages/login.js"
import { renderSignin } from "../pages/signin.js"
import { renderAccount } from "../pages/account.js"
import { renderPlay } from "../pages/play.js"
import { renderPrivacy } from "../pages/privacy.js"
import { renderTerms } from "../pages/terms.js"
import { renderLeaderboard } from "../pages/leaderboard.js"
import { renderHistory } from "../pages/history.js"
import { renderGame } from "../pages/game.js"
import { renderProfile } from "../pages/profile.js"
import { render404 } from "../pages/404.js"

let cleanup: (() => void) | null = null

export function initRouter(): void {
    document.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (target.tagName === "BUTTON" || target.tagName === "A") {
            if (!target.classList.contains('conserve-focus'))
                target.blur();
        }
    })

    document.addEventListener("click", (e: MouseEvent) => {
        const target = e.target as HTMLElement | null
        if (!target) return

        const link = target.closest("a") as HTMLAnchorElement | null
        if (!link) return

        if (link.target === "_blank") return
        if (link.hasAttribute("data-no-spa")) return
        if (link.href.startsWith("mailto:")) return
        if (link.href.startsWith("tel:")) return
        if (link.origin !== location.origin) return

        e.preventDefault()
        navigate(link.pathname)
    })

    window.addEventListener("popstate", () => {
        renderRoute(location.pathname)
    })

    renderRoute(location.pathname)
}

export function navigate(path: string) {
    history.pushState({}, "", path)
    renderRoute(path)
    requestAnimationFrame(() => {
        const el = document.activeElement as HTMLElement | null
        if (el) el.blur()
    })
}

export function renderRoute(path: string) {
    const app = document.getElementById("app")!
    const oldPage = app.firstElementChild

    path = path.split('?')[0]

    if (oldPage) {
        oldPage.classList.add("animate-page-out")
        setTimeout(loadNewPage, 250)
    } else {
        loadNewPage()
    }

    function loadNewPage() {
        if (cleanup) {
            cleanup()
            cleanup = null
        }

        window.scrollTo(0, 0)
        let cleaner: void | (() => void)

        if (path == `/`)
            cleaner = renderHome(app)
        else if (path == `/login`)
            cleaner = renderLogin(app)
        else if (path == `/signin`)
            cleaner = renderSignin(app)
        else if (path == `/account`)
            cleaner = renderAccount(app)
        else if (path == `/leaderboard`)
            cleaner = renderLeaderboard(app)
        else if (path == `/history`)
            cleaner = renderHistory(app)
        else if (path == `/play`)
            cleaner = renderPlay(app)
        else if (path == `/privacy`)
            cleaner = renderPrivacy(app)
        else if (path == `/terms`)
            cleaner = renderTerms(app)
        else if (path.startsWith(`/@`))
            cleaner = renderProfile(app, decodeURIComponent(path.slice(2)))
        else if (/^\/[0-9a-fA-F-]+$/.test(path))
            cleaner = renderGame(app, path.slice(1))
        else
            cleaner = render404(app)

        if (typeof cleaner === "function")
            cleanup = cleaner

        const newPage = app.firstElementChild

        if (newPage)
            newPage.classList.add("animate-page-in")
    }
}
