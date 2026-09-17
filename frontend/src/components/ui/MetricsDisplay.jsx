export function MetricsDisplay({ metrics }) {
  return (
    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg">
      <div className="text-center">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Total Detections</p>
        <p className="text-3xl font-mono text-green-400">{metrics?.total || 0}</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Avg Confidence</p>
        <p className="text-3xl font-mono text-blue-400">{(metrics?.avgConfidence * 100).toFixed(1)}%</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-gray-400 uppercase tracking-wide">FPS</p>
        <p className="text-3xl font-mono text-yellow-400">{metrics?.fps || 0}</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Latency</p>
        <p className="text-3xl font-mono text-purple-400">{metrics?.latency || 0}ms</p>
      </div>
    </div>
  )
}