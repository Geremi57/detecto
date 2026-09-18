import { useRef, useEffect, useCallback, useLayoutEffect } from 'react'

/**
 * Draws real detection results (backend format: { x1, y1, x2, y2, confidence })
 * on a transparent canvas positioned exactly over the displayed media area,
 * accounting for letterboxing. Works with both video and image sources by
 * measuring the media element's intrinsic size (videoWidth or naturalWidth).
 */
export function useCanvasRenderer(mediaRef, canvasRef, detections, options = {}) {
  const {
    showBoxes = true,
    showLabels = true,
    showConfidence = true,
    boxThickness = 2,
    fontSize = 12,
  } = options

  const animationRef = useRef(null)
  const transformRef = useRef({ scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 })
  const optionsRef = useRef(options)
  optionsRef.current = options
  const detectionsRef = useRef(detections)
  detectionsRef.current = detections

  const resizeCanvas = useCallback(() => {
    const media = mediaRef.current
    const canvas = canvasRef.current
    if (!media || !canvas) return

    const mediaWidth = media.videoWidth || media.naturalWidth
    const mediaHeight = media.videoHeight || media.naturalHeight
    if (!mediaWidth || !mediaHeight) return

    const dpr = window.devicePixelRatio || 1
    const container = canvas.parentElement
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    const displayWidth = containerRect.width
    const displayHeight = containerRect.height

    const mediaAspect = mediaWidth / mediaHeight
    const containerAspect = displayWidth / displayHeight

    let drawWidth, drawHeight, offsetX, offsetY

    if (mediaAspect > containerAspect) {
      drawWidth = displayWidth
      drawHeight = displayWidth / mediaAspect
      offsetX = 0
      offsetY = (displayHeight - drawHeight) / 2
    } else {
      drawHeight = displayHeight
      drawWidth = displayHeight * mediaAspect
      offsetX = (displayWidth - drawWidth) / 2
      offsetY = 0
    }

    canvas.width = drawWidth * dpr
    canvas.height = drawHeight * dpr
    canvas.style.width = `${drawWidth}px`
    canvas.style.height = `${drawHeight}px`
    canvas.style.marginLeft = `${offsetX}px`
    canvas.style.marginTop = `${offsetY}px`

    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    transformRef.current = {
      scaleX: drawWidth / mediaWidth,
      scaleY: drawHeight / mediaHeight,
      offsetX,
      offsetY,
    }
  }, [mediaRef, canvasRef])

  useLayoutEffect(() => {
    const media = mediaRef.current
    const canvas = canvasRef.current
    if (!media || !canvas) return

    const handleResize = () => resizeCanvas()

    media.addEventListener('loadedmetadata', handleResize)
    media.addEventListener('resize', handleResize)
    window.addEventListener('resize', handleResize)

    resizeCanvas()

    return () => {
      media.removeEventListener('loadedmetadata', handleResize)
      media.removeEventListener('resize', handleResize)
      window.removeEventListener('resize', handleResize)
    }
  }, [mediaRef, canvasRef, resizeCanvas])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)

    const currentDetections = detectionsRef.current
    const {
      showBoxes: boxes,
      showLabels: labels,
      showConfidence: confidence,
      boxThickness: thickness,
      fontSize: size,
    } = optionsRef.current

    if (!boxes || !currentDetections?.length) return
    const { scaleX, scaleY } = transformRef.current

    currentDetections.forEach((det) => {
      const x = det.x1 * scaleX
      const y = det.y1 * scaleY
      const w = (det.x2 - det.x1) * scaleX
      const h = (det.y2 - det.y1) * scaleY
      const color = '#00FF88'

      ctx.strokeStyle = color
      ctx.lineWidth = thickness
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeRect(x, y, w, h)

      ctx.fillStyle = `${color}1f`
      ctx.fillRect(x, y, w, h)

      if (labels || confidence) {
        const labelParts = []
        if (labels) labelParts.push('person')
        if (confidence && det.confidence !== undefined) {
          labelParts.push(`${(det.confidence * 100).toFixed(1)}%`)
        }
        const label = labelParts.join('  ')

        ctx.font = `${size}px JetBrains Mono, monospace`
        const metrics = ctx.measureText(label)
        const textWidth = metrics.width
        const textHeight = size

        const labelX = x
        const labelY = Math.max(y - textHeight - 6, textHeight + 4)

        ctx.fillStyle = color
        ctx.fillRect(labelX - 4, labelY - 2, textWidth + 8, textHeight + 4)

        ctx.fillStyle = '#0B131F'
        ctx.fillText(label, labelX, labelY + textHeight - 2)
      }
    })
  }, [canvasRef])

  useEffect(() => {
    const loop = () => {
      draw()
      animationRef.current = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(animationRef.current)
  }, [draw])

  return { draw, resizeCanvas, transform: transformRef.current }
}
