export function renderBarChart(
    dst:   HTMLElement,
    label: string,
    data:  Record<string, number>
) {
    dst.innerHTML = ``

    const figure = document.createElement(`figure`)
    figure.classList.add(`flex`, `flex-col`, `gap-[1rem]`, `h-[100%]`)
    dst.appendChild(figure)

    const title = document.createElement(`h1`)
    title.textContent = label
    title.classList.add(`soft-title`)
    figure.appendChild(title)

    const svg = document.createElementNS(`http://www.w3.org/2000/svg`, `svg`)
    svg.setAttribute(`viewBox`, `0 0 512 512`)
    figure.appendChild(svg)

    const bars = Object.entries(data).map(([label, value]) => ({
        label,
        value
    }))

    draw_bars(svg, bars)

    const observer = new ResizeObserver(() => {
        redraw()
    })
    observer.observe(svg)

    const caption = document.createElement(`figcaption`)
    figure.appendChild(caption)

    const ul = document.createElement(`ul`)
    ul.classList.add(`flex`, `flex-row`, `justify-evenly`, `mt-[-0.5rem]`)
    caption.appendChild(ul)

    for (let i in bars) {
        const bar = bars[i]

        const li = document.createElement(`li`)
        li.classList.add(`flex`, `flex-row`, `justify-end`)
        li.style.width = `${100 / (1 + bars.length * 3) * 2}%`
        li.innerHTML = `
            <span class="font-bold leading-[1rem] whitespace-nowrap origin-right mr-[50%]"
                  style="transform: rotateZ(-45deg);">${bar.label}</span>
        `
        ul.appendChild(li)
    }

    function redraw() {
        svg.innerHTML = ``
        draw_bars(svg, bars)
        update_padding(ul)
    }

    function draw_bars(
        svg: SVGSVGElement,
        bars: {label: string; value: number}[]
    ) {
        const maximum = Math.max(...bars.map(b => b.value > 0 ? b.value : 1))
        const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
        const bbox = svg.getBoundingClientRect()
        const svg_size = bbox.width

        if (!svg_size || !isFinite(svg_size)) {
            return
        }

        const stroke_size = (0.125 * rem) * (512 / svg_size)
        const font_size = (1 * rem) * (512 / svg_size)

        const bar_width = Math.max(512 / (1 + bars.length * 3) * 2, 0.1 + stroke_size)

        let abscissa = 0.5 * bar_width
        for (let i in bars) {
            const bar = bars[i]

            const bar_height = Math.max((bar.value / maximum) * (512 - 1.5 * font_size), 0.1 + stroke_size)
            const rect = document.createElementNS(`http://www.w3.org/2000/svg`, `rect`)

            rect.setAttribute(`x`, `${abscissa + stroke_size / 2}`)
            rect.setAttribute(`y`, `${512 - bar_height + stroke_size / 2}`)
            rect.setAttribute(`width`, `${bar_width - stroke_size}`)
            rect.setAttribute(`height`, `${bar_height - stroke_size}`)
            rect.setAttribute(`fill`, `oklch(0.75 0.1 ${Math.trunc(Number(document.documentElement.style.getPropertyValue(`--hue`)) + 360 / bars.length * +i) % 360})`)
            rect.setAttribute(`stroke`, `#FFF`)
            rect.setAttribute(`stroke-width`, `${stroke_size}`)
            rect.setAttribute(`stroke-linejoin`, `round`)
            rect.setAttribute(`stroke-linecap`, `round`)
            svg.appendChild(rect)

            const text_x = abscissa + bar_width / 2
            const text_y = 512 - bar_height - font_size
            const text = document.createElementNS(`http://www.w3.org/2000/svg`, `text`)
            text.setAttribute(`x`, text_x.toString())
            text.setAttribute(`y`, (text_y + font_size / 2).toString())
            text.setAttribute(`fill`, `#FFF`)
            text.setAttribute(`font-size`, `${font_size}`)
            text.setAttribute(`font-weight`, `bold`)
            text.setAttribute(`text-anchor`, `middle`)
            text.textContent = bar.value.toString()
            svg.appendChild(text)

            abscissa += 1.5 * bar_width
        }
    }
    
    function update_padding(list: HTMLElement) {
        const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
        const spans = list.querySelectorAll("span");
        let max_height = 0;

        spans.forEach(span => {
            const rect = span.getBoundingClientRect();
            const height = rect.height;
            if (height > max_height) {
                max_height = height;
            }
        });

        list.style.paddingBottom = `${max_height - rem}px`;
    }

    return () => {
        observer.disconnect()
    }
}
