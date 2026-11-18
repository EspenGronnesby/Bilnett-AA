# Rave web (PC)

Rave as a full-screen web page for a PC monitor, landscape or portrait. Shows what Spotify
plays (web player on the PC or the app on the phone) via the Spotify Web API.
Part of Bilnett, a fork of [AABrowser](https://github.com/kododake/AABrowser) by kododake, GPL-3.0.

## Setup
1. Create an app at developer.spotify.com (Web API) with redirect URI `http://127.0.0.1:5173/callback`
   (and `https://<your-vercel-domain>/callback` once deployed).
2. `cp .env.example .env.local` and put the Client ID in `VITE_SPOTIFY_CLIENT_ID`.
3. `npm install && npm run dev`, open http://127.0.0.1:5173 (not localhost).

Dev only: `/?demo` shows a made-up song to check the layout without logging in.
