import { accessToken } from './auth'

// Small helpers for the Spotify Web API calls Rave makes besides polling.
// All control calls need Premium and the user-modify-playback-state permission.

const BASE = 'https://api.spotify.com/v1'

export async function spotifyFetch(path: string, init: RequestInit = {}, retried = false): Promise<Response> {
  const token = await accessToken(retried) // throws TemporaryError without network
  if (!token) throw new Error('logged out')
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  if (res.status === 401 && !retried) return spotifyFetch(path, init, true)
  if (res.status === 429 && !retried) {
    const wait = Math.min(Number(res.headers.get('Retry-After') ?? '2'), 10)
    await new Promise(r => setTimeout(r, wait * 1000))
    return spotifyFetch(path, init, true)
  }
  return res
}

export interface Me { name: string; imageUrl: string | null }

export async function getMe(): Promise<Me | null> {
  const res = await spotifyFetch('/me')
  if (!res.ok) return null
  const json = await res.json()
  return { name: json.display_name ?? json.id ?? '', imageUrl: json.images?.[0]?.url ?? null }
}

export interface DeviceInfo {
  id: string
  name: string
  type: string
  active: boolean
  restricted: boolean
  volume: number | null
  supportsVolume: boolean
}

export async function getDevices(): Promise<DeviceInfo[]> {
  const res = await spotifyFetch('/me/player/devices')
  if (!res.ok) return []
  const json = await res.json()
  return (json.devices ?? []).map((d: Record<string, unknown>) => ({
    id: String(d.id ?? ''),
    name: String(d.name ?? ''),
    type: String(d.type ?? ''),
    active: !!d.is_active,
    restricted: !!d.is_restricted,
    volume: typeof d.volume_percent === 'number' ? d.volume_percent : null,
    supportsVolume: !!d.supports_volume,
  })).filter((d: DeviceInfo) => d.id)
}

const deviceQuery = (deviceId?: string | null) => (deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : '')

/** Moves playback to this device (and starts it when play is true). */
export const transfer = (deviceId: string, play = true) =>
  spotifyFetch('/me/player', { method: 'PUT', body: JSON.stringify({ device_ids: [deviceId], play }) })

export const play = (deviceId?: string | null) => spotifyFetch(`/me/player/play${deviceQuery(deviceId)}`, { method: 'PUT' })
export const pause = (deviceId?: string | null) => spotifyFetch(`/me/player/pause${deviceQuery(deviceId)}`, { method: 'PUT' })
export const seek = (positionMs: number, deviceId?: string | null) =>
  spotifyFetch(`/me/player/seek?position_ms=${Math.max(0, Math.round(positionMs))}${deviceId ? `&device_id=${encodeURIComponent(deviceId)}` : ''}`, { method: 'PUT' })
export const next = (deviceId?: string | null) => spotifyFetch(`/me/player/next${deviceQuery(deviceId)}`, { method: 'POST' })
export const previous = (deviceId?: string | null) => spotifyFetch(`/me/player/previous${deviceQuery(deviceId)}`, { method: 'POST' })

export function setVolume(percent: number, deviceId?: string | null) {
  const p = Math.round(Math.min(Math.max(percent, 0), 100))
  const dev = deviceId ? `&device_id=${encodeURIComponent(deviceId)}` : ''
  return spotifyFetch(`/me/player/volume?volume_percent=${p}${dev}`, { method: 'PUT' })
}
