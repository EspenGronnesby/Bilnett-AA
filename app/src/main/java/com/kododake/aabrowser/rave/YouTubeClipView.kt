package com.kododake.aabrowser.rave

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.util.Log
import android.view.MotionEvent
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebViewClient
import android.webkit.WebView

/** Shared by the two background players so Rave can treat them the same way. */
internal interface ClipPlayer {
    fun setPlaying(value: Boolean)
    fun release()
}

/**
 * Muted YouTube concert footage behind the cover (IFrame player in a WebView).
 * Long sets start at a random point so it is not always the intro. Touches pass through to Rave.
 */
@SuppressLint("SetJavaScriptEnabled", "ViewConstructor")
internal class YouTubeClipView(
    context: Context, videoId: String,
    private val onFrame: () -> Unit, private val onFailure: () -> Unit,
) : WebView(context), ClipPlayer {
    private var released = false
    private var started = false
    private var failed = false
    @Volatile private var wanted = false
    private val timeout = Runnable { fail() }

    init {
        setBackgroundColor(Color.TRANSPARENT)
        isClickable = false
        isFocusable = false
        isVerticalScrollBarEnabled = false
        isHorizontalScrollBarEnabled = false
        settings.javaScriptEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.allowFileAccess = false
        settings.allowContentAccess = false
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        settings.safeBrowsingEnabled = true
        webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(m: ConsoleMessage): Boolean {
                Log.d("RaveVideo", "yt-js: ${m.message()}"); return true
            }
        }
        // The page must never leave the player (the JS bridge would follow it).
        webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest) = true
        }
        addJavascriptInterface(Bridge(), "Rave")
        // YouTube refuses embeds without a proper https origin (error 152/153), hence the base URL.
        val origin = "https://${context.packageName}"
        if (ID.matches(videoId)) {
            loadDataWithBaseURL(origin, html(videoId, origin), "text/html", "utf-8", null)
            postDelayed(timeout, 25000) // room for a pre-roll ad
        } else post { fail() }
    }

    private inner class Bridge {
        @JavascriptInterface fun playing() = post {
            if (released || failed) return@post
            removeCallbacks(timeout)
            if (!started) { started = true; Log.d("RaveVideo", "YouTube playing -> show"); onFrame() }
        }
        @JavascriptInterface fun error(code: Int) = post { Log.w("RaveVideo", "YouTube player error $code"); fail() }
        @JavascriptInterface fun wanted() = wanted
    }

    override fun setPlaying(value: Boolean) {
        wanted = value
        if (!released && !failed) evaluateJavascript("window.setWant && setWant($value)", null) // page may still be loading; onReady reads wanted()
    }

    // Purely visual: never take taps or drags from Rave.
    override fun dispatchTouchEvent(event: MotionEvent?) = false

    // Stop now; the actual destroy() happens in release(), once Compose has detached the view.
    private fun fail() {
        if (released || failed) return
        Log.w("RaveVideo", "YouTube clip failed (timeout or error), skipping")
        failed = true
        removeCallbacks(timeout)
        try { stopLoading(); loadUrl("about:blank") } catch (_: Exception) { }
        onFailure()
    }

    override fun release() {
        if (released) return
        released = true
        removeCallbacks(timeout)
        try { stopLoading(); removeJavascriptInterface("Rave"); loadUrl("about:blank"); destroy() } catch (_: Exception) { }
    }

    private companion object { val ID = Regex("^[A-Za-z0-9_-]{11}$") }

    private fun html(id: String, origin: String) = """
<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;background:transparent;overflow:hidden}
#p{position:absolute;top:0;left:0;border:0;pointer-events:none}</style></head>
<body><div id="p"></div>
<script>
var player, want = false, ready = false, jumped = false;
window.setWant = function(v){ want = v; if(!ready) return; if(v) player.playVideo(); else player.pauseVideo(); }
// The WebView is created before it has its final size, so CSS 100%/100vh resolve to 0 height.
// Size the player in pixels from the real window instead, and again whenever it changes.
// Fill the screen like «cover» (no black bars), zoomed a bit more so YouTube's title, logo and
// «More videos» bar fall outside the edges.
function fit(){
  var f = document.getElementById('p'); if (!f) return;
  var W = innerWidth, H = innerHeight, zoom = 1.3;
  var w = Math.max(W, H * 16 / 9) * zoom, h = w * 9 / 16;
  f.style.width = w + 'px'; f.style.height = h + 'px';
  f.style.left = (W - w) / 2 + 'px'; f.style.top = (H - h) / 2 + 'px';
}
addEventListener('resize', fit); setInterval(fit, 1000);
function onYouTubeIframeAPIReady(){
  player = new YT.Player('p', { videoId: '$id', width: innerWidth, height: innerHeight, host: 'https://www.youtube-nocookie.com',
    playerVars: { autoplay: 1, mute: 1, controls: 0, disablekb: 1, fs: 0, rel: 0, playsinline: 1,
      iv_load_policy: 3, modestbranding: 1, origin: '$origin' },
    events: {
      onReady: function(e){ fit(); ready = true; want = Rave.wanted(); e.target.mute(); if(want) e.target.playVideo(); },
      onStateChange: function(e){
        if (e.data === YT.PlayerState.PLAYING) {
          // Autoplay ignores a paused song; hold it until the music plays.
          if (!want) { player.pauseVideo(); return; }
          var d = player.getDuration();
          // Long concert sets: jump 10–70 % in, once, and show the video only after the jump.
          if (!jumped && d > 240) {
            jumped = true;
            player.seekTo(d * (0.1 + Math.random() * 0.6), true);
            setTimeout(function(){ if (player.getPlayerState() === YT.PlayerState.PLAYING) Rave.playing(); }, 2500);
            return;
          }
          Rave.playing();
        }
        if (e.data === YT.PlayerState.ENDED) { player.seekTo(0, true); if (want) player.playVideo(); }
      },
      onError: function(e){ Rave.error(e.data); }
    } });
}
</script><script src="https://www.youtube.com/iframe_api"></script></body></html>
"""
}
