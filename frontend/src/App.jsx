import { DetectionProvider } from './context/DetectionContext'
import { NavigationBar } from './components/sidebar/NavigationBar'
import { StreamViewport } from './components/canvas/StreamViewport'
import { ControlOverlays } from './components/canvas/ControlOverlays'
import { MetricsDisplay } from './components/ui/MetricsDisplay'
import { LogTable } from './components/ui/LogTable'
import { SessionAreaChart } from './components/charts/SessionAreaChart'
import { PerformanceSpark } from './components/charts/PerformanceSpark'
import { useState, useCallback } from 'react'

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

  const handleOverlayChange = useCallback((key, value) => {
    setOverlayOptions(prev => ({ ...prev, [key]: value }))
  }, [])

  return (
    <div className="h-screen bg-gray-950 text-gray-100 grid grid-cols-[16rem_1fr] grid-rows-[4rem_1fr_auto]">
      <header className="col-span-2 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
        <h1 className="text-xl font-semibold text-white">Detecto</h1>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span className={`w-2 h-2 rounded-full ${videoSrc ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{videoSrc ? 'Connected' : 'Disconnected'}</span>
        </div>
      </header>

      <NavigationBar activeTab={activeTab} onTabChange={setActiveTab} className="row-span-2 border-r border-gray-800" />

      <main className="p-6 space-y-6 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <StreamViewport
                src={videoSrc}
                detections={[]}
                overlayOptions={overlayOptions}
              />
              <ControlOverlays options={overlayOptions} onChange={handleOverlayChange} />
            </div>
            <LogTable logs={logs} />
          </div>

          <div className="space-y-4">
            <MetricsDisplay metrics={metrics} />
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Session Trend</h3>
              <SessionAreaChart data={[]} height={200} />
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Performance</h3>
              <div className="space-y-4">
                <PerformanceSpark data={[]} color="#22c55e" />
                <PerformanceSpark data={[]} color="#3b82f6" />
                <PerformanceSpark data={[]} color="#f59e0b" />
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="col-span-2 bg-gray-900 border-t border-gray-800 px-6 py-3 text-xs text-gray-500 flex items-center justify-between">
        <span>Detecto v0.1.0</span>
        <span className="font-mono">WS: ws://localhost:8080</span>
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