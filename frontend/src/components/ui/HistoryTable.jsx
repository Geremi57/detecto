import { useMemo, useState } from 'react'
import { ChevronUp, ChevronDown, Download, RefreshCw, Trash2 } from 'lucide-react'

/**
 * Session history from the backend's GET /history endpoint.
 * Each record: { id, timestamp, count, average_confidence, inference_time_ms }
 * Person-focused — there are no detection classes in this project.
 */
export function HistoryTable({ records, loading, onRefresh, onReset, className = '' }) {
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' })
  const [minConfidence, setMinConfidence] = useState(0)

  const sortedRecords = useMemo(() => {
    if (!records?.length) return []
    let rows = [...records]

    if (minConfidence > 0) {
      rows = rows.filter((r) => (r.average_confidence || 0) >= minConfidence)
    }

    rows.sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return rows
  }, [records, sortConfig, minConfidence])

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const exportData = () => {
    const csv = [
      ['Timestamp', 'Person Count', 'Avg Confidence', 'Inference Time (ms)'],
      ...sortedRecords.map((r) => [
        new Date(r.timestamp).toISOString(),
        r.count,
        (r.average_confidence * 100).toFixed(2) + '%',
        r.inference_time_ms?.toFixed?.(1) ?? r.inference_time_ms,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `person-detection-history-${new Date().toISOString().slice(0, 19)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns = [
    { key: 'timestamp', label: 'Timestamp' },
    { key: 'count', label: 'People' },
    { key: 'average_confidence', label: 'Avg Confidence' },
    { key: 'inference_time_ms', label: 'Inference (ms)' },
  ]

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return null
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="p-3 border-b border-detecto-border flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <select
            value={minConfidence}
            onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
            className="input-field text-xs max-w-[160px]"
            aria-label="Filter by minimum confidence"
          >
            <option value={0}>All Confidence</option>
            <option value={0.25}>Min Confidence: 25%</option>
            <option value={0.5}>Min Confidence: 50%</option>
            <option value={0.75}>Min Confidence: 75%</option>
            <option value={0.9}>Min Confidence: 90%</option>
          </select>
          {loading && (
            <span className="text-xs text-detecto-textDim flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Loading…
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onRefresh} className="btn-ghost text-xs flex items-center gap-1" title="Refresh history">
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
          <button onClick={onReset} className="btn-ghost text-xs flex items-center gap-1 text-detecto-danger hover:text-detecto-danger" title="Clear all history">
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
          <button onClick={exportData} className="btn-ghost text-xs flex items-center gap-1" title="Export CSV">
            <Download className="w-3 h-3" />
            Export
          </button>
          <span className="text-xs text-detecto-textDim font-mono">{sortedRecords.length} records</span>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-96">
        <table className="w-full text-sm font-mono">
          <thead className="sticky top-0 bg-detecto-bgSecondary/95 backdrop-blur-sm z-10">
            <tr className="border-b border-detecto-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-3 py-2 text-left text-xs text-detecto-textDim uppercase tracking-wider font-medium cursor-pointer hover:text-detecto-accent transition-colors select-none"
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <SortIcon column={col.key} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-detecto-border/50">
            {sortedRecords.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-detecto-textDim">
                  {loading ? 'Loading history…' : 'No detection records yet'}
                </td>
              </tr>
            ) : (
              sortedRecords.map((record) => (
                <tr key={record.id} className="hover:bg-detecto-accentDim/30 transition-colors">
                  <td className="px-3 py-2.5 text-detecto-textDim text-xs whitespace-nowrap">
                    {formatTime(record.timestamp)}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-detecto-accent/10 text-detecto-accent">
                      <span className="w-1.5 h-1.5 rounded-full bg-detecto-accent" />
                      {record.count}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-detecto-info/10 text-detecto-info">
                      {((record.average_confidence || 0) * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-detecto-textDim text-xs">
                    {record.inference_time_ms?.toFixed?.(1) ?? record.inference_time_ms} ms
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
