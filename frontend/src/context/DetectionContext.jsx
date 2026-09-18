import { createContext, useContext, useState, useCallback, useMemo } from 'react'

const DetectionContext = createContext(null)

/**
 * Holds only real, live state for the current session:
 * - the active media source (image / video / webcam stream)
 * - the latest detection result from POST /detect
 * - connection + processing status
 * No mock data, no fake FPS counters, no WebSocket feed (the backend API is HTTP-based).
 */
export function DetectionProvider({ children }) {
  const [source, setSource] = useState(null) // { type: 'image'|'video'|'stream', ... }
  const [result, setResult] = useState(null) // latest POST /detect response
  const [apiStatus, setApiStatus] = useState('disconnected') // disconnected | connected

  const updateResult = useCallback((r) => setResult(r), [])
  const setConnection = useCallback((status) => setApiStatus(status), [])

  const value = useMemo(() => ({
    source,
    setSource,
    result,
    updateResult,
    apiStatus,
    setConnection,
  }), [source, result, apiStatus, updateResult, setConnection])

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

export function useSource() {
  const { source, setSource } = useDetection()
  return { source, setSource }
}

export function useConnectionStatus() {
  const { apiStatus, setConnection } = useDetection()
  return { apiStatus, setConnection }
}
