export function renderPieChart(
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

    const slices = Object.entries(data).map(([label, value]) => ({
        label,
        value
    }))

    draw_slices(svg, slices)

    const observer = new ResizeObserver(() => {
        redraw()
    })
    observer.observe(svg)

    const caption = document.createElement(`figcaption`)
    figure.appendChild(caption)

    const ul = document.createElement(`ul`)
    ul.classList.add(`flex`, `flex-row`, `flex-wrap`, `gap-[1rem]`)
    caption.appendChild(ul)

    for (let i in slices) {
        const slice = slices[i]

        const li = document.createElement(`li`)
        li.classList.add(`flex`, `flex-row`, `gap-[0.5rem]`, `items-center`)
        li.innerHTML = `
            <div class="w-[1rem] h-[1rem]" style="
                background: oklch(0.75 0.1 ${Math.trunc(Number(document.documentElement.style.getPropertyValue(`--hue`)) + 360 / slices.length * +i) % 360});
                border: solid 0.125rem #FFF;
            "></div>
            <span class="font-bold leading-[1rem] text-left">${slice.label}</span>
        `
        ul.appendChild(li)
    }

    function redraw() {
        svg.innerHTML = ``
        draw_slices(svg, slices)
    }

function draw_slices(
  svg: SVGSVGElement,
  slices: { label: string; value: number }[]
) {
  const total = slices.reduce((a, s) => a + (s.value > 0 ? s.value : 0), 0)
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
  const bbox = svg.getBoundingClientRect()
  const svg_size = Math.min(bbox.width, bbox.height)

  if (!svg_size || !isFinite(svg_size)) return

  const stroke_size = (0.125 * rem) * (512 / svg_size)
  const font_size = (1 * rem) * (512 / svg_size)
  const radius = 256 - stroke_size / 2

  const positiveCount = slices.filter(s => s.value > 0).length

  if (total > 0 && positiveCount === 1) {
    const i = slices.findIndex(s => s.value > 0)
    const slice = slices[i]

    const circle = document.createElementNS(`http://www.w3.org/2000/svg`, `circle`)
    circle.setAttribute(`cx`, `256`)
    circle.setAttribute(`cy`, `256`)
    circle.setAttribute(`r`, `${radius}`)
    circle.setAttribute(
      `fill`,
      `oklch(0.75 0.1 ${Math.trunc(Number(document.documentElement.style.getPropertyValue(`--hue`)) + 360 / slices.length * i) % 360})`
    )
    circle.setAttribute(`stroke`, `#FFF`)
    circle.setAttribute(`stroke-width`, `${stroke_size}`)
    svg.appendChild(circle)

    const text = document.createElementNS(`http://www.w3.org/2000/svg`, `text`)
    text.setAttribute(`x`, `256`)
    text.setAttribute(`y`, `256`)
    text.setAttribute(`fill`, `#FFF`)
    text.setAttribute(`font-size`, `${font_size}`)
    text.setAttribute(`font-weight`, `bold`)
    text.setAttribute(`text-anchor`, `middle`)
    text.setAttribute(`dominant-baseline`, `middle`)
    text.textContent = slice.value.toString()
    svg.appendChild(text)

    return
  }

  let angle = -90
  for (let i in slices) {
    const slice = slices[i]

    if (slice.value <= 0 && total > 0) continue

    let slice_angle
    if (total > 0) slice_angle = (slice.value / total) * 360
    else slice_angle = 360 / slices.length

    const start = angle
    const end = angle + slice_angle

    const path = document.createElementNS(`http://www.w3.org/2000/svg`, `path`)
    path.setAttribute(`d`, create_slice(256, 256, radius, start, end))
    path.setAttribute(
      `fill`,
      `oklch(0.75 0.1 ${Math.trunc(Number(document.documentElement.style.getPropertyValue(`--hue`)) + 360 / slices.length * +i) % 360})`
    )
    path.setAttribute(`stroke`, `#FFF`)
    path.setAttribute(`stroke-width`, `${stroke_size}`)
    path.setAttribute(`stroke-linejoin`, `round`)
    path.setAttribute(`stroke-linecap`, `round`)
    svg.appendChild(path)

    const bisector = start + slice_angle / 2
    const text_radius = radius * 0.6
    const rad = (deg: number) => (deg * Math.PI) / 180
    const text_x = 256 + text_radius * Math.cos(rad(bisector))
    const text_y = 256 + text_radius * Math.sin(rad(bisector))

    const text = document.createElementNS(`http://www.w3.org/2000/svg`, `text`)
    text.setAttribute(`x`, text_x.toString())
    text.setAttribute(`y`, text_y.toString())
    text.setAttribute(`fill`, `#FFF`)
    text.setAttribute(`font-size`, `${font_size}`)
    text.setAttribute(`font-weight`, `bold`)
    text.setAttribute(`text-anchor`, `middle`)
    text.setAttribute(`dominant-baseline`, `middle`)
    text.textContent = slice.value.toString()
    svg.appendChild(text)

    const bbox = text.getBBox()
    const slice_angle_rad = slice_angle * Math.PI / 180
    const arc_length = text_radius * slice_angle_rad
    if (bbox.width > arc_length * 0.9) svg.removeChild(text)

    angle = end
  }
}


    function create_slice(
        cx: number,
        cy: number,
        radius: number,
        start_angle: number,
        end_angle: number
    ): string {
        const rad = (deg: number) => (deg * Math.PI) / 180

        const x1 = cx + radius * Math.cos(rad(start_angle))
        const y1 = cy + radius * Math.sin(rad(start_angle))
        const x2 = cx + radius * Math.cos(rad(end_angle))
        const y2 = cy + radius * Math.sin(rad(end_angle))

        const large_arc = end_angle - start_angle > 180 ? 1 : 0

        return [
            `M ${cx} ${cy}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${large_arc} 1 ${x2} ${y2}`,
            `Z`
        ].join(` `)
    }

    return () => {
        observer.disconnect()
    }
}
