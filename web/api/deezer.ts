// Proxy for Deezer's public API (the song's tempo in BPM, used to place guessed word timing on
// the beat, as in the app's DeezerLookup). Deezer sends no CORS headers. Fixed operations only:
//   /api/deezer?op=search&q=<artist title>   → search results
//   /api/deezer?op=track&id=<number>         → one track (bpm, gain, …)
//   /api/deezer?op=artists&q=<name>          → artist search
//   /api/deezer?op=related&id=<number>       → similar artists

const MAX_QUERY = 200
const TIMEOUT_MS = 4_000

function json(body: string, status = 200, cache = status === 200): Response {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cache ? 'public, s-maxage=86400, max-age=3600' : 'no-store',
    },
  })
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const op = url.searchParams.get('op')
  let target: string
  if (op === 'search') {
    const q = (url.searchParams.get('q') ?? '').trim()
    if (!q || q.length > MAX_QUERY) return json('{"error":"bad query"}', 400)
    target = `https://api.deezer.com/search?limit=10&q=${encodeURIComponent(q)}`
  } else if (op === 'artists') {
    // Artist search (to find the right artist id for «similar artists»).
    const q = (url.searchParams.get('q') ?? '').trim()
    if (!q || q.length > MAX_QUERY) return json('{"error":"bad query"}', 400)
    target = `https://api.deezer.com/search/artist?limit=10&q=${encodeURIComponent(q)}`
  } else if (op === 'related') {
    // Similar artists, used for «Vibe» videos when a song has none of its own.
    const id = url.searchParams.get('id') ?? ''
    if (!/^\d{1,15}$/.test(id)) return json('{"error":"bad id"}', 400)
    target = `https://api.deezer.com/artist/${id}/related?limit=10`
  } else if (op === 'track') {
    const id = url.searchParams.get('id') ?? ''
    if (!/^\d{1,15}$/.test(id)) return json('{"error":"bad id"}', 400)
    target = `https://api.deezer.com/track/${id}`
  } else {
    return json('{"error":"unknown op"}', 400)
  }
  try {
    const res = await fetch(target, { signal: AbortSignal.timeout(TIMEOUT_MS) })
    if (!res.ok) return json(`{"error":"upstream ${res.status}"}`, 502)
    const text = await res.text()
    if (text.length > 500_000) return json('{"error":"too big"}', 502)
    // Only real data may be kept for a day; an error answer (even with HTTP 200) is not cached.
    let ok = false
    try { const data = JSON.parse(text); ok = typeof data === 'object' && data !== null && (!('error' in data)) } catch { /* not JSON */ }
    return json(text, 200, ok)
  } catch {
    return json('{"error":"upstream failed"}', 502)
  }
}
