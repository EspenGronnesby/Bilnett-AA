// Proxy for NetEase lyrics (word timing), which the browser can't call directly (no CORS,
// needs a Referer). Only two fixed operations, no free-form URLs, no keys: nothing to abuse.
//   /api/netease?op=search&s=<artist title>   → search results (songs)
//   /api/netease?op=lyric&id=<number>         → lyrics with word timing (yrc)

const HEADERS = { Referer: 'https://music.163.com', 'User-Agent': 'Mozilla/5.0' }
const MAX_QUERY = 200
const TIMEOUT_MS = 4_000

function json(body: string, status = 200, cache = status === 200): Response {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Lyrics never change: let Vercel's edge cache keep them for a day.
      'Cache-Control': cache ? 'public, s-maxage=86400, max-age=3600' : 'no-store',
    },
  })
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const op = url.searchParams.get('op')
  let target: string
  if (op === 'search') {
    const s = (url.searchParams.get('s') ?? '').trim()
    if (!s || s.length > MAX_QUERY) return json('{"error":"bad query"}', 400)
    target = `https://music.163.com/api/cloudsearch/pc?type=1&limit=10&s=${encodeURIComponent(s)}`
  } else if (op === 'lyric') {
    const id = url.searchParams.get('id') ?? ''
    if (!/^\d{1,15}$/.test(id)) return json('{"error":"bad id"}', 400)
    target = `https://music.163.com/api/song/lyric/v1?id=${id}&lv=-1&yv=-1&kv=-1&tv=-1`
  } else {
    return json('{"error":"unknown op"}', 400)
  }
  try {
    const res = await fetch(target, { headers: HEADERS, signal: AbortSignal.timeout(TIMEOUT_MS) })
    if (!res.ok) return json(`{"error":"upstream ${res.status}"}`, 502)
    const text = await res.text()
    if (text.length > 2_000_000) return json('{"error":"too big"}', 502)
    // Only real data may be kept for a day; an error answer (even with HTTP 200) is not cached.
    let ok = false
    try { const data = JSON.parse(text); ok = typeof data === 'object' && data !== null && (data.code === undefined || data.code === 200) } catch { /* not JSON */ }
    return json(text, 200, ok)
  } catch {
    return json('{"error":"upstream failed"}', 502)
  }
}
