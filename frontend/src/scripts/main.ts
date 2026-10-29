import { initRouter } from "./router.js"
import { renderHeader } from "../components/header.js"
import { renderFooter } from "../components/footer.js"
import { renderChat } from "../components/chat.js"
import { renderBackground } from "../components/background.js"

const hue = localStorage.getItem(`hue`)
document.documentElement.style.setProperty(`--hue`, hue ? hue : `180`)

document.addEventListener("DOMContentLoaded", async () => {
    renderHeader()
    renderFooter()
    renderBackground()
    renderChat();
    initRouter()
})