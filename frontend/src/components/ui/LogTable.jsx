import { useMemo, useState } from 'react'
import { ChevronUp, ChevronDown, Search, Filter, Download } from 'lucide-react'

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

export function LogTable({ logs, maxRows = 100, onRowClick }) {
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' })
  const [filter, setFilter] = useState({ class: '', minConfidence: 0, search: '' })
  const [expandedRow, setExpandedRow] = useState(null)

  const processedLogs = useMemo(() => {
    if (!logs?.length) return []

    let filtered = [...logs].slice(-maxRows)

    if (filter.class) {
      filtered = filtered.filter(log => log.class?.toLowerCase().includes(filter.class.toLowerCase()))
    }
    if (filter.minConfidence > 0) {
      filtered = filtered.filter(log => (log.confidence || 0) >= filter.minConfidence)
    }
    if (filter.search) {
      const search = filter.search.toLowerCase()
      filtered = filtered.filter(log =>
        log.class?.toLowerCase().includes(search) ||
        JSON.stringify(log.bbox).includes(search)
      )
    }

    filtered.sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [logs, maxRows, sortConfig, filter])

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const exportData = () => {
    const csv = [
      ['Timestamp', 'Class', 'Confidence', 'BBox (x,y,w,h)'],
      ...processedLogs.map(log => [
        new Date(log.timestamp).toISOString(),
        log.class,
        (log.confidence * 100).toFixed(2) + '%',
        log.bbox?.map(v => v.toFixed(4)).join(',') || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `detection-log-${new Date().toISOString().slice(0, 19)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return null
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
  }

  return (
    <div className="flex flex-col h-full bg-detecto-bgCard border border-detecto-border rounded-xl overflow-hidden">
      <div className="p-3 border-b border-detecto-border flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-detecto-textDim" />
            <input
              type="text"
              placeholder="Search class, bbox..."
              value={filter.search}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              className="input-field pl-8 text-xs"
            />
          </div>
          <select
            value={filter.class}
            onChange={(e) => setFilter(prev => ({ ...prev, class: e.target.value }))}
            className="input-field text-xs max-w-[140px]"
          >
            <option value="">All Classes</option>
            {['person', 'car', 'truck', 'bus', 'motorcycle', 'bicycle'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filter.minConfidence}
            onChange={(e) => setFilter(prev => ({ ...prev, minConfidence: parseFloat(e.target.value) }))}
            className="input-field text-xs max-w-[140px]"
          >
            <option value={0}>Min Confidence: 0%</option>
            <option value={0.25}>Min Confidence: 25%</option>
            <option value={0.5}>Min Confidence: 50%</option>
            <option value={0.75}>Min Confidence: 75%</option>
            <option value={0.9}>Min Confidence: 90%</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportData} className="btn-ghost text-xs flex items-center gap-1" title="Export CSV">
            <Download className="w-3 h-3" />
            Export
          </button>
          <span className="text-xs text-detecto-textDim font-mono">
            {processedLogs.length} / {logs?.length || 0}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto flex-1">
        <table className="w-full text-sm font-mono">
          <thead className="sticky top-0 bg-detecto-bgSecondary/80 backdrop-blur-sm z-10">
            <tr className="border-b border-detecto-border">
              {[
                { key: 'timestamp', label: 'Timestamp' },
                { key: 'class', label: 'Class' },
                { key: 'confidence', label: 'Confidence' },
                { key: 'bbox', label: 'BBox [x,y,w,h]' },
              ].map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-3 py-2 text-left text-xs text-detecto-textDim uppercase tracking-wider font-medium cursor-pointer hover:text-detecto-accent transition-colors select-none flex items-center gap-1"
                >
                  {col.label}
                  <SortIcon column={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-detecto-border/50">
            {processedLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-detecto-textDim">
                  No detection events matching filters
                </td>
              </tr>
            ) : (
              processedLogs.map((log, i) => {
                const color = getClassColor(log.class)
                const isExpanded = expandedRow === i
                return (
                  <>
                    <tr
                      key={i}
                      onClick={() => { onRowClick?.(log); setExpandedRow(prev => prev === i ? null : i) }}
                      className={`hover:bg-detecto-accentDim/30 transition-colors cursor-pointer ${isExpanded ? 'bg-detecto-accentDim/20' : ''}`}
                    >
                      <td className="px-3 py-2.5 text-detecto-textDim text-xs whitespace-nowrap">
                        {formatTime(log.timestamp)}
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
                      <td className="px-3 py-2.5 text-detecto-textDim text-xs font-mono">
                        [{log.bbox?.map(v => v.toFixed(3)).join(', ')}]
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-detecto-bgSecondary/50">
                        <td colSpan={4} className="p-4">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <p className="text-detecto-textDim">Full Timestamp</p>
                              <p className="font-mono text-detecto-text">{new Date(log.timestamp).toISOString()}</p>
                            </div>
                            <div>
                              <p className="text-detecto-textDim">Date</p>
                              <p className="font-mono text-detecto-text">{formatDate(log.timestamp)}</p>
                            </div>
                            <div>
                              <p className="text-detecto-textDim">Confidence</p>
                              <p className="font-mono text-detecto-info">{(log.confidence * 100).toFixed(2)}%</p>
                            </div>
                            <div>
                              <p className="text-detecto-textDim">BBox (normalized)</p>
                              <p className="font-mono text-detecto-text">[{log.bbox?.map(v => v.toFixed(4)).join(', ')}]</p>
                            </div>
                            {log.inferenceTime && (
                              <div>
                                <p className="text-detecto-textDim">Inference Time</p>
                                <p className="font-mono text-detecto-warning">{log.inferenceTime.toFixed(1)} ms</p>
                              </div>
                            )}
                            {log.trackId && (
                              <div>
                                <p className="text-detecto-textDim">Track ID</p>
                                <p className="font-mono text-detecto-text">{log.trackId}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}