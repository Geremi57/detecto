import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'

const DetectionContext = createContext(null)

export function DetectionProvider({ children }) {
  const [counts, setCounts] = useState({})
  const [logs, setLogs] = useState([])
  const [metrics, setMetrics] = useState({
    total: 0,
    avgConfidence: 0,
    fps: 0,
    latency: 0,
    memory: 0,
    totalTrend: 0,
    confidenceTrend: 0,
    fpsTrend: 0,
    latencyTrend: 0,
    latencyHistory: [],
    fpsHistory: [],
    memoryHistory: [],
  })

  const updateCounts = useCallback((newCounts) => {
    setCounts(newCounts)
  }, [])

  const addLog = useCallback((log) => {
    setLogs(prev => [...prev.slice(-999), log])
  }, [])

  const updateMetrics = useCallback((newMetrics) => {
    setMetrics(prev => ({
      ...prev,
      ...newMetrics,
      latencyHistory: newMetrics.latencyHistory ? [...prev.latencyHistory.slice(-59), ...newMetrics.latencyHistory] : prev.latencyHistory,
      fpsHistory: newMetrics.fpsHistory ? [...prev.fpsHistory.slice(-59), ...newMetrics.fpsHistory] : prev.fpsHistory,
      memoryHistory: newMetrics.memoryHistory ? [...prev.memoryHistory.slice(-59), ...newMetrics.memoryHistory] : prev.memoryHistory,
    }))
  }, [])

  const reset = useCallback(() => {
    setCounts({})
    setLogs([])
    setMetrics({
      total: 0,
      avgConfidence: 0,
      fps: 0,
      latency: 0,
      memory: 0,
      totalTrend: 0,
      confidenceTrend: 0,
      fpsTrend: 0,
      latencyTrend: 0,
      latencyHistory: [],
      fpsHistory: [],
      memoryHistory: [],
    })
  }, [])

  const value = {
    counts,
    logs,
    metrics,
    updateCounts,
    addLog,
    updateMetrics,
    reset,
  }

  return (
    <DetectionContext.Provider value={value}>
      {children}
    </DetectionContext.Provider>
  )
}

export function useDetection() {
  const context = useContext(DetectionContext)
  if (!context) {
    throw new Error('useDetection must be used within a DetectionProvider')
  }
  return context
}