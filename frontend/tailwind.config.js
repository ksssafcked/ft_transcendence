module.exports = {
    content: ["./src/**/*.{html,ts}"],
    theme: {
        extend: {
            fontFamily: {
                syne: ["syne", "sans-serif"],
                tektur: ["tektur", "sans-serif"]
            },
            keyframes: {
                "page-in": {
                    "0%":   { opacity: "0%",   transform: "translateY(2rem)" },
                    "100%": { opacity: "100%", transform: "translateY(0rem)" },
                },
                "page-out": {
                    "0%":   { opacity: "100%", transform: "translateY(0rem)" },
                    "100%": { opacity: "0%",   transform: "translateY(-2rem)" },
                },
                "disappearance": {
                    "0%":   { opacity: "100%" },
                    "100%": { opacity: "0%" },
                }
            },
            animation: {
                "page-in": "page-in 250ms linear forwards",
                "page-out": "page-out 250ms linear forwards",
                "disappearance": "disappearance 1000ms linear forwards"
            }
        },
        screens: {
            'cf': {'raw': '(pointer: fine) and (hover:hover)'},
            'cc': {'raw': '(pointer: coarse) and (hover:none)'},
            'xxs': {'raw': '((max-width: 360px) or (max-height: 360px))'},
            'xs': {'raw': '(((min-width: 361px) and (max-width: 720px)) or ((min-height: 361px) and (max-height: 720px)))'},
            'sp': {'raw': '(max-width: 1024px) and (orientation: portrait)'},
            'st': {'raw': '(max-width: 1024px)  and (orientation: landscape)'},
            'sc': '1025px',
            'xl': {'raw': '(min-width: 1800px) and (max-width: 3599px)'},
            'xxl': '3600px',
            'chat-size': '32rem'
        }
    },
    plugins: []
}
