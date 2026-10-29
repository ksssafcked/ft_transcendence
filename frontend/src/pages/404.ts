export function render404(app: HTMLElement) {
    app.innerHTML = `<div id="page-404" class="
        grid place-items-center p-[1rem]

        sp:min-h-[calc(100vh-4rem)]
        st:min-h-[100vh]
        sc:min-h-[calc(100vh-4rem)]

		animate-page-in
    ">
            <h1 class="title">Page introuvable</h1>
    </div>`
}
