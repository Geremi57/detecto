import { useCallback, useEffect, useRef, useState } from 'react'
import { detectImage, blobToFile } from '../lib/api'

const DEFAULT_INTERVAL_MS = 1000 // sample one frame per second

/**
 * Runs person detection against the real POST /detect endpoint.
 *
 * For video files and live webcam streams the video element is sampled at a
 * fixed interval, each sample is uploaded as a JPEG frame, and the backend's
 * response (count / confidence / boxes / annotated image) is returned to the
 * caller. For single images, `runOnce` can be triggered directly.
 *
 * All data comes from the real API — no mock or hardcoded values.
 */
export function useDetectionLoop({ intervalMs = DEFAULT_INTERVAL_MS, onHistoryChange } = {}) {
  const [active, setActive] = useState(false)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [stats, setStats] = useState({
    totalDetections: 0,
    framesProcessed: 0,
    personCount: 0,
    avgConfidence: 0,
    inferenceTimeMs: 0,
    history: [], // { time, value } person counts for the session chart
  })

  const videoRef = useRef(null)
  const timerRef = useRef(null)
  const inFlightRef = useRef(false)
  const runningRef = useRef(false)
  // Epoch token: bumped on stop()/resetStats() so any in-flight response
  // is discarded instead of repainting stale boxes onto the new source.
  const epochRef = useRef(0)
  const abortRef = useRef(null)
  // Which epoch the currently in-flight request belongs to, so a stale
  // (aborted) request can never block a new one from starting.
  const inFlightEpochRef = useRef(null)
  const historyRef = useRef([])
  const framesRef = useRef(0)
  const totalRef = useRef(0)
  const confidenceSumRef = useRef(0)
  const inferenceSumRef = useRef(0)
  const onHistoryChangeRef = useRef(onHistoryChange)
  onHistoryChangeRef.current = onHistoryChange

  const applyResponse = useCallback((response, epoch) => {
    if (epoch !== epochRef.current) return // stale: stopped or source switched

    framesRef.current += 1
    totalRef.current += response.count
    confidenceSumRef.current += response.average_confidence
    inferenceSumRef.current += response.inference_time_ms

    historyRef.current = [
      ...historyRef.current,
      { time: Date.now(), value: response.count },
    ].slice(-120)

    setResult(response)
    setStats({
      totalDetections: totalRef.current,
      framesProcessed: framesRef.current,
      personCount: response.count,
      avgConfidence: response.average_confidence,
      inferenceTimeMs: Math.round(
        inferenceSumRef.current / Math.max(framesRef.current, 1)
      ),
      history: historyRef.current,
    })
    setError(null)
    onHistoryChangeRef.current?.()
  }, [])

  const detectCurrentFrame = useCallback(async () => {
    const video = videoRef.current
    if (!video) return
    if (video.readyState < 2 || video.videoWidth === 0) return

    const epoch = epochRef.current
    // Only skip if a request for the *current* epoch is in flight; stale ones
    // were aborted on stop()/resetStats() and will be discarded by the guard.
    if (inFlightRef.current && inFlightEpochRef.current === epoch) return

    const controller = new AbortController()
    abortRef.current = controller
    inFlightEpochRef.current = epoch
    inFlightRef.current = true
    setRunning(true)

    try {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to capture frame'))), 'image/jpeg', 0.85)
      })

      const file = await blobToFile(blob, `frame-${Date.now()}.jpg`)
      const response = await detectImage(file, controller.signal)
      applyResponse(response, epoch)
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Detection request failed')
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null
      // Only clear the flag if no newer request has taken ownership.
      if (inFlightEpochRef.current === epoch) {
        inFlightRef.current = false
        if (epoch === epochRef.current) {
          setRunning(runningRef.current)
        }
      }
    }
  }, [applyResponse])

  /** Run detection once against an uploaded image file. */
  const detectImageFile = useCallback(async (file) => {
    if (!file) return

    const epoch = epochRef.current
    if (inFlightRef.current && inFlightEpochRef.current === epoch) return

    const controller = new AbortController()
    abortRef.current = controller
    inFlightEpochRef.current = epoch
    inFlightRef.current = true
    setRunning(true)

    try {
      const response = await detectImage(file, controller.signal)
      applyResponse(response, epoch)
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Detection request failed')
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null
      // Only clear the flag if no newer request has taken ownership.
      if (inFlightEpochRef.current === epoch) {
        inFlightRef.current = false
        if (epoch === epochRef.current) {
          setRunning(runningRef.current)
        }
      }
    }
  }, [applyResponse])

  const start = useCallback(() => {
    if (runningRef.current) return
    runningRef.current = true
    setActive(true)
    setRunning(true)
    timerRef.current = setInterval(detectCurrentFrame, intervalMs)
    detectCurrentFrame()
  }, [detectCurrentFrame, intervalMs])

  const stop = useCallback(() => {
    runningRef.current = false
    setActive(false)
    setRunning(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    // Invalidate any in-flight request and clear the bounding boxes so a
    // stopped session can't keep painting stale detections on the video.
    epochRef.current += 1
    abortRef.current?.abort()
    abortRef.current = null
    setResult(null)
  }, [])

  const resetStats = useCallback(() => {
    // Discard any in-flight response so it can't pollute the fresh session.
    epochRef.current += 1
    abortRef.current?.abort()
    abortRef.current = null

    framesRef.current = 0
    totalRef.current = 0
    confidenceSumRef.current = 0
    inferenceSumRef.current = 0
    historyRef.current = []
    setResult(null)
    setStats({
      totalDetections: 0,
      framesProcessed: 0,
      personCount: 0,
      avgConfidence: 0,
      inferenceTimeMs: 0,
      history: [],
    })
  }, [])

  // Stop the loop whenever the hook unmounts or the interval changes.
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      runningRef.current = false
      inFlightRef.current = false
      epochRef.current += 1
      abortRef.current?.abort()
      abortRef.current = null
    }
  }, [])

  useEffect(() => {
    if (runningRef.current && timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = setInterval(detectCurrentFrame, intervalMs)
    }
  }, [intervalMs, detectCurrentFrame])

  return {
    videoRef,
    active,
    running,
    error,
    result,
    stats,
    start,
    stop,
    resetStats,
    runOnce: detectCurrentFrame,
    runOnceOnFile: detectImageFile,
  }
}
