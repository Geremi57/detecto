import { useRef, useEffect } from 'react'
import { useCanvasRenderer } from '../../hooks/useCanvasRenderer'
import { Video, Wifi, WifiOff } from 'lucide-react'

export function StreamViewport({ src, detections, overlayOptions }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  useCanvasRenderer(videoRef, canvasRef, detections, overlayOptions)

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

  return (
    <div className="relative w-full h-full bg-detecto-bgCard rounded-xl overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain"
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      {!src && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-detecto-bg/80 backdrop-blur-sm">
          <div className="w-16 h-16 rounded-full bg-detecto-bgSecondary border border-detecto-border flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-detecto-textDim" />
          </div>
          <div className="text-center">
            <p className="text-detecto-text font-medium">No Stream Connected</p>
            <p className="text-detecto-textDim text-sm mt-1">Connect a camera to begin detection</p>
          </div>
        </div>
      )}
      {src && (
        <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-detecto-bgCard/90 backdrop-blur-xl rounded-lg border border-detecto-border/50">
          <span className="w-2 h-2 rounded-full bg-detecto-accent animate-pulse" />
          <span className="text-xs font-mono text-detecto-accent">LIVE</span>
        </div>
      )}
    </div>
  )
}