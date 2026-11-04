package com.kododake.aabrowser.rave

import android.content.Context
import android.graphics.SurfaceTexture
import android.media.MediaPlayer
import android.view.Surface
import android.view.TextureView

internal class SilentClipView(context: Context, private val url: String,
    private val onFrame: () -> Unit, private val onFailure: () -> Unit
) : TextureView(context), TextureView.SurfaceTextureListener, ClipPlayer {
    private var player: MediaPlayer? = null
    private var surface: Surface? = null
    private var prepared = false
    private var wanted = false
    private var released = false
    private var videoW = 0
    private var videoH = 0
    private val timeout = Runnable { fail() }

    /** Fill the view like «center crop»: square covers and 16:9 videos are never stretched. */
    private fun crop() {
        val vw = width.toFloat(); val vh = height.toFloat()
        if (videoW <= 0 || videoH <= 0 || vw <= 0f || vh <= 0f) return
        val scale = maxOf(vw / videoW, vh / videoH)
        val m = android.graphics.Matrix()
        m.setScale(videoW * scale / vw, videoH * scale / vh, vw / 2f, vh / 2f)
        setTransform(m)
    }

    init { surfaceTextureListener = this }
    override fun setPlaying(value: Boolean) {
        wanted = value
        val p = player ?: return
        if (!prepared) return
        try { if (value && !p.isPlaying) p.start() else if (!value && p.isPlaying) p.pause() }
        catch (_: Exception) { fail() }
    }
    override fun onSurfaceTextureAvailable(texture: SurfaceTexture, width: Int, height: Int) {
        if (released) return
        surface = Surface(texture)
        try {
            player = MediaPlayer().also { p ->
                p.setSurface(surface)
                p.setVolume(0f, 0f)
                p.isLooping = false
                p.setOnPreparedListener { prepared = true; setPlaying(wanted) }
                p.setOnVideoSizeChangedListener { _, w, h -> videoW = w; videoH = h; crop() }
                p.setOnCompletionListener {
                    if (!released && wanted) {
                        try { p.seekTo(0); p.start() } catch (_: Exception) { fail() }
                    }
                }
                p.setOnInfoListener { _, what, _ ->
                    if (what == MediaPlayer.MEDIA_INFO_VIDEO_RENDERING_START) {
                        removeCallbacks(timeout)
                        onFrame()
                    }
                    false
                }
                p.setOnErrorListener { _, _, _ -> fail(); true }
                p.setDataSource(url)
                p.prepareAsync()
                postDelayed(timeout, 12000)
            }
        } catch (_: Exception) { fail() }
    }
    private fun fail() { if (!released) { release(); onFailure() } }
    override fun release() {
        released = true
        removeCallbacks(timeout)
        player?.release(); player = null
        surface?.release(); surface = null
        prepared = false
    }
    override fun onSurfaceTextureDestroyed(texture: SurfaceTexture): Boolean { release(); return true }
    override fun onSurfaceTextureSizeChanged(texture: SurfaceTexture, width: Int, height: Int) = crop()
    override fun onSurfaceTextureUpdated(texture: SurfaceTexture) = Unit
}
