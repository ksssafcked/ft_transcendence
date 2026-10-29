import { navigate } from "../scripts/router.js"

export function renderHome(app: HTMLElement) {
    app.innerHTML = `
        <div id="page-home" class="
		    animate-page-in
        ">
            <section id="pongContainer" class="		
                sp:min-h-[calc(100vh-4rem)]
                st:min-h-[100vh]
                sc:min-h-[calc(100vh-4rem)]
            ">
                <!-- Contenu centré -->
                <div class="absolute inset-0 flex flex-col items-center justify-center z-[10] text-center p-[1rem] gap-[1rem] sc:gap-[4rem]">
                    <h1 class="title sc:text-[4rem] sc:leading-[4rem]">Bienvenue sur notre projet Transcendance</h1>
                    <p class="sc:text-[2rem]">Jouez à Pong en ligne, participez à des tournois et défiez vos amis !</p>
                <a href="/login" id="loginBtn" class="
                    button sc:text-[2rem] sc:leading-[2rem] sc:h-[3rem] sc:rounded-[1.5rem] sc:w-[32rem]
                ">
                    Se connecter
                </a>

                </div>
            </section>
        </div>
    `
    
    const container = document.getElementById("pongContainer")!
    const balls: { el: HTMLDivElement; x: number; y: number; dx: number; dy: number }[] = []

    const numBalls = 64

    for (let i = 0; i < numBalls; i++) {
        const ball = document.createElement("div")
        ball.classList.add(
            `absolute`,
            `w-4`,
            `h-4`,
            `rounded-full`
        )
        ball.style.backgroundColor = `oklch(0.75 0.1 ${360 / numBalls * i})`
        container.appendChild(ball)

        balls.push({
            el: ball,
            x: Math.random() * (container.clientWidth - 16),
            y: Math.random() * (container.clientHeight - 16),
            dx: (Math.random() - 0.5) * 4,
            dy: (Math.random() - 0.5) * 4,
        })
    }

    function animate() {
        const maxX = container.clientWidth - 16
        const maxY = container.clientHeight - 16

        balls.forEach((ball) => {
            ball.x += ball.dx
            ball.y += ball.dy

            if (ball.x <= 0) {
                ball.x = 0
                ball.dx *= -1
            }
            if (ball.y <= 0) {
                ball.y = 0
                ball.dy *= -1
            }
            if (ball.x >= maxX) {
                ball.x = maxX
                ball.dx *= -1
            }
            if (ball.y >= maxY) {
                ball.y = maxY
                ball.dy *= -1
            }

            ball.el.style.left = `${ball.x}px`
            ball.el.style.top = `${ball.y}px`
        });

        requestAnimationFrame(animate)
    }

    animate()
}
