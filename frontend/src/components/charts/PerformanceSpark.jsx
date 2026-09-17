import { useRef, useEffect } from 'react'

export function PerformanceSpark({ data, width = 200, height = 60, color = '#00FF88' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data?.length) return

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    const maxVal = Math.max(...data, 1)
    const minVal = Math.min(...data, 0)
    const range = maxVal - minVal || 1
    const stepX = width / (data.length - 1 || 1)

    ctx.clearRect(0, 0, width, height)

    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    const hexToRgba = (hex, alpha) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    gradient.addColorStop(0, hexToRgba(color, 0.15))
    gradient.addColorStop(1, hexToRgba(color, 0))

    ctx.beginPath()
    ctx.moveTo(0, height)
    data.forEach((val, i) => {
      const x = i * stepX
      const y = height - ((val - minVal) / range) * height * 0.8
      if (i === 0) ctx.lineTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.lineTo(width, height)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.beginPath()
    data.forEach((val, i) => {
      const x = i * stepX
      const y = height - ((val - minVal) / range) * height * 0.8
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.shadowColor = color
    ctx.shadowBlur = 6
    ctx.stroke()
    ctx.shadowBlur = 0

    const lastVal = data[data.length - 1]
    const lastX = width
    const lastY = height - ((lastVal - minVal) / range) * height * 0.8
    ctx.beginPath()
    ctx.arc(lastX, lastY, 5, 0, Math.PI * 2)
    ctx.fillStyle = '#0B131F'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = 10
    ctx.fill()
    ctx.shadowBlur = 0
  }, [data, width, height, color])

  return <canvas ref={canvasRef} width={width} height={height} className="w-full h-full" />
}