import { useRef, useEffect } from 'react'

export function SessionAreaChart({ data, width = 400, height = 150 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data?.length) return

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    const maxVal = Math.max(...data.map(d => d.value), 1)
    const stepX = width / (data.length - 1 || 1)

    ctx.clearRect(0, 0, width, height)

    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, 'rgba(34, 197, 94, 0.4)')
    gradient.addColorStop(1, 'rgba(34, 197, 94, 0)')

    ctx.beginPath()
    ctx.moveTo(0, height)
    data.forEach((d, i) => {
      const x = i * stepX
      const y = height - (d.value / maxVal) * height * 0.8
      if (i === 0) ctx.lineTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.lineTo(width, height)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.beginPath()
    data.forEach((d, i) => {
      const x = i * stepX
      const y = height - (d.value / maxVal) * height * 0.8
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.strokeStyle = '#22c55e'
    ctx.lineWidth = 2
    ctx.stroke()
  }, [data, width, height])

  return <canvas ref={canvasRef} width={width} height={height} className="w-full h-full" />
}