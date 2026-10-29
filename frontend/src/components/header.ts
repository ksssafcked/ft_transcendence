export function renderHeader() {
    const header = document.querySelector(`#header`)!
    header.innerHTML = `
        <a id="logo" href="/" class="
                soft-link
                flex flex-row gap-[1rem]
                sp:hidden
        ">
            <svg class="w-[2rem] h-[2rem]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_231_72)">
                    <path d="M10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12Z" stroke="white" stroke-width="2" stroke-linejoin="round"/>
                    <path d="M1 1H5V17H1V1Z" stroke="white" stroke-width="2" stroke-linejoin="round"/>
                    <path d="M19 7H23V23H19V7Z" stroke="white" stroke-width="2" stroke-linejoin="round"/>
                </g>
                <defs>
                    <clipPath id="clip0_231_72">
                        <rect width="24" height="24" fill="white"/>
                    </clipPath>
                </defs>
            </svg>
            <h1 class="st:hidden title">Holy Pong</h1>
        </a>

        <nav class="
            flex gap-[1rem]
            sp:flex-row sp:flex-1 sp:justify-around
            st:flex-col
            sc:flex-row
        ">
            <a href="/" class="soft-link st:hidden sc:hidden ">
                <svg class="w-[2rem] h-[2rem]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clip-path="url(#clip0_231_72)">
                        <path d="M10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12Z" stroke="white" stroke-width="2" stroke-linejoin="round"/>
                        <path d="M1 1H5V17H1V1Z" stroke="white" stroke-width="2" stroke-linejoin="round"/>
                        <path d="M19 7H23V23H19V7Z" stroke="white" stroke-width="2" stroke-linejoin="round"/>
                    </g>
                    <defs>
                        <clipPath id="clip0_231_72">
                            <rect width="24" height="24" fill="white"/>
                        </clipPath>
                    </defs>
                </svg>
            </a>
            <a href="/play" class="soft-link">
                <svg class="w-[2rem] h-[2rem]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clip-path="url(#clip0_109_4)">
                        <path d="M1 15.9112L1 20.0524L12 22.9998L22.9999 20.0526L22.9999 15.9115M1 15.9112L9.99994 13.4997M1 15.9112L12 18.8587L22.9999 15.9115M22.9999 15.9115L13.9999 13.4999M9.99994 13.4997V8.46484M9.99994 13.4997L10 14.9112M13.9999 13.4999L14.0001 8.46484M13.9999 13.4999L14 14.9112M9.99994 8.46484C10.5883 8.8052 11.2714 9 12 9C12.7286 9 13.4117 8.8052 14.0001 8.46484M9.99994 8.46484C8.80437 7.77321 8 6.48054 8 5C8 2.79086 9.79086 1 12 1C14.2091 1 16 2.79086 16 5C16 6.48054 15.1956 7.77321 14.0001 8.46484" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </g>
                    <defs>
                        <clipPath id="clip0_109_4">
                            <rect width="24" height="24" fill="white"/>
                        </clipPath>
                    </defs>
                </svg>
            </a>
            <a href="/leaderboard" class="soft-link">
                <svg class="w-[2rem] h-[2rem]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clip-path="url(#clip0_230_67)">
                        <path d="M1 23V17H8M23 23V20H16M8 17V23M8 17V14H16V20M16 20V23M14 10H15M14 10H10M14 10C14 8.69452 14.1683 7.76777 14.4073 7M9 10H10M10 10C10 8.69452 9.83168 7.76777 9.59269 7M8.03649 2H5C5 6 8.06179 7 9.59269 7M8.03649 2C8.01285 1.69249 8 1.3607 8 1H16C16 1.3607 15.9872 1.69249 15.9635 2M8.03649 2C8.22221 4.41594 9.07393 5.3334 9.59269 7M15.9635 2H19C19 6 15.9382 7 14.4073 7M15.9635 2C15.7778 4.41594 14.9261 5.3334 14.4073 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </g>
                    <defs>
                        <clipPath id="clip0_230_67">
                            <rect width="24" height="24" fill="white"/>
                        </clipPath>
                    </defs>
                </svg>
            </a>
            <a href="/account" class="soft-link">
                <svg class="w-[2rem] h-[2rem]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clip-path="url(#clip0_236_111)">
                        <path d="M12 1C8.68629 1 6 3.68629 6 7C6 9.32901 7.32699 11.3481 9.26615 12.3424C4.51358 13.5579 1 17.8686 1 23H5C5 19.134 8.13401 16 12 16C15.866 16 19 19.134 19 23H23C23 17.8686 19.4864 13.5579 14.7338 12.3424C16.673 11.3481 18 9.32901 18 7C18 3.68629 15.3137 1 12 1Z" stroke="white" stroke-width="2" stroke-linejoin="round"/>
                        <circle cx="12" cy="7" r="2" stroke="white" stroke-width="2"/>
                    </g>
                    <defs>
                        <clipPath id="clip0_236_111">
                            <rect width="24" height="24" fill="white"/>
                        </clipPath>
                    </defs>
                </svg>
            </a>
        </nav>
    `
}
