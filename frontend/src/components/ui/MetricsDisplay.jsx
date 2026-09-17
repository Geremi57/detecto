export function MetricsDisplay({ metrics }) {
  const metricItems = [
    { label: 'Total Detections', value: metrics?.total || 0, icon: '🎯', trend: metrics?.totalTrend },
    { label: 'Avg Confidence', value: `${(metrics?.avgConfidence * 100).toFixed(1)}%`, icon: '📊', trend: metrics?.confidenceTrend },
    { label: 'FPS', value: metrics?.fps || 0, icon: '⚡', trend: metrics?.fpsTrend },
    { label: 'Latency', value: `${metrics?.latency || 0}ms`, icon: '⏱️', trend: metrics?.latencyTrend },
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {metricItems.map((item, i) => (
        <div key={i} className="metric-card card-hover group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-detecto-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-2xl mb-2">{item.icon}</span>
            <p className="metric-value">{item.value}</p>
            <p className="metric-label">{item.label}</p>
            {item.trend !== undefined && (
              <span className={`text-xs font-mono mt-1 ${item.trend >= 0 ? 'text-detecto-accent' : 'text-detecto-danger'}`}>
                {item.trend >= 0 ? '▲' : '▼'} {Math.abs(item.trend).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}