import { useRef, useEffect, useCallback, useState } from 'react'
import { useCanvasRenderer } from '../../hooks/useCanvasRenderer'
import { Wifi, WifiOff, Maximize2, Minimize2 } from 'lucide-react'

export function StreamViewport({ src, detections, overlayOptions, onError, className = '' }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [videoReady, setVideoReady] = useState(false)

  const { draw, resizeCanvas, transform } = useCanvasRenderer(videoRef, canvasRef, detections, overlayOptions)

  const handleVideoError = useCallback((e) => {
    setHasError(true)
    onError?.(e)
  }, [onError])

  const handleVideoLoaded = useCallback(() => {
    setVideoReady(true)
    setHasError(false)
    resizeCanvas()
  }, [resizeCanvas])

  useEffect(() => {
    const video = videoRef.current
    if (video && src) {
      video.srcObject = src
      video.play().catch(() => {})
    }
    return () => {
      if (video?.srcObject) {
        video.srcObject.getTracks().forEach(t => t.stop())
      }
    }
  }, [src])

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
    if (!src) return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-detecto-bg/90 backdrop-blur-sm">
        <div className="w-16 h-16 rounded-full bg-detecto-bgSecondary border border-detecto-border flex items-center justify-center animate-pulse">
          <WifiOff className="w-8 h-8 text-detecto-textDim" />
        </div>
        <div className="text-center">
          <p className="text-detecto-text font-medium">No Stream Connected</p>
          <p className="text-detecto-textDim text-sm mt-1">Awaiting camera input...</p>
        </div>
      </div>
    )

    if (hasError) return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-detecto-danger/10 border border-detecto-danger/30">
        <div className="w-16 h-16 rounded-full bg-detecto-danger/20 flex items-center justify-center">
          <WifiOff className="w-8 h-8 text-detecto-danger" />
        </div>
        <div className="text-center">
          <p className="text-detecto-danger font-medium">Stream Error</p>
          <p className="text-detecto-textDim text-sm mt-1">Unable to load video stream</p>
        </div>
      </div>
    )

    if (!videoReady) return (
      <div className="absolute inset-0 flex items-center justify-center bg-detecto-bg/80 backdrop-blur-sm">
        <div className="w-12 h-12 border-3 border-detecto-accent/30 border-t-detecto-accent rounded-full animate-spin" />
      </div>
    )

    return (
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between px-4 py-2 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-detecto-bgCard/90 backdrop-blur-xl rounded-lg border border-detecto-border/50 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-detecto-accent animate-pulse" />
          <span className="text-xs font-mono text-detecto-accent">LIVE</span>
        </div>
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
      style={{ '--video-width': transform?.scaleX ? `${1 / transform.scaleX}px` : 'auto' }}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain"
        playsInline
        muted
        onLoadedMetadata={handleVideoLoaded}
        onError={handleVideoError}
        onResize={resizeCanvas}
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 pointer-events-none"
        style={{
          transformOrigin: 'top left',
          imageRendering: 'crisp-edges',
        }}
      />
      {getStatusIndicator()}
    </div>
  )
}