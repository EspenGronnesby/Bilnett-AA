// Spotify login with Authorization Code + PKCE: no client secret in the browser.
// Tokens live in localStorage (private, single-user tool). The access token is renewed
// before it runs out, and only one tab renews at a time (navigator.locks), because a
// rotated refresh token would otherwise invalidate the other tab's copy.

export const CLIENT_ID: string = import.meta.env.VITE_SPOTIFY_CLIENT_ID ?? ''
// Reading what plays, controlling it, and playing in the page itself (Web Playback SDK).
const SCOPES = 'user-read-playback-state user-read-currently-playing user-modify-playback-state streaming user-read-email user-read-private'
const KEY = 'rave.spotify.tokens'
const PENDING = 'rave.spotify.pending'

interface Tokens { access: string; refresh: string; expiresAt: number; scope?: string }

const redirectUri = () => `${location.origin}/callback`

function readTokens(): Tokens | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Tokens) : null
  } catch { return null }
}

function saveTokens(json: { access_token: string; refresh_token?: string; expires_in: number; scope?: string }, oldRefresh = '', oldScope = '') {
  const t: Tokens = {
    access: json.access_token,
    // Spotify may or may not rotate the refresh token: keep the old one if none came back.
    refresh: json.refresh_token ?? oldRefresh,
    expiresAt: Date.now() + json.expires_in * 1000,
    scope: json.scope ?? oldScope,
  }
  localStorage.setItem(KEY, JSON.stringify(t))
}

/** Logged in with every permission Rave needs (an older login without playback asks again once). */
export function isLoggedIn(): boolean {
  const t = readTokens()
  if (!t) return false
  const granted = new Set((t.scope ?? '').split(' '))
  return SCOPES.split(' ').every(s => granted.has(s))
}

/** Logged in, but from before Rave could play music itself. */
export const needsNewPermissions = () => readTokens() !== null && !isLoggedIn()

export function logout() { localStorage.removeItem(KEY) }

function randomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, b => chars[b % chars.length]).join('')
}

async function challengeFor(verifier: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Sends the browser to Spotify's login page. */
export async function login() {
  const verifier = randomString(64)
  const state = randomString(16)
  localStorage.setItem(PENDING, JSON.stringify({ verifier, state }))
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: SCOPES,
    redirect_uri: redirectUri(),
    code_challenge_method: 'S256',
    code_challenge: await challengeFor(verifier),
    state,
  })
  location.assign(`https://accounts.spotify.com/authorize?${params}`)
}

async function tokenRequest(body: Record<string, string>) {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, ...body }),
  })
  if (!res.ok) throw new TokenError(res.status)
  return res.json()
}

/** Spotify answered the token request with an error code (fetch itself throwing = no network). */
class TokenError extends Error {
  constructor(readonly status: number) { super(`token ${status}`) }
}

/** The network or Spotify hiccuped: keep the login and try again later. */
export class TemporaryError extends Error {}

/**
 * Finishes the login when Spotify sends us back to /callback?code=…
 * Returns an error text for the screen, or null when there was nothing to do / it worked.
 */
let callback: Promise<string | null> | null = null

export function handleCallback(): Promise<string | null> {
  // React may call this twice in development; both calls must wait for the same token exchange.
  callback ??= finishLogin()
  return callback
}

async function finishLogin(): Promise<string | null> {
  if (location.pathname !== '/callback') return null
  const url = new URL(location.href)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const pending = (() => {
    try { return JSON.parse(localStorage.getItem(PENDING) ?? 'null') as { verifier: string; state: string } | null }
    catch { return null }
  })()
  localStorage.removeItem(PENDING)
  history.replaceState(null, '', '/')
  if (error) return 'Innloggingen ble avbrutt.'
  if (!code || !pending || url.searchParams.get('state') !== pending.state) return 'Innloggingen feilet. Prøv igjen.'
  try {
    saveTokens(await tokenRequest({
      grant_type: 'authorization_code', code, redirect_uri: redirectUri(), code_verifier: pending.verifier,
    }))
    return null
  } catch {
    return 'Innloggingen feilet. Prøv igjen.'
  }
}

async function refresh(): Promise<void> {
  const run = async () => {
    // Another tab may have renewed while we waited for the lock.
    const t = readTokens()
    if (!t) throw new Error('logged out')
    if (t.expiresAt - Date.now() > 60_000) return
    saveTokens(await tokenRequest({ grant_type: 'refresh_token', refresh_token: t.refresh }), t.refresh, t.scope)
  }
  if (navigator.locks) await navigator.locks.request('rave-spotify-token', run)
  else await run()
}

/**
 * A valid access token (renewed a minute before it runs out), or null when logged out.
 * Throws TemporaryError when renewing failed because of the network or a Spotify hiccup:
 * then the login is kept, so a PC that stays on all day isn't logged out by a Wi-Fi blip.
 */
export async function accessToken(force = false): Promise<string | null> {
  let t = readTokens()
  if (!t) return null
  if (force) {
    localStorage.setItem(KEY, JSON.stringify({ ...t, expiresAt: 0 }))
  }
  if (force || t.expiresAt - Date.now() < 60_000) {
    try {
      await refresh()
    } catch (e) {
      // Only a refused refresh token (400/401) means the login is gone for good.
      if (e instanceof TokenError && (e.status === 400 || e.status === 401)) { logout(); return null }
      if (e instanceof Error && e.message === 'logged out') return null
      const still = readTokens()
      if (!force && still && still.expiresAt > Date.now()) return still.access
      throw new TemporaryError('token renewal failed')
    }
    t = readTokens()
  }
  return t?.access ?? null
}
