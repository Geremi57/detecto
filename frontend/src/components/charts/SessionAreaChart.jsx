import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export function SessionAreaChart({ data, height = 200, color = '#00FF88', showTooltip = true }) {
  if (!data?.length) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-detecto-bgSecondary/50 rounded-lg border border-detecto-border/50">
        <span className="text-detecto-textDim text-sm">No session data</span>
      </div>
    )
  }

  const gradientId = `gradient-${color.replace('#', '')}`

  return (
    <div className="w-full h-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1E2D42"
            vertical={false}
            horizontal={true}
          />
          <XAxis
            dataKey="time"
            type="number"
            tickFormatter={(value) => {
              const date = new Date(value)
              return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }}
            tick={{ fill: '#6B7C93', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
            axisLine={{ stroke: '#1E2D42' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#6B7C93', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => value.toFixed(0)}
            width={40}
          />
          {showTooltip && (
            <Tooltip
              contentStyle={{
                backgroundColor: '#152033',
                border: '1px solid #1E2D42',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0, 255, 136, 0.15)',
              }}
              labelStyle={{ color: '#E8EEF4', fontFamily: 'JetBrains Mono, monospace' }}
              formatter={(value, name) => [value.toFixed(1), name]}
              labelFormatter={(value) => new Date(value).toLocaleTimeString()}
            />
          )}
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 6, fill: color, strokeWidth: 2, stroke: '#0B131F' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}