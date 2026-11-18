import { norm } from '../lyrics/parse'

// Finds silent music videos for a song from Apple's catalog — a port of findAll() in the app's
// SpotifyVideoLookup.kt (YouTube is off there too). Keep the two in step.
// Order: the song's own music video → animated album cover → animated artist image → other videos
// from the album → other artist videos (sorted by theme) → only when nothing was found: videos by
// similar artists, then the genre.

export type Source = 'SONG' | 'COVER' | 'ARTIST_ART' | 'ALBUM' | 'ARTIST' | 'VIBE'
export const SOURCE_LABEL: Record<Source, string> = {
  SONG: 'Sang', COVER: 'Cover', ARTIST_ART: 'Artistbilde', ALBUM: 'Album', ARTIST: 'Artist', VIBE: 'Vibe',
}
export interface VideoClip { url: string; source: Source }

interface AppleItem {
  wrapperType?: string; trackName?: string; artistName?: string; collectionName?: string
  previewUrl?: string; artistId?: number; collectionId?: number; primaryGenreName?: string
}

const MAX = 8
/** Genre videos used only when nothing else was found. */
const VIBE_COUNT = 3
const THEME_CANDIDATES = 6
const VERSION_WORDS = ['remix', 'live', 'acoustic', 'instrumental', 'sped up', 'slowed', 'edit', 'version']
const JUNK_VIDEO = ['interview', 'visualizer', 'visualiser', 'trailer', 'behind the scenes',
  'documentary', 'fire in the booth', 'teaser', 'making of', 'commentary']
const ARTIST_SPLIT = /\s*(?:,|&| feat\.? | featuring )\s*/i

const valid = (url: string | undefined): url is string => !!url && url.startsWith('https://')

async function getJson<T>(url: string, timeoutMs = 8_000): Promise<T | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
    return res.ok ? ((await res.json()) as T) : null
  } catch { return null }
}

async function search(term: string, country: string, entity = 'musicVideo'): Promise<AppleItem[]> {
  const r = await getJson<{ results?: AppleItem[] }>(
    `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=${entity}&limit=25&country=${country}`)
  return r?.results ?? []
}

/** All items of [entity] for an Apple id (e.g. every music video by an artist). */
async function lookup(id: number, entity: string): Promise<AppleItem[]> {
  const r = await getJson<{ results?: AppleItem[] }>(`https://itunes.apple.com/lookup?id=${id}&entity=${entity}&limit=100&country=us`)
  return (r?.results ?? []).filter(x => x.wrapperType !== 'artist')
}

/** Apple Music's animated artwork (HLS loop) via /api/apple, or null. */
async function motion(kind: 'album' | 'artist', id: number): Promise<string | null> {
  const r = await getJson<{ url?: string | null }>(`/api/apple?op=motion&kind=${kind}&id=${id}`)
  return r?.url ?? null
}

function sameArtist(candidate: string | undefined, artist: string): boolean {
  const candidates = (candidate ?? '').split(ARTIST_SPLIT).map(norm)
  return artist.split(ARTIST_SPLIT).map(norm).some(w => w.length > 0 && candidates.includes(w))
}

function count(text: string, word: string): number {
  const esc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return (text.match(new RegExp(`(^| )${esc}( |$)`, 'g')) ?? []).length
}

function numbers(t: string): string[] {
  // Featured artists («feat. 21 Savage», «with 50 Cent») do not count.
  const n = norm(t.replace(/[([]\s*(feat|ft|with)\b[^)\]]*[)\]]|\s(feat|ft)\.?\s.*$/gi, ''))
  return (n.match(/\b(\d+|pt|part|vol|ii|iii|iv)\b/g) ?? []).map(x => x.replace('part', 'pt'))
}

const junkVideo = (name: string | undefined) => {
  const n = (name ?? '').toLowerCase()
  return JUNK_VIDEO.some(j => n.includes(j)) || / on ["“]/.test(n)
}
const bareTitle = (t: string | undefined) => norm((t ?? '').replace(/\s+[-–]\s+.*$|\s*[([].*$/, ''))

// ---------- Theme: which artist video fits this song best ----------

const STOP = new Set(('the and you your that this with for but not are was were what when they them then just like got get ' +
  'yeah yea uh oh ooh ayy huh hey know all can cause cuz don ain its i\'m ima gon gonna wanna said say from out now how who ' +
  'too off one see her him his she have has had she\'s he\'s it\'s that\'s there their what\'s where why will would could should ' +
  'been being into onto than some any every each make made take let back come came going way still yes nah okay i\'ll you\'re we\'re ' +
  'they\'re can\'t don\'t won\'t ain\'t i\'ve you\'ve me my mine our ours we us im dont cant wont thats youre').split(' '))

function wordsOf(text: string | null): Map<string, number> {
  const out = new Map<string, number>()
  for (const raw of (text ?? '').toLowerCase().split(/[^\p{L}']+/u)) {
    const w = raw.replace(/^'+|'+$/g, '')
    if (w.length >= 3 && !STOP.has(w)) out.set(w, (out.get(w) ?? 0) + 1)
  }
  return out
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  if (a.size === 0 || b.size === 0) return 0
  let dot = 0
  a.forEach((c, w) => { dot += c * (b.get(w) ?? 0) })
  const na = Math.sqrt([...a.values()].reduce((s, c) => s + c * c, 0))
  const nb = Math.sqrt([...b.values()].reduce((s, c) => s + c * c, 0))
  return na === 0 || nb === 0 ? 0 : dot / (na * nb)
}

/** Plain lyrics from LRCLIB (only a theme hint: short timeout). */
async function lyricsFor(artist: string, title: string): Promise<string | null> {
  const r = await getJson<{ plainLyrics?: string | null }[]>(
    `https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`, 4_000)
  return r?.find(x => x.plainLyrics && x.plainLyrics.trim())?.plainLyrics ?? null
}

/** Score per artist video (by preview URL): +0.3 when on the same album, plus lyric similarity. */
async function themeScores(videos: AppleItem[], artist: string, title: string, collectionId: number | undefined, isActive: () => boolean) {
  const seen = new Set<string>()
  const candidates = videos.filter(v => !junkVideo(v.trackName) && valid(v.previewUrl))
    .filter(v => { const b = bareTitle(v.trackName); if (seen.has(b)) return false; seen.add(b); return true })
  const scores = new Map<string, number>()
  if (candidates.length === 0) return scores
  const albumTracks = new Set(collectionId ? (await lookup(collectionId, 'song')).map(x => bareTitle(x.trackName)) : [])
  const inAlbum = candidates.filter(v => albumTracks.has(bareTitle(v.trackName)))
  const toScore = [...new Map([...inAlbum, ...candidates].map(v => [v.previewUrl!, v])).values()].slice(0, THEME_CANDIDATES)
  const mine = isActive() ? wordsOf(await lyricsFor(artist, title)) : new Map<string, number>()
  for (const v of toScore) {
    const album = albumTracks.has(bareTitle(v.trackName)) ? 0.3 : 0
    // Song changed: stop fetching lyrics, the rest scores on album only.
    const text = mine.size === 0 || !isActive() ? 0
      : cosine(mine, wordsOf(await lyricsFor(artist, (v.trackName ?? '').replace(/\s*[([].*$/, ''))))
    scores.set(v.previewUrl!, album + text)
  }
  return scores
}

// ---------- Genre (only when nothing else was found) ----------

export type Genre = 'HARDSTYLE' | 'REGGAETON' | 'REGGAE' | 'RAP' | 'ROCK' | 'EDM' | 'POP' | 'STANDARD'

/** Same mapping as genreFromApple() in GenreDetector.kt. */
export function genreFromApple(name: string | null | undefined): Genre | null {
  const g = (name ?? '').toLowerCase()
  if (!g) return null
  const has = (...xs: string[]) => xs.some(x => g.includes(x))
  if (has('hardstyle', 'hardcore', 'hard dance')) return 'HARDSTYLE'
  if (has('reggaeton', 'urbano', 'latin urban', 'dembow')) return 'REGGAETON'
  if (has('reggae', 'dancehall') || g === 'ska' || g === 'dub') return 'REGGAE'
  if (has('hip-hop', 'hip hop', 'rap', 'trap', 'drill')) return 'RAP'
  if (has('metal', 'rock', 'punk', 'alternative', 'grunge')) return 'ROCK'
  if (has('dance', 'electro', 'house', 'techno', 'trance', 'edm', 'dubstep', 'drum')) return 'EDM'
  if (has('pop', 'r&b', 'soul')) return 'POP'
  if (has('singer', 'country', 'folk', 'jazz', 'classical', 'klassisk', 'acoustic', 'soundtrack')) return 'STANDARD'
  return null
}

const VIBE_TERMS: Partial<Record<Genre, string>> = { RAP: 'hip hop', ROCK: 'rock', EDM: 'edm', STANDARD: 'pop', POP: 'pop', REGGAE: 'reggae', REGGAETON: 'reggaeton' }
const GENRE_ARTISTS: Partial<Record<Genre, string[]>> = {
  HARDSTYLE: ['Brennan Heart', 'Wildstylez', 'Sub Zero Project', 'Headhunterz', 'Da Tweekaz', 'D-Block & S-te-Fan'],
  REGGAE: ['Bob Marley & The Wailers', 'Damian Marley', 'Chronixx', 'Protoje', 'Koffee', 'Sean Paul', 'Shaggy', 'UB40', 'Stephen Marley', 'Popcaan'],
  REGGAETON: ['Bad Bunny', 'Daddy Yankee', 'J Balvin', 'Karol G', 'Ozuna', 'Rauw Alejandro', 'Feid', 'Don Omar', 'Myke Towers', 'Nicky Jam'],
}

const shuffled = <T,>(xs: T[]) => xs.map(x => [Math.random(), x] as const).sort((a, b) => a[0] - b[0]).map(([, x]) => x)

/** Apple Music's genre for the song (e.g. "Hip-Hop/Rap"), or null. */
export async function appleGenre(title: string, artist: string): Promise<string | null> {
  const clean = title.replace(/\s*[-–([].*$/, '').trim() || title
  const main = artist.split(ARTIST_SPLIT)[0]
  const hits = [...await search(`${main} ${clean}`, 'no', 'song'), ...await search(`${main} ${clean}`, 'us', 'song')]
  const exact = hits.find(h => norm(h.trackName ?? '').startsWith(norm(clean)) && sameArtist(h.artistName, artist))
  const byArtist = hits.find(h => sameArtist(h.artistName, artist))
  if (exact?.primaryGenreName) return exact.primaryGenreName
  if (byArtist?.primaryGenreName) return byArtist.primaryGenreName
  const artists = [...await search(main, 'no', 'musicArtist'), ...await search(main, 'us', 'musicArtist')]
  return artists.find(a => sameArtist(a.artistName, artist))?.primaryGenreName || null
}

async function genreVideos(wanted: Genre | null, apple: string | null): Promise<AppleItem[]> {
  const known = wanted ? GENRE_ARTISTS[wanted] : undefined
  if (known) {
    const out: AppleItem[] = []
    for (const name of shuffled(known).slice(0, 2)) {
      out.push(...(await search(name, 'us')).filter(x => norm(x.artistName ?? '').includes(norm(name))))
    }
    return out
  }
  if (wanted) {
    const term = VIBE_TERMS[wanted]
    return term ? (await search(term, 'us')).filter(x => genreFromApple(x.primaryGenreName) === wanted) : []
  }
  if (apple) return (await search(apple, 'us')).filter(x => (x.primaryGenreName ?? '').toLowerCase() === apple.toLowerCase())
  return []
}

/** One music video each from the artists Deezer calls most similar (real vibe instead of «any hip hop»). */
async function relatedVibe(artist: string, title: string, isActive: () => boolean): Promise<AppleItem[]> {
  const main = artist.split(ARTIST_SPLIT)[0].trim()
  if (!main) return []
  const clean = title.replace(/\s*[-–([].*$/, '').trim() || title
  // The artist id from the track itself (there are several «Scrim»s), else the exact name.
  const tracks = await getJson<{ data?: { artist?: { id: number; name: string } }[] }>(`/api/deezer?op=search&q=${encodeURIComponent(`${main} ${clean}`)}`)
  let id = tracks?.data?.find(t => norm(t.artist?.name ?? '') === norm(main))?.artist?.id
  if (!id) {
    const as = await getJson<{ data?: { id: number; name: string; nb_fan?: number }[] }>(`/api/deezer?op=artists&q=${encodeURIComponent(main)}`)
    id = as?.data?.filter(a => norm(a.name) === norm(main)).sort((a, b) => (b.nb_fan ?? 0) - (a.nb_fan ?? 0))[0]?.id
  }
  if (!id) return []
  const rel = await getJson<{ data?: { name: string }[] }>(`/api/deezer?op=related&id=${id}`)
  const names = (rel?.data ?? []).map(a => a.name)
    .filter(n => n && norm(n) !== norm(main) && !n.includes(' & ') && !/ x /i.test(n)).slice(0, 5)
  const out: AppleItem[] = []
  for (const name of names) {
    if (!isActive() || out.length >= VIBE_COUNT + 2) break
    const artistId = (await search(name, 'us', 'musicArtist')).find(a => norm(a.artistName ?? '') === norm(name))?.artistId
    if (!artistId) continue
    const v = (await lookup(artistId, 'musicVideo')).find(x => valid(x.previewUrl) && !junkVideo(x.trackName))
    if (v) out.push(v)
  }
  return out
}

/** Reserve videos with the same vibe when every clip of a song failed. [exclude] = clips that already failed. */
export async function reserve(title: string, artist: string, exclude: Set<string>, howMany: number): Promise<VideoClip[]> {
  const related = await relatedVibe(artist, title, () => true)
  const apple = related.length < howMany ? await appleGenre(title, artist) : null
  const genre = related.length < howMany ? shuffled(await genreVideos(genreFromApple(apple), apple)) : []
  const urls = [...new Set([...related, ...genre].map(x => x.previewUrl).filter(valid))].filter(u => !exclude.has(u))
  return urls.slice(0, howMany).map(url => ({ url, source: 'VIBE' as const }))
}

// ---------- The lookup ----------

export async function findAll(
  title: string, artist: string, album: string,
  isActive: () => boolean,
  onUpdate: (clips: VideoClip[]) => void,
): Promise<VideoClip[]> {
  const out = new Map<string, VideoClip>()
  const seenTracks = new Set<string>()
  const publish = () => { if (isActive()) onUpdate([...out.values()]) }
  /** Adds Apple videos until there are [max] clips in the list. */
  const add = (hits: AppleItem[], source: Source, max = MAX) => {
    const before = out.size
    for (const h of hits) {
      if (out.size >= max) break
      const url = h.previewUrl
      // The same video can have different preview URLs in the NO and US stores.
      const track = `${norm(h.artistName ?? '')}|${norm(h.trackName ?? '')}`
      if (!valid(url) || out.has(url) || seenTracks.has(track)) continue
      seenTracks.add(track)
      out.set(url, { url, source })
    }
    if (out.size > before) publish()
  }
  const addMotion = (url: string | null, source: Source) => {
    if (valid(url ?? undefined) && !out.has(url!) && out.size < MAX) { out.set(url!, { url: url!, source }); publish() }
  }
  const both = async (term: string) => (isActive() ? [...await search(term, 'no'), ...await search(term, 'us')] : [])

  // Main artist and bare title: «BlocBoy JB, Drake» + «Look Alive (feat. Drake)» → «BlocBoy JB Look Alive».
  const mainArtist = artist.split(/\s*(?:,|&| feat\.? | featuring | x )\s*/i)[0].trim() || artist
  // Cut « - Remastered» / «(feat. …)», but never a hyphen inside a word («E-Girls»).
  const cleanTitle = title.replace(/\s+[-–]\s+.*$|\s*[([].*$/, '').trim() || title

  const titleMatches = (name: string | undefined): boolean => {
    const t = norm(name ?? '')
    // A remix / live / acoustic version is not the song itself unless the playing title says so as often.
    if (VERSION_WORDS.some(w => count(t, w) > count(norm(title), w))) return false
    // «X (Pt. 2)» is another song than «X»: part words and numbers must agree.
    if (numbers(name ?? '').join('|') !== numbers(title).join('|')) return false
    return t === norm(title) || t === norm(cleanTitle) || (bareTitle(name).length > 0 && bareTitle(name) === bareTitle(title)) ||
      (cleanTitle !== title && norm(cleanTitle).length >= 4 && t.startsWith(norm(cleanTitle) + ' '))
  }

  // 0. The song's own music video from the artist's full video list, then the animated covers.
  const songSearch = isActive() ? await search(`${cleanTitle} ${mainArtist}`, 'us', 'song') : []
  const exactSong = songSearch.find(s => titleMatches(s.trackName) && sameArtist(s.artistName, artist))
  // Songs Apple lacks: another song by the artist still gives the artist id.
  const songMeta = exactSong ?? songSearch.find(s => sameArtist(s.artistName, artist))
  const artistId = songMeta?.artistId && songMeta.artistId > 0 ? songMeta.artistId : undefined
  // Album cover only from the song itself, never from another song's album.
  const collectionId = exactSong?.collectionId && exactSong.collectionId > 0 ? exactSong.collectionId : undefined
  const artistVideos = artistId && isActive() ? await lookup(artistId, 'musicVideo') : []
  add(artistVideos.filter(v => titleMatches(v.trackName)), 'SONG')

  // 1. The song itself (Apple search).
  const songHits = [...await both(`${mainArtist} ${cleanTitle}`),
    ...(mainArtist !== artist || cleanTitle !== title ? await both(`${artist} ${title}`) : [])]
  add(songHits.filter(h => titleMatches(h.trackName) && sameArtist(h.artistName, artist)), 'SONG')

  if (collectionId && isActive()) addMotion(await motion('album', collectionId), 'COVER')

  // No video of the song itself: rank the artist videos by theme so the best fit comes first.
  const scores = ![...out.values()].some(c => c.source === 'SONG') && isActive()
    ? await themeScores(artistVideos.filter(v => !titleMatches(v.trackName)), mainArtist, cleanTitle, collectionId, isActive)
    : new Map<string, number>()
  const score = (v: AppleItem) => scores.get(v.previewUrl ?? '') ?? 0

  if (artistId && isActive()) addMotion(await motion('artist', artistId), 'ARTIST_ART')

  // 2. The same album (Spotify album names often carry "(Deluxe)" / "Remastered"; Apple's may not).
  const wantAlbum = norm(album.replace(/\s*[-–([].*$/, ''))
  if (wantAlbum && isActive()) {
    add((await both(`${artist} ${album}`)).filter(v => {
      const c = norm(v.collectionName ?? '')
      return c.length > 0 && (c.startsWith(wantAlbum) || wantAlbum.startsWith(c)) && sameArtist(v.artistName, artist) && !junkVideo(v.trackName)
    }).sort((a, b) => score(b) - score(a)), 'ALBUM')
  }

  // 3. The same artist: closest in theme first; interviews, trailers and visualizers last.
  const ranked = [...artistVideos].sort((a, b) => (Number(junkVideo(a.trackName)) - Number(junkVideo(b.trackName))) || score(b) - score(a))
  add([...ranked, ...songHits, ...await both(mainArtist)].filter(v => sameArtist(v.artistName, artist) && !junkVideo(v.trackName)), 'ARTIST')

  // 6. Nothing for the song, album or artist: similar artists, then the genre (always at least one video).
  if (out.size === 0 && isActive()) {
    add(await relatedVibe(artist, title, isActive), 'VIBE', VIBE_COUNT)
    if (out.size === 0 && isActive()) {
      const apple = await appleGenre(title, artist)
      add(shuffled((await genreVideos(genreFromApple(apple), apple)).filter(v => !sameArtist(v.artistName, artist))), 'VIBE', VIBE_COUNT)
    }
  }
  return [...out.values()]
}
