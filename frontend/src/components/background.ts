export function renderBackground() {
    const background = document.querySelector(`#background`)!
    background.innerHTML = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" class="absolute inset-0">
            <defs>
                <!-- Filtre de bruit -->
                <filter id="noise" x="0" y="0" width="100%" height="100%">
                <feTurbulence
                    type="fractalNoise"
                    baseFrequency="8"
                    numOctaves="8"
                    stitchTiles="stitch"
                    result="noise"/>
                <feColorMatrix type="saturate" values="0"/>
                <feComponentTransfer>
                    <feFuncA type="linear" slope="0.1"/> <!-- opacité du grain -->
                </feComponentTransfer>
                </filter>
                <!-- Dégradé de fond -->
                <linearGradient id="gradient" x1="0%" y1="50%" x2="100%" y2="50%">
                    <stop offset="0%" stop-color="oklch(0.50 0.20 var(--pre-hue))"/>
                    <stop offset="50%" stop-color="oklch(0.50 0.20 var(--hue))"/>
                    <stop offset="100%" stop-color="oklch(0.50 0.20 var(--post-hue))"/>
                </linearGradient>
            </defs>

            <!-- Fond dégradé -->
            <rect width="100%" height="100%" fill="url(#gradient)"/>

            <!-- Grain -->
            <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
    `
}
