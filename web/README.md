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

## Party

Switch Party on with the speaker button or five quick taps on the cover. Share the PC's sound
in Chrome/Edge on Windows: select the entire screen and enable system audio in the sharing dialog.
Party can also listen to a shared browser tab or a microphone. If sharing is unavailable or
contains no audio, it tries the microphone; cancelling the sharing dialog does not trigger a fallback.
After reloading, click the listening prompt to reconnect the sound.

The ring, particles, lights, cover pulse and shake use the shared `rave-core` engine. The Auto
button follows the detected genre; the strength slider saves a separate override for each genre.
The optional Koko button enables the dancing ghost (off by default).

Development checks: `/?demo&party&novideo&song=hard&koko` feeds synthetic sound into the engine
and brings Koko in after two seconds. Demo mode is disabled in production. `/?lydtest` remains
available in production to check sound sharing. Song-part corrections, analysis logging and
training on the website are a later step.
