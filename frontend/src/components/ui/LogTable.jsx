export function LogTable({ logs }) {
  const classColors = {
    person: '#00FF88',
    car: '#00D4FF',
    truck: '#FFB800',
    bus: '#FF6B35',
    motorcycle: '#A855F7',
    bicycle: '#EC4899',
    default: '#00FF88',
  }

  const getClassColor = (className) => classColors[className.toLowerCase()] || classColors.default

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-mono">
        <thead>
          <tr className="border-b border-detecto-border">
            <th className="px-3 py-2.5 text-left text-xs text-detecto-textDim uppercase tracking-wider font-medium">Time</th>
            <th className="px-3 py-2.5 text-left text-xs text-detecto-textDim uppercase tracking-wider font-medium">Class</th>
            <th className="px-3 py-2.5 text-left text-xs text-detecto-textDim uppercase tracking-wider font-medium">Confidence</th>
            <th className="px-3 py-2.5 text-left text-xs text-detecto-textDim uppercase tracking-wider font-medium">BBox</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-detecto-border/50">
          {logs?.slice().reverse().map((log, i) => {
            const color = getClassColor(log.class)
            return (
              <tr key={i} className="hover:bg-detecto-accentDim/50 transition-colors animate-fade-in" style={{ animationDelay: `${i * 20}ms` }}>
                <td className="px-3 py-2.5 text-detecto-textDim text-xs">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: `${color}20`, color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                    {log.class}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-detecto-info/10 text-detecto-info">
                    {(log.confidence * 100).toFixed(1)}%
                  </span>
                </td>
                <td className="px-3 py-2.5 text-detecto-textDim text-xs">
                  [{log.bbox?.map(v => v.toFixed(1)).join(', ')}]
                </td>
              </tr>
            )
          })}
          {!logs?.length && (
            <tr>
              <td colSpan={4} className="px-3 py-8 text-center text-detecto-textDim">
                No detection events yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}