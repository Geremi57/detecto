import { useRef, useEffect } from 'react'
import { useCanvasRenderer } from '../../hooks/useCanvasRenderer'

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
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
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
    </div>
  )
}