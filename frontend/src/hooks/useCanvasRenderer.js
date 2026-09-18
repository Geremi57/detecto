import { useRef, useEffect, useCallback, useLayoutEffect } from 'react'

export function useCanvasRenderer(videoRef, canvasRef, detections, options = {}) {
  const {
    showBoxes = true,
    showLabels = true,
    showConfidence = true,
    showTrails = false,
    showFPS = false,
    showGrid = false,
    boxThickness = 2,
    fontSize = 12,
    trailLength = 30,
    trailOpacity = 0.6,
  } = options

  const animationRef = useRef(null)
  const trailHistoryRef = useRef(new Map())
  const lastFrameTimeRef = useRef(performance.now())
  const fpsRef = useRef(0)
  const frameCountRef = useRef(0)
  const canvasSizeRef = useRef({ width: 0, height: 0 })
  const videoSizeRef = useRef({ width: 0, height: 0 })
  const transformRef = useRef({ scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 })

  const resizeCanvas = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 1) return

    const dpr = window.devicePixelRatio || 1
    const container = canvas.parentElement
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    const displayWidth = containerRect.width
    const displayHeight = containerRect.height

    const videoAspect = video.videoWidth / video.videoHeight
    const containerAspect = displayWidth / displayHeight

    let drawWidth, drawHeight, offsetX, offsetY

    if (videoAspect > containerAspect) {
      drawWidth = displayWidth
      drawHeight = displayWidth / videoAspect
      offsetX = 0
      offsetY = (displayHeight - drawHeight) / 2
    } else {
      drawHeight = displayHeight
      drawWidth = displayHeight * videoAspect
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
    ctx.scale(dpr, dpr)

    canvasSizeRef.current = { width: drawWidth, height: drawHeight }
    videoSizeRef.current = { width: video.videoWidth, height: video.videoHeight }
    transformRef.current = {
      scaleX: drawWidth / video.videoWidth,
      scaleY: drawHeight / video.videoHeight,
      offsetX,
      offsetY,
    }
  }, [videoRef, canvasRef])

  useLayoutEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const handleResize = () => resizeCanvas()
    const handleVideoResize = () => resizeCanvas()

    video.addEventListener('loadedmetadata', handleVideoResize)
    video.addEventListener('resize', handleVideoResize)
    window.addEventListener('resize', handleResize)

    resizeCanvas()

    return () => {
      video.removeEventListener('loadedmetadata', handleVideoResize)
      video.removeEventListener('resize', handleVideoResize)
      window.removeEventListener('resize', handleResize)
    }
  }, [videoRef, canvasRef, resizeCanvas])

  const normalizeBBox = useCallback((bbox) => {
    const { scaleX, scaleY } = transformRef.current
    const [x, y, w, h] = bbox
    return [
      x * scaleX,
      y * scaleY,
      w * scaleX,
      h * scaleY,
    ]
  }, [])

  const drawGrid = useCallback((ctx, width, height) => {
    if (!showGrid) return
    const gridSize = 50
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.08)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let x = 0; x <= width; x += gridSize) {
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
    }
    ctx.stroke()
  }, [showGrid])

  const drawFPS = useCallback((ctx, width, height) => {
    if (!showFPS) return
    const now = performance.now()
    frameCountRef.current++
    if (now - lastFrameTimeRef.current >= 1000) {
      fpsRef.current = Math.round((frameCountRef.current * 1000) / (now - lastFrameTimeRef.current))
      frameCountRef.current = 0
      lastFrameTimeRef.current = now
    }

    ctx.fillStyle = '#00FF88'
    ctx.font = `${fontSize}px JetBrains Mono, monospace`
    ctx.textBaseline = 'top'
    ctx.fillText(`${fpsRef.current} FPS`, 10, 10)
  }, [showFPS, fontSize])

  const drawTrails = useCallback((ctx, detections) => {
    if (!showTrails) return
    const now = Date.now()
    const activeIds = new Set()

    detections.forEach(det => {
      if (!det.id) return
      activeIds.add(det.id)

      const history = trailHistoryRef.current.get(det.id) || []
      const [cx, cy] = [(det.bbox[0] + det.bbox[2] / 2), (det.bbox[1] + det.bbox[3] / 2)]
      const normalized = normalizeBBox([cx, cy, 0, 0])
      history.push({ x: normalized[0], y: normalized[1], time: now })

      const cutoff = now - trailLength * 100
      const filtered = history.filter(p => p.time > cutoff)
      trailHistoryRef.current.set(det.id, filtered)

      if (filtered.length > 1) {
        ctx.beginPath()
        ctx.moveTo(filtered[0].x, filtered[0].y)
        filtered.forEach((p, i) => {
          const alpha = (i / filtered.length) * trailOpacity
          ctx.strokeStyle = `rgba(0, 255, 136, ${alpha})`
          ctx.lineWidth = boxThickness * (0.5 + 0.5 * i / filtered.length)
          ctx.lineCap = 'round'
          if (i > 0) ctx.lineTo(p.x, p.y)
        })
        ctx.stroke()
      }
    })

    trailHistoryRef.current.forEach((_, id) => {
      if (!activeIds.has(id)) trailHistoryRef.current.delete(id)
    })
  }, [showTrails, trailLength, trailOpacity, boxThickness, normalizeBBox])

  const drawDetections = useCallback((ctx, detections) => {
    if (!showBoxes || !detections?.length) return

    detections.forEach(det => {
      const [x, y, w, h] = normalizeBBox(det.bbox)
      const color = det.color || '#00FF88'

      ctx.strokeStyle = color
      ctx.lineWidth = boxThickness
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeRect(x, y, w, h)

      ctx.fillStyle = `${color}33`
      ctx.fillRect(x, y, w, h)

      if (showLabels || showConfidence) {
        const labelParts = []
        if (showLabels && det.class) labelParts.push(det.class)
        if (showConfidence && det.confidence !== undefined) {
          labelParts.push(`${(det.confidence * 100).toFixed(1)}%`)
        }
        const label = labelParts.join('  ')

        ctx.font = `${fontSize}px JetBrains Mono, monospace`
        const metrics = ctx.measureText(label)
        const textWidth = metrics.width
        const textHeight = fontSize

        const labelX = x
        const labelY = Math.max(y - textHeight - 6, textHeight + 4)

        ctx.fillStyle = color
        ctx.fillRect(labelX - 4, labelY - 2, textWidth + 8, textHeight + 4)

        ctx.fillStyle = '#0B131F'
        ctx.fillText(label, labelX, labelY + textHeight - 2)
      }
    })
  }, [showBoxes, showLabels, showConfidence, boxThickness, fontSize, normalizeBBox])

  const draw = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return

    const ctx = canvas.getContext('2d')
    const { width, height } = canvasSizeRef.current

    ctx.clearRect(0, 0, width, height)

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      ctx.drawImage(video, 0, 0, width, height)
    }

    drawGrid(ctx, width, height)
    drawTrails(ctx, detections)
    drawDetections(ctx, detections)
    drawFPS(ctx, width, height)
  }, [videoRef, canvasRef, detections, drawGrid, drawTrails, drawDetections, drawFPS])

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