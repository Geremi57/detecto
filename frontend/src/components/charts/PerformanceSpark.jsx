import { useRef, useEffect } from 'react'

export function PerformanceSpark({ data, width = 200, height = 60, color = '#22c55e' }) {
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

    ctx.beginPath()
    data.forEach((val, i) => {
      const x = i * stepX
      const y = height - ((val - minVal) / range) * height * 0.8
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()

    const lastVal = data[data.length - 1]
    const lastX = width
    const lastY = height - ((lastVal - minVal) / range) * height * 0.8
    ctx.beginPath()
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
  }, [data, width, height, color])

  return <canvas ref={canvasRef} width={width} height={height} className="w-full h-full" />
}