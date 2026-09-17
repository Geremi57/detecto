import { DetectionProvider, useDetection } from './context/DetectionContext'
import { NavigationBar } from './components/sidebar/NavigationBar'
import { StreamViewport } from './components/canvas/StreamViewport'
import { ControlOverlays } from './components/canvas/ControlOverlays'
import { MetricsDisplay } from './components/ui/MetricsDisplay'
import { LogTable } from './components/ui/LogTable'
import { SessionAreaChart } from './components/charts/SessionAreaChart'
import { PerformanceSpark } from './components/charts/PerformanceSpark'
import { useState, useCallback, useMemo } from 'react'
import { Wifi, WifiOff, Cpu, HardDrive, Activity } from 'lucide-react'

function Dashboard() {
  const { counts, metrics, logs } = useDetection()
  const [overlayOptions, setOverlayOptions] = useState({
    showBoxes: true,
    showLabels: true,
    showConfidence: true,
    showTrails: false,
    showFPS: true,
  })
  const [activeTab, setActiveTab] = useState('dashboard')
  const [videoSrc, setVideoSrc] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState(false)

  const handleOverlayChange = useCallback((key, value) => {
    setOverlayOptions(prev => ({ ...prev, [key]: value }))
  }, [])

  const latencyData = useMemo(() => metrics?.latencyHistory || [], [metrics?.latencyHistory])
  const fpsData = useMemo(() => metrics?.fpsHistory || [], [metrics?.fpsHistory])
  const memoryData = useMemo(() => metrics?.memoryHistory || [], [metrics?.memoryHistory])

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
            <span className={`status-dot ${connectionStatus ? 'status-dot--active' : 'status-dot--inactive'}`} />
            <span>{connectionStatus ? 'Connected' : 'Disconnected'}</span>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-detecto-bgCard border border-detecto-border rounded-lg text-detecto-textMuted font-mono text-xs">
            <Cpu className="w-3 h-3 text-detecto-accent" />
            <span id="cpu-usage">--%</span>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-detecto-bgCard border border-detecto-border rounded-lg text-detecto-textMuted font-mono text-xs">
            <HardDrive className="w-3 h-3 text-detecto-accent" />
            <span id="mem-usage">--%</span>
          </div>
        </div>
      </header>

      <NavigationBar activeTab={activeTab} onTabChange={setActiveTab} className="row-span-3 border-r border-detecto-border bg-detecto-bgSecondary/50" />

      <main className="row-span-2 p-6 space-y-6 overflow-auto min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 h-full">
          <div className="space-y-6 min-h-0">
            <div className="relative aspect-video bg-detecto-bgCard border border-detecto-border rounded-xl overflow-hidden">
              <StreamViewport
                src={videoSrc}
                detections={[]}
                overlayOptions={overlayOptions}
              />
              <ControlOverlays options={overlayOptions} onChange={handleOverlayChange} />
            </div>

            <div className="card overflow-hidden animate-slide-up">
              <div className="flex items-center justify-between p-4 border-b border-detecto-border">
                <h3 className="section-title">Session History</h3>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-detecto-accentDim text-detecto-accent text-xs rounded font-mono">
                    {logs?.length || 0} events
                  </span>
                </div>
              </div>
              <div className="p-4">
                <LogTable logs={logs} />
              </div>
            </div>
          </div>

          <div className="space-y-6 min-h-0">
            <div className="card animate-slide-up">
              <div className="p-4 border-b border-detecto-border">
                <h3 className="section-title">Live Metrics</h3>
              </div>
              <div className="p-4">
                <MetricsDisplay metrics={metrics} />
              </div>
            </div>

            <div className="card animate-slide-up">
              <div className="p-4 border-b border-detecto-border">
                <h3 className="section-title">Latency Trend</h3>
              </div>
              <div className="p-4 h-48">
                <SessionAreaChart data={latencyData} height={180} color="#00FF88" />
              </div>
            </div>

            <div className="card animate-slide-up">
              <div className="p-4 border-b border-detecto-border">
                <h3 className="section-title">Performance</h3>
              </div>
              <div className="p-4 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-detecto-textMuted">FPS</span>
                    <span className="text-xs font-mono text-detecto-accent">{metrics?.fps || 0}</span>
                  </div>
                  <PerformanceSpark data={fpsData} color="#00FF88" height={50} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-detecto-textMuted">Latency (ms)</span>
                    <span className="text-xs font-mono text-detecto-info">{metrics?.latency || 0}</span>
                  </div>
                  <PerformanceSpark data={latencyData} color="#00D4FF" height={50} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-detecto-textMuted">Memory (MB)</span>
                    <span className="text-xs font-mono text-detecto-warning">{metrics?.memory || 0}</span>
                  </div>
                  <PerformanceSpark data={memoryData} color="#FFB800" height={50} />
                </div>
              </div>
            </div>

            <div className="card animate-slide-up">
              <div className="p-4 border-b border-detecto-border">
                <h3 className="section-title">Detection Classes</h3>
              </div>
              <div className="p-4 space-y-3">
                {counts && Object.entries(counts).map(([className, count]) => (
                  <div key={className} className="flex items-center justify-between p-3 bg-detecto-bgSecondary/50 rounded-lg border border-detecto-border/50 hover:border-detecto-accent/30 transition-colors">
                    <span className="text-detecto-text capitalize">{className}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-detecto-bgSecondary rounded-full overflow-hidden">
                        <div className="h-full bg-detecto-accent rounded-full transition-all duration-300" style={{ width: `${Math.min(count * 10, 100)}%` }} />
                      </div>
                      <span className="font-mono text-detecto-accent text-sm">{count}</span>
                    </div>
                  </div>
                ))}
                {!counts || Object.keys(counts).length === 0 ? (
                  <div className="text-center py-8 text-detecto-textDim">
                    No detections yet
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </main>

      <aside className="row-span-2 border-l border-detecto-border bg-detecto-bgSecondary/50 p-6 space-y-6 overflow-auto min-h-0">
        <div className="card">
          <div className="p-4 border-b border-detecto-border">
            <h3 className="section-title">System Status</h3>
          </div>
          <div className="p-4 space-y-4" id="system-metrics">
            <div className="flex items-center justify-between p-3 bg-detecto-bgSecondary/50 rounded-lg border border-detecto-border/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-detecto-accentDim flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-detecto-accent" />
                </div>
                <span className="text-sm text-detecto-text">CPU Usage</span>
              </div>
              <span className="font-mono text-detecto-accent" id="cpu-value">--%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-detecto-bgSecondary/50 rounded-lg border border-detecto-border/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-detecto-info/20 flex items-center justify-center">
                  <HardDrive className="w-4 h-4 text-detecto-info" />
                </div>
                <span className="text-sm text-detecto-text">Memory</span>
              </div>
              <span className="font-mono text-detecto-info" id="mem-value">--%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-detecto-bgSecondary/50 rounded-lg border border-detecto-border/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-detecto-warning/20 flex items-center justify-center">
                  <Wifi className="w-4 h-4 text-detecto-warning" />
                </div>
                <span className="text-sm text-detecto-text">Network</span>
              </div>
              <span className="font-mono text-detecto-warning" id="net-value">-- Mbps</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-detecto-bgSecondary/50 rounded-lg border border-detecto-border/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-detecto-danger/20 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-detecto-danger" />
                </div>
                <span className="text-sm text-detecto-text">Inference Time</span>
              </div>
              <span className="font-mono text-detecto-danger" id="inference-value">-- ms</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-4 border-b border-detecto-border">
            <h3 className="section-title">Quick Actions</h3>
          </div>
          <div className="p-4 space-y-3">
            <button className="btn-secondary w-full justify-start gap-3" onClick={() => setVideoSrc(null)}>
              <WifiOff className="w-4 h-4" />
              Disconnect Stream
            </button>
            <button className="btn-ghost w-full justify-start gap-3">
              <Activity className="w-4 h-4" />
              Export Session Data
            </button>
            <button className="btn-ghost w-full justify-start gap-3">
              <HardDrive className="w-4 h-4" />
              Save Model Weights
            </button>
          </div>
        </div>

        <div className="card">
          <div className="p-4 border-b border-detecto-border">
            <h3 className="section-title">Model Info</h3>
          </div>
          <div className="p-4 space-y-3 text-sm">
            <div className="flex justify-between text-detecto-textMuted">
              <span>Architecture</span>
              <span className="text-detecto-text font-mono">YOLOv8n</span>
            </div>
            <div className="flex justify-between text-detecto-textMuted">
              <span>Input Size</span>
              <span className="text-detecto-text font-mono">640x640</span>
            </div>
            <div className="flex justify-between text-detecto-textMuted">
              <span>Classes</span>
              <span className="text-detecto-text font-mono">80 (COCO)</span>
            </div>
            <div className="flex justify-between text-detecto-textMuted">
              <span>Precision</span>
              <span className="text-detecto-text font-mono">FP16</span>
            </div>
            <div className="flex justify-between text-detecto-textMuted">
              <span>Device</span>
              <span className="text-detecto-text font-mono">CUDA:0</span>
            </div>
          </div>
        </div>
      </aside>

      <footer className="col-span-3 bg-detecto-bgSecondary/80 backdrop-blur-xl border-t border-detecto-border px-6 py-3 text-xs text-detecto-textDim flex items-center justify-between">
        <span>Detecto v0.1.0</span>
        <span className="font-mono">WS: ws://localhost:8080</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-detecto-accent animate-pulse" />
          <span>Live</span>
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