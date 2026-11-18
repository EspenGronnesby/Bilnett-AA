// Finds Apple Music's animated artwork (an HLS loop) for an album or an artist, like motionFrom()
// in the app's SpotifyVideoLookup. Apple's web pages can't be read from the browser (no CORS),
// so this reads the page here and returns only the stream address. Fixed inputs only:
//   /api/apple?op=motion&kind=album&id=<number>
//   /api/apple?op=motion&kind=artist&id=<number>
// → {"url": "https://mvod.itunes.apple.com/….m3u8"} or {"url": null}

const ALBUM_KEYS = ['motionDetailSquare', 'motionDetailTall']
const ARTIST_KEYS = ['motionArtistWide16x9', 'motionArtistFullscreen16x9', 'motionArtistSquare1x1']
const M3U8 = /https:\/\/mvod\.itunes\.apple\.com[^"\\]*\.m3u8/
const TIMEOUT_MS = 6_000

function json(body: unknown, status = 200, cache = status === 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cache ? 'public, s-maxage=86400, max-age=3600' : 'no-store',
    },
  })
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const kind = url.searchParams.get('kind')
  const id = url.searchParams.get('id') ?? ''
  if (url.searchParams.get('op') !== 'motion' || (kind !== 'album' && kind !== 'artist') || !/^\d{1,15}$/.test(id)) {
    return json({ error: 'bad request' }, 400)
  }
  try {
    const res = await fetch(`https://music.apple.com/us/${kind}/${id}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh)' },
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (res.status === 404) return json({ url: null })
    if (!res.ok) return json({ error: `upstream ${res.status}` }, 502)
    const html = await res.text()
    // The first key found wins; the stream address follows shortly after it in the page data.
    for (const key of kind === 'album' ? ALBUM_KEYS : ARTIST_KEYS) {
      const i = html.indexOf(`"${key}"`)
      if (i < 0) continue
      const m = M3U8.exec(html.substring(i, Math.min(html.length, i + 3000)))
      if (m) return json({ url: m[0] })
    }
    return json({ url: null })
  } catch {
    return json({ error: 'upstream failed' }, 502)
  }
}
