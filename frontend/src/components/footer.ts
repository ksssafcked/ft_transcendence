export function renderFooter() {
    const header = document.querySelector(`#footer`)!
    header.innerHTML = `
        <p>© 2025 Transcendance</p>
        <a href="/privacy" class="link">Privacy policy</a>
        <a href="/terms" class="link">Terms of service</a>
    `
}
