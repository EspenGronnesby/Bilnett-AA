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

## Layouts and controls

- **Layouts:** portrait (Musikkplakat, Tidligere original, Tekstfokus, Party-scene, Filmvisning) and landscape
  (Standard, Tekstfokus, Filmvisning, Party-scene), picked in the top-right corner or in the settings. Each layout
  remembers its own lyrics style. Party-scene turns the video off when chosen; Filmvisning turns it on.
- **Bottom bar (every layout):** Party's controls (when on), the view buttons (Tekst, sync, Ren, Video) and the play
  controls in the same place; they show and hide together. Its measured height is kept free by the layouts.
- **Settings:** a short overview (Konto og enhet, Skjerm, Utseende, Hurtigtaster) where each row opens its part in
  the same sheet; «Tilbakestill» resets everything except the lyrics sync per device.
- **Keys:** F full screen, H clean view (cover and visuals only), Esc leave clean view / close, ←/→ lyrics style,
  ? shortcut overview.

## Party

Switch Party on with the speaker button or five quick taps on the cover. Share the PC's sound
in Chrome/Edge on Windows: select the entire screen and enable system audio in the sharing dialog.
Party can also listen to a shared browser tab or a microphone. If sharing is unavailable or
contains no audio, it tries the microphone; cancelling the sharing dialog does not trigger a fallback.
After reloading, pick the sound source again (PC-lyd, Fanelyd or Mikrofon) in the bottom bar.

The ring, particles, lights, cover pulse and shake use the shared `rave-core` engine. The Auto
button follows the detected genre; the strength slider saves a separate override for each genre.
The optional Koko button enables the dancing ghost (off by default). «Ingen blinking» in the settings turns
off strobe and white flashes (also when the system is set to reduce motion); the ring follows the cover's pulse.

Development checks: `/?demo&party&novideo&song=hard&koko` feeds synthetic sound into the engine
and brings Koko in after two seconds. Demo mode is disabled in production. `/?lydtest` remains
available in production to check sound sharing. Song-part corrections, analysis logging and
training on the website are a later step.
