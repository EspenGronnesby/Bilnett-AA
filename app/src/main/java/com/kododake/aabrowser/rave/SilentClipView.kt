package com.kododake.aabrowser.rave

import android.content.Context
import android.graphics.SurfaceTexture
import android.view.Surface
import android.view.TextureView
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.VideoSize
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory

/**
 * Silent, looping music video behind Rave (Apple music videos .m4v and animated covers .m3u8).
 * Played with ExoPlayer through [RaveVideoCache], so a clip seen before plays from the phone.
 */
@UnstableApi
internal class SilentClipView(context: Context, private val url: String,
    private val onFrame: () -> Unit,
    /** permanent = the clip is broken; false = only no network now (keep it for later). */
    private val onFailure: (permanent: Boolean) -> Unit
) : TextureView(context), TextureView.SurfaceTextureListener, ClipPlayer {
    private var player: ExoPlayer? = null
    private var surface: Surface? = null
    private var wanted = false
    private var released = false
    private var videoW = 0
    private var videoH = 0
    private val timeout = Runnable { fail(permanent = false) }

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
        player?.playWhenReady = value
    }

    override fun onSurfaceTextureAvailable(texture: SurfaceTexture, width: Int, height: Int) {
        if (released) return
        surface = Surface(texture)
        try {
            player = ExoPlayer.Builder(context)
                .setMediaSourceFactory(DefaultMediaSourceFactory(RaveVideoCache.dataSource(context)))
                .build().also { p ->
                    p.setVideoSurface(surface)
                    p.volume = 0f
                    p.repeatMode = Player.REPEAT_MODE_ONE
                    p.addListener(object : Player.Listener {
                        override fun onRenderedFirstFrame() { removeCallbacks(timeout); onFrame() }
                        override fun onPlayerError(error: PlaybackException) {
                            // No signal (car, tunnel) is not a broken clip: skip it now, keep it stored.
                            val network = error.errorCode == PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_FAILED ||
                                error.errorCode == PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_TIMEOUT ||
                                error.errorCode == PlaybackException.ERROR_CODE_IO_UNSPECIFIED
                            fail(permanent = !network)
                        }
                        override fun onVideoSizeChanged(videoSize: VideoSize) {
                            // Account for non-square pixels so covers keep their shape.
                            videoW = (videoSize.width * videoSize.pixelWidthHeightRatio).toInt(); videoH = videoSize.height; crop()
                        }
                    })
                    p.setMediaItem(MediaItem.fromUri(url))
                    p.playWhenReady = wanted
                    p.prepare()
                    postDelayed(timeout, 12000)
                }
        } catch (_: Exception) { fail(permanent = true) }
    }

    private fun fail(permanent: Boolean) { if (!released) { release(); onFailure(permanent) } }

    override fun release() {
        released = true
        removeCallbacks(timeout)
        player?.release(); player = null
        surface?.release(); surface = null
    }

    override fun onSurfaceTextureDestroyed(texture: SurfaceTexture): Boolean { release(); return true }
    override fun onSurfaceTextureSizeChanged(texture: SurfaceTexture, width: Int, height: Int) = crop()
    override fun onSurfaceTextureUpdated(texture: SurfaceTexture) = Unit
}
