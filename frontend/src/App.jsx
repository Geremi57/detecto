import { DetectionProvider } from './context/DetectionContext'
import { useDetectionLoop } from './hooks/useDetectionLoop'
import { NavigationBar } from './components/sidebar/NavigationBar'
import { StreamViewport } from './components/canvas/StreamViewport'
import { ControlOverlays } from './components/canvas/ControlOverlays'
import { SourcePanel } from './components/ui/SourcePanel'
import { MetricsDisplay } from './components/ui/MetricsDisplay'
import { HistoryTable } from './components/ui/HistoryTable'
import { SessionAreaChart } from './components/charts/SessionAreaChart'
import { PerformanceSpark } from './components/charts/PerformanceSpark'
import { getHistory, resetHistory, getHealth } from './lib/api'
import { useState, useCallback, useEffect, useRef } from 'react'
import { Activity, Cpu, HardDrive } from 'lucide-react'

const HISTORY_PAGE_SIZE = 50

const DEFAULT_OVERLAY_OPTIONS = {
  showBoxes: true,
  showLabels: true,
  showConfidence: true,
  boxThickness: 2,
  fontSize: 12,
}

function Dashboard() {
  const [source, setSource] = useState(null)
  const [overlayOptions, setOverlayOptions] = useState(DEFAULT_OVERLAY_OPTIONS)
  const [historyRecords, setHistoryRecords] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [apiOnline, setApiOnline] = useState(false)
  const [toast, setToast] = useState(null)
  const imagePendingRef = useRef(false) // auto-detect once per image selection
  const autoStartSourceRef = useRef(null) // auto-start once per video/stream selection

  const refreshHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const records = await getHistory({ limit: HISTORY_PAGE_SIZE })
      setHistoryRecords(records)
    } catch {
      setApiOnline(false)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  const {
    videoRef,
    running: detecting,
    error: detectionError,
    result,
    stats,
    start,
    stop,
    runOnceOnFile,
    resetStats,
  } = useDetectionLoop({ onHistoryChange: refreshHistory })

  const showToast = useCallback((msg) => setToast(msg), [])

  // --- API health + history -------------------------------------------------

  const handleResetHistory = useCallback(async () => {
    try {
      await resetHistory()
      await refreshHistory()
      setToast('Detection history cleared')
    } catch (err) {
      setToast(err.message || 'Failed to clear history')
    }
  }, [refreshHistory])

  useEffect(() => {
    let cancelled = false
    getHealth()
      .then(() => {
        if (!cancelled) setApiOnline(true)
      })
      .catch(() => {
        if (!cancelled) setApiOnline(false)
      })
    refreshHistory()
    return () => {
      cancelled = true
    }
  }, [refreshHistory])

  // --- source + detection flow ---------------------------------------------

  const handleSourceChange = useCallback(
    (next) => {
      stop()
      resetStats()
      setSource(next)
      imagePendingRef.current = Boolean(next)
      autoStartSourceRef.current = null
    },
    [stop, resetStats]
  )

  const handleOverlayChange = useCallback((key, value) => {
    setOverlayOptions((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Run detection once when an image is selected.
  useEffect(() => {
    if (source?.type === 'image' && source.file && imagePendingRef.current) {
      imagePendingRef.current = false
      runOnceOnFile(source.file)
    }
  }, [source, runOnceOnFile])

  // Start continuous detection once per video/stream selection.
  // A ref (not `detecting`) guards this so pressing Stop stays stopped.
  useEffect(() => {
    if (!source || source.type === 'image') return
    if (autoStartSourceRef.current === source) return
    autoStartSourceRef.current = source
    const t = setTimeout(() => start(), 800)
    return () => clearTimeout(t)
  }, [source, start])

  // Surface detection errors as a toast.
  useEffect(() => {
    if (detectionError) setToast(detectionError)
  }, [detectionError])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const handleDetectToggle = useCallback(() => {
    if (detecting) {
      stop()
    } else if (source) {
      start()
    }
  }, [detecting, source, start, stop])

  const countHistory = stats.history

  // --- layout ---------------------------------------------------------------

  return (
    <div className="min-h-screen bg-detecto-bg text-detecto-text grid grid-cols-[4rem_1fr_22rem] grid-rows-[auto_1fr_auto]">
      <header className="col-span-3 bg-detecto-bgSecondary/80 backdrop-blur-xl border-b border-detecto-border flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-detecto-accent flex items-center justify-center">
            <Activity className="w-5 h-5 text-detecto-bg" />
          </div>
          <h1 className="text-xl font-semibold text-detecto-text">Detecto</h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-detecto-textMuted">
            <span className={`status-dot ${apiOnline ? 'status-dot--active' : 'status-dot--inactive'}`} />
            <span>{apiOnline ? 'API Connected' : 'API Offline'}</span>
          </div>
        </div>
      </header>

      <NavigationBar activeTab="dashboard" onTabChange={() => {}} className="row-span-3 border-r border-detecto-border bg-detecto-bgSecondary/50" />

      <main className="row-span-2 p-6 space-y-6 overflow-auto min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 h-full">
          <div className="space-y-6 min-h-0">
            <div className="relative aspect-video bg-detecto-bgCard border border-detecto-border rounded-xl overflow-hidden">
              <StreamViewport
                source={source}
                detections={result?.detections || []}
                annotatedImageUrl={source?.type === 'image' ? result?.annotated_image : null}
                overlayOptions={overlayOptions}
                videoElRef={videoRef}
                detecting={detecting}
                onDetectToggle={handleDetectToggle}
                onError={showToast}
              />
              <ControlOverlays options={overlayOptions} onChange={handleOverlayChange} />
            </div>

            <div className="card overflow-hidden animate-slide-up">
              <div className="flex items-center justify-between p-4 border-b border-detecto-border">
                <h3 className="section-title mb-0">Session History</h3>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-detecto-accentDim text-detecto-accent text-xs rounded font-mono">
                    {historyRecords.length} records
                  </span>
                </div>
              </div>
              <HistoryTable
                records={historyRecords}
                loading={historyLoading}
                onRefresh={refreshHistory}
                onReset={handleResetHistory}
              />
            </div>
          </div>

          <div className="space-y-6 min-h-0">
            <div className="card animate-slide-up">
              <div className="p-4 border-b border-detecto-border">
                <h3 className="section-title mb-0">Input Source</h3>
              </div>
              <div className="p-4">
                <SourcePanel source={source} onSourceChange={handleSourceChange} onError={showToast} />
              </div>
            </div>

            <div className="card animate-slide-up">
              <div className="p-4 border-b border-detecto-border">
                <h3 className="section-title mb-0">Live Metrics</h3>
              </div>
              <div className="p-4">
                <MetricsDisplay stats={stats} />
              </div>
            </div>

            <div className="card animate-slide-up">
              <div className="p-4 border-b border-detecto-border">
                <h3 className="section-title mb-0">Person Count Trend</h3>
              </div>
              <div className="p-4 h-48">
                <SessionAreaChart data={countHistory} height={180} color="#00FF88" />
              </div>
            </div>

            <div className="card animate-slide-up">
              <div className="p-4 border-b border-detecto-border">
                <h3 className="section-title mb-0">Session Stats</h3>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-detecto-textMuted">People per Frame</span>
                    <span className="text-xs font-mono text-detecto-accent">{stats.personCount}</span>
                  </div>
                  <PerformanceSpark data={countHistory} color="#00FF88" height={50} />
                </div>
                <div className="flex items-center justify-between p-3 bg-detecto-bgSecondary/50 rounded-lg border border-detecto-border/50">
                  <span className="text-xs text-detecto-textMuted">Total Detections</span>
                  <span className="text-xs font-mono text-detecto-info">{stats.totalDetections}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-detecto-bgSecondary/50 rounded-lg border border-detecto-border/50">
                  <span className="text-xs text-detecto-textMuted">Frames Analyzed</span>
                  <span className="text-xs font-mono text-detecto-warning">{stats.framesProcessed}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <aside className="row-span-2 border-l border-detecto-border bg-detecto-bgSecondary/50 p-6 space-y-6 overflow-auto min-h-0">
        <div className="card">
          <div className="p-4 border-b border-detecto-border">
            <h3 className="section-title mb-0">System Status</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between p-3 bg-detecto-bgSecondary/50 rounded-lg border border-detecto-border/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-detecto-accentDim flex items-center justify-center">
                  <Activity className="w-4 h-4 text-detecto-accent" />
                </div>
                <span className="text-sm text-detecto-text">API Server</span>
              </div>
              <span className="font-mono text-detecto-accent">{apiOnline ? 'Online' : 'Offline'}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-detecto-bgSecondary/50 rounded-lg border border-detecto-border/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-detecto-info/20 flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-detecto-info" />
                </div>
                <span className="text-sm text-detecto-text">Source</span>
              </div>
              <span className="font-mono text-detecto-info">{source ? source.type : 'None'}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-detecto-bgSecondary/50 rounded-lg border border-detecto-border/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-detecto-warning/20 flex items-center justify-center">
                  <HardDrive className="w-4 h-4 text-detecto-warning" />
                </div>
                <span className="text-sm text-detecto-text">Frames Analyzed</span>
              </div>
              <span className="font-mono text-detecto-warning">{stats.framesProcessed}</span>
            </div>
          </div>
        </div>
      </aside>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-detecto-bgCard border border-detecto-danger/50 rounded-lg shadow-xl text-sm text-detecto-text animate-fade-in">
          {toast}
          <button onClick={() => setToast(null)} className="ml-3 text-detecto-textDim hover:text-detecto-text">×</button>
        </div>
      )}

      <footer className="col-span-3 bg-detecto-bgSecondary/80 backdrop-blur-xl border-t border-detecto-border px-6 py-3 text-xs text-detecto-textDim flex items-center justify-between">
        <span>Detecto v0.1.0</span>
        <span className="font-mono">HTTP API: /api</span>
        <span className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${apiOnline ? 'bg-detecto-accent animate-pulse' : 'bg-detecto-textDim'}`} />
          <span>{apiOnline ? 'Live' : 'Standby'}</span>
        </span>
      </footer>
    </div>
  )
}

function App() {
  return (
    <DetectionProvider>
      <Dashboard />
    </DetectionProvider>
  )
}

export default App
