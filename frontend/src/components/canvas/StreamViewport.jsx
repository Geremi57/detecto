import { useRef, useEffect, useCallback, useState } from 'react'
import { useCanvasRenderer } from '../../hooks/useCanvasRenderer'
import { Image as ImageIcon, Film, Maximize2, Minimize2, AlertTriangle, Camera, CameraOff, Loader2 } from 'lucide-react'

/**
 * Displays the active source (image / video / webcam stream) with real
 * detection boxes overlaid via canvas. Exposes the video element to the
 * detection loop via `videoElRef` so frames can be sampled for POST /detect.
 */
export function StreamViewport({ source, detections, annotatedImageUrl, overlayOptions, videoElRef, detecting, onDetectToggle, onError, className = '' }) {
  const containerRef = useRef(null)
  const localVideoRef = useRef(null)
  const canvasRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [mediaReady, setMediaReady] = useState(false)
  const [webcamState, setWebcamState] = useState('idle') // idle | requesting | ready | denied | error

  const videoRef = localVideoRef
  useEffect(() => {
    if (videoElRef) videoElRef.current = localVideoRef.current
  }, [videoElRef])

  const { resizeCanvas } = useCanvasRenderer(videoRef, canvasRef, detections, overlayOptions)

  const isImage = source?.type === 'image'
  const isVideo = source?.type === 'video'
  const isStream = source?.type === 'stream'

  // Reset state when the source changes.
  useEffect(() => {
    setHasError(false)
    setMediaReady(false)
    setWebcamState(source?.type === 'stream' ? 'requesting' : 'idle')
  }, [source])

  // Attach media source.
  // onError is routed through a ref so its identity can never re-trigger
  // getUserMedia or restart video playback mid-session.
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isVideo && source.url) {
      video.srcObject = null
      video.src = source.url
      video.loop = true
      video.muted = true
      video.play().catch(() => {})
    }

    if (isStream) {
      // cancelled guards the async getUserMedia resolution: if the user
      // switches sources before permission resolves, the stream is stopped
      // the instant it arrives instead of leaking a live camera.
      let cancelled = false
      setWebcamState('requesting')
      navigator.mediaDevices
        .getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
        .then((s) => {
          if (cancelled) {
            s.getTracks().forEach((t) => t.stop())
            return
          }
          video.srcObject = s
          video.src = null
          video.loop = false
          video.play().catch(() => {})
          setWebcamState('ready')
        })
        .catch((err) => {
          if (cancelled) return
          setWebcamState(err?.name === 'NotAllowedError' ? 'denied' : 'error')
          onErrorRef.current?.(err?.message || 'Could not access webcam')
        })
      return () => {
        cancelled = true
        // Stop whatever is attached now — not a stale local variable.
        video.srcObject?.getTracks().forEach((t) => t.stop())
        video.srcObject = null
      }
    }

    return () => {
      if (isVideo) {
        video.pause()
        video.removeAttribute('src')
        video.load()
      }
    }
  }, [source, isVideo, isStream, videoRef])

  const handleMediaError = useCallback(() => {
    setHasError(true)
    onErrorRef.current?.('Unable to load the selected media')
  }, [])

  const handleMediaReady = useCallback(() => {
    setMediaReady(true)
    setHasError(false)
    resizeCanvas()
  }, [resizeCanvas])

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current
    if (!container) return

    if (!isFullscreen) {
      try {
        await container.requestFullscreen()
        setIsFullscreen(true)
      } catch (e) {
        console.warn('Fullscreen request failed:', e)
      }
    } else {
      try {
        await document.exitFullscreen()
        setIsFullscreen(false)
      } catch (e) {
        console.warn('Exit fullscreen failed:', e)
      }
    }
  }, [isFullscreen])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
      setTimeout(resizeCanvas, 100)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [resizeCanvas])

  const getStatusIndicator = () => {
    if (!source) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-detecto-bg/90 backdrop-blur-sm">
          <div className="w-16 h-16 rounded-full bg-detecto-bgSecondary border border-detecto-border flex items-center justify-center">
            <CameraOff className="w-8 h-8 text-detecto-textDim" />
          </div>
          <div className="text-center">
            <p className="text-detecto-text font-medium">No Source Selected</p>
            <p className="text-detecto-textDim text-sm mt-1">Upload an image or video, or start the live stream</p>
          </div>
        </div>
      )
    }

    if (isStream && webcamState === 'denied') {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-detecto-danger/10">
          <div className="w-16 h-16 rounded-full bg-detecto-danger/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-detecto-danger" />
          </div>
          <div className="text-center">
            <p className="text-detecto-danger font-medium">Webcam Access Denied</p>
            <p className="text-detecto-textDim text-sm mt-1">Allow camera permissions and try again</p>
          </div>
        </div>
      )
    }

    if (isStream && webcamState === 'error') {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-detecto-danger/10">
          <div className="w-16 h-16 rounded-full bg-detecto-danger/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-detecto-danger" />
          </div>
          <div className="text-center">
            <p className="text-detecto-danger font-medium">Webcam Unavailable</p>
            <p className="text-detecto-textDim text-sm mt-1">No camera device found</p>
          </div>
        </div>
      )
    }

    if (hasError) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-detecto-danger/10 border border-detecto-danger/30">
          <div className="w-16 h-16 rounded-full bg-detecto-danger/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-detecto-danger" />
          </div>
          <div className="text-center">
            <p className="text-detecto-danger font-medium">Media Error</p>
            <p className="text-detecto-textDim text-sm mt-1">Unable to load the selected file</p>
          </div>
        </div>
      )
    }

    if (!mediaReady && !isStream) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-detecto-bg/80 backdrop-blur-sm">
          <Loader2 className="w-10 h-10 text-detecto-accent animate-spin" />
        </div>
      )
    }

    return (
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between px-4 py-2 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-detecto-bgCard/90 backdrop-blur-xl rounded-lg border border-detecto-border/50 pointer-events-auto">
          {isStream ? (
            <>
              <span className="w-2 h-2 rounded-full bg-detecto-danger animate-pulse" />
              <span className="text-xs font-mono text-detecto-danger">LIVE</span>
            </>
          ) : (
            <>
              {isImage ? <ImageIcon className="w-3.5 h-3.5 text-detecto-info" /> : <Film className="w-3.5 h-3.5 text-detecto-info" />}
              <span className="text-xs font-mono text-detecto-info">{isImage ? 'IMAGE' : 'VIDEO'}</span>
            </>
          )}
          {detecting && (
            <span className="flex items-center gap-1 text-xs font-mono text-detecto-accent ml-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              detecting
            </span>
          )}
        </div>
        {!isImage && (
          <button
            onClick={onDetectToggle}
            className={`px-3 py-1.5 rounded-lg border transition-colors pointer-events-auto flex items-center gap-2 text-xs font-medium ${
              detecting
                ? 'bg-detecto-danger/20 border-detecto-danger/50 text-detecto-danger hover:bg-detecto-danger/30'
                : 'bg-detecto-bgCard/90 backdrop-blur-xl border-detecto-border/50 hover:border-detecto-accent/50 text-detecto-text'
            }`}
            title={detecting ? 'Stop detection' : 'Start detection'}
          >
            {detecting ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
            {detecting ? 'Stop Detection' : 'Start Detection'}
          </button>
        )}
        <button
          onClick={toggleFullscreen}
          className="px-3 py-1.5 bg-detecto-bgCard/90 backdrop-blur-xl rounded-lg border border-detecto-border/50 hover:border-detecto-accent/50 transition-colors pointer-events-auto"
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4 text-detecto-text" /> : <Maximize2 className="w-4 h-4 text-detecto-text" />}
        </button>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-detecto-bgCard rounded-xl overflow-hidden ${className}`}
    >
      {/* Video stays mounted across source switches so the detection loop's
          videoRef never points at a detached node; hidden in image mode. */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain"
        style={{ display: isImage ? 'none' : 'block', visibility: isImage ? 'hidden' : 'visible' }}
        playsInline
        muted
        onLoadedMetadata={handleMediaReady}
        onCanPlay={handleMediaReady}
        onPlaying={handleMediaReady}
        onError={handleMediaError}
        onResize={resizeCanvas}
      />

      {isImage && (annotatedImageUrl || source.url) && (
        <img
          src={annotatedImageUrl || source.url}
          alt={source.name}
          className="absolute inset-0 w-full h-full object-contain"
          onLoad={handleMediaReady}
          onError={handleMediaError}
        />
      )}

      {!(isImage && annotatedImageUrl) && (
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 pointer-events-none"
          style={{ transformOrigin: 'top left' }}
        />
      )}

      {getStatusIndicator()}
    </div>
  )
}
