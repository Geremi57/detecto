import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export function PerformanceSpark({ data, height = 60, color = '#00FF88', metric = 'value', showTooltip = false, showCurrent = true }) {
  if (!data?.length) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-detecto-bgSecondary/50 rounded-lg border border-detecto-border/50">
        <span className="text-detecto-textDim text-xs">No data</span>
      </div>
    )
  }

  const gradientId = `spark-gradient-${color.replace('#', '')}`

  const chartData = useMemo(() => {
    return data.map((d, i) => ({
      index: i,
      time: d.time || Date.now() - (data.length - i) * 100,
      value: typeof d === 'number' ? d : d[metric] || d.value || 0,
    }))
  }, [data, metric])

  const minVal = useMemo(() => Math.min(...chartData.map(d => d.value)), [chartData])
  const maxVal = useMemo(() => Math.max(...chartData.map(d => d.value)), [chartData])
  const range = maxVal - minVal || 1
  const currentValue = chartData[chartData.length - 1]?.value || 0

  return (
    <div className="w-full h-full relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: showCurrent ? 25 : 5, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`${gradientId}-area`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.15} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E2D42" vertical={false} horizontal={true} />
          <XAxis
            dataKey="index"
            type="number"
            axisLine={false}
            tickLine={false}
            tick={false}
          />
          <YAxis
            dataKey="value"
            domain={[minVal - range * 0.1, maxVal + range * 0.1]}
            axisLine={false}
            tickLine={false}
            tick={false}
          />
          {showTooltip && (
            <Tooltip
              contentStyle={{
                backgroundColor: '#152033',
                border: '1px solid #1E2D42',
                borderRadius: '6px',
                boxShadow: '0 4px 20px rgba(0, 255, 136, 0.15)',
                padding: '4px 8px',
              }}
              label={false}
              formatter={(value) => [value.toFixed(2), metric]}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={false}
            activeDot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#0B131F' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="none"
            fill={`url(#${gradientId}-area)`}
            fillOpacity={1}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      {showCurrent && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 flex items-center gap-1 bg-detecto-bgCard/95 backdrop-blur-xl rounded-lg border border-detecto-border/50 px-2 py-1 shadow-lg">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
          <span className="text-xs font-mono text-detecto-text" style={{ color }}>{currentValue.toFixed(1)}</span>
        </div>
      )}
    </div>
  )
}