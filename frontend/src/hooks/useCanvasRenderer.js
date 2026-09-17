import { useRef, useEffect, useCallback } from 'react'

export function useCanvasRenderer(videoRef, canvasRef, detections, options = {}) {
  const { showBoxes = true, showLabels = true, showConfidence = true } = options
  const animationRef = useRef(null)

  const draw = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return

    const ctx = canvas.getContext('2d')
    const scaleX = canvas.width / video.videoWidth
    const scaleY = canvas.height / video.videoHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    if (showBoxes && detections) {
      detections.forEach(det => {
        const [x, y, w, h] = det.bbox.map((v, i) => v * (i % 2 === 0 ? scaleX : scaleY))
        ctx.strokeStyle = det.color || '#00ff00'
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, w * scaleX, h * scaleY)

        if (showLabels || showConfidence) {
          const label = [
            showLabels && det.class,
            showConfidence && `${(det.confidence * 100).toFixed(1)}%`
          ].filter(Boolean).join(' ')
          ctx.fillStyle = det.color || '#00ff00'
          ctx.font = '14px monospace'
          ctx.fillText(label, x, y - 5)
        }
      })
    }
  }, [videoRef, canvasRef, detections, showBoxes, showLabels, showConfidence])

  useEffect(() => {
    const loop = () => {
      draw()
      animationRef.current = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(animationRef.current)
  }, [draw])

  return { draw }
}