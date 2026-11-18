import { useEffect, useState } from 'react'

// Colours from the album cover, like extractColors() and brighten() in the app:
// the cover is shrunk to 24×24, the most colourful pixels with clearly different hues win.

export type Rgb = [number, number, number]

export const DEFAULT_COLORS: Rgb[] = [[255, 122, 61], [255, 61, 127], [64, 42, 255]]

function toHsv([r, g, b]: Rgb): [number, number, number] {
  const R = r / 255, G = g / 255, B = b / 255
  const max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min
  let h = 0
  if (d > 0) {
    if (max === R) h = 60 * (((G - B) / d) % 6)
    else if (max === G) h = 60 * ((B - R) / d + 2)
    else h = 60 * ((R - G) / d + 4)
  }
  if (h < 0) h += 360
  return [h, max === 0 ? 0 : d / max, max]
}

function fromHsv(h: number, s: number, v: number): Rgb {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

const hueDistance = (a: number, b: number) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d }

export async function extractColors(url: string): Promise<Rgb[]> {
  const img = new Image()
  img.crossOrigin = 'anonymous' // Spotify covers (i.scdn.co) allow this, so the pixels can be read
  img.src = url
  await img.decode()
  const canvas = document.createElement('canvas')
  canvas.width = 24; canvas.height = 24
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return DEFAULT_COLORS
  ctx.drawImage(img, 0, 0, 24, 24)
  const data = ctx.getImageData(0, 0, 24, 24).data
  const candidates: [number, [number, number, number]][] = []
  for (let i = 0; i < data.length; i += 4) {
    const hsv = toHsv([data[i], data[i + 1], data[i + 2]])
    candidates.push([hsv[1] * hsv[2], hsv])
  }
  candidates.sort((a, b) => b[0] - a[0])
  const picked: [number, number, number][] = []
  for (const [, c] of candidates) {
    if (picked.every(p => hueDistance(p[0], c[0]) >= 35)) picked.push(c)
    if (picked.length === 3) break
  }
  while (picked.length < 3) picked.push(picked[0] ? [...picked[0]] : [30, 0.4, 0.5])
  return picked.map(([h, s, v]) => fromHsv(h, Math.min(Math.max(s, 0.35), 0.85), Math.min(Math.max(v, 0.45), 0.8)))
}

/** Cover colours are often dark; push to full brightness and mix in a little white so text reads. */
export function brighten([r, g, b]: Rgb): Rgb {
  const m = Math.max(r, g, b, 2.55) / 255
  const full = [r / 255 / m, g / 255 / m, b / 255 / m]
  return full.map(c => Math.round((c + (1 - c) * 0.3) * 255)) as Rgb
}

/** The lyrics accent: the most colourful cover colour, brightened (as in the app's LyricsView). */
export function accentOf(colors: Rgb[]): Rgb {
  const best = [...colors].sort((a, b) => (Math.max(...b) - Math.min(...b)) - (Math.max(...a) - Math.min(...a)))[0]
  return best ? brighten(best) : [255, 122, 61]
}

export const css = ([r, g, b]: Rgb, a = 1) => (a === 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${a})`)

export function useCoverColors(url: string | null): Rgb[] {
  const [colors, setColors] = useState<Rgb[]>(DEFAULT_COLORS)
  useEffect(() => {
    if (!url) { setColors(DEFAULT_COLORS); return }
    let stale = false
    extractColors(url).then(c => { if (!stale) setColors(c) }).catch(() => { if (!stale) setColors(DEFAULT_COLORS) })
    return () => { stale = true }
  }, [url])
  return colors
}
