import { User, Gauge, Timer, Layers } from 'lucide-react'

/**
 * Real stats computed from actual POST /detect responses in this session.
 * No mock values — each field comes from the backend's response data.
 */
export function MetricsDisplay({ stats }) {
  const metricItems = [
    {
      label: 'People in Frame',
      value: stats?.personCount ?? 0,
      icon: User,
      accent: 'text-detecto-accent',
    },
    {
      label: 'Avg Confidence',
      value: `${((stats?.avgConfidence || 0) * 100).toFixed(1)}%`,
      icon: Gauge,
      accent: 'text-detecto-info',
    },
    {
      label: 'Avg Inference',
      value: `${stats?.inferenceTimeMs || 0} ms`,
      icon: Timer,
      accent: 'text-detecto-warning',
    },
    {
      label: 'Frames Analyzed',
      value: stats?.framesProcessed ?? 0,
      icon: Layers,
      accent: 'text-detecto-text',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {metricItems.map(({ label, value, icon: Icon, accent }) => (
        <div key={label} className="metric-card card-hover group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-detecto-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 flex flex-col items-center">
            <Icon className={`w-5 h-5 mb-2 ${accent}`} />
            <p className="metric-value">{value}</p>
            <p className="metric-label">{label}</p>
          </div>
  </div>
      ))}
    </div>
  )
}
