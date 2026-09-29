import { useCallback, useEffect, useRef, useState } from 'react'
import { detectImage, blobToFile } from '../lib/api'
import { convertToUploadableImage } from '../lib/mediaFormats'

const DEFAULT_INTERVAL_MS = 500 // sample one frame per second
const MAX_DETECTION_WIDTH = 640



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

  const [detecting, setDetecting] = useState(false)
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

  
  const socketRef = useRef(null)
  const socketPendingRef = useRef(false)


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


  const connectDetectionSocket = () => {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket('ws://localhost:8000/detect/stream')

    socket.onopen = () => {
      socketRef.current = socket
      resolve(socket)
    }

    socket.onerror = () => {
      reject(new Error('Detection WebSocket connection failed'))
    }

    socket.onclose = () => {
      if (socketRef.current === socket) {
        socketRef.current = null
      }
    }
  })
}



const detectCurrentFrameViaSocket = async () => {
  if (socketPendingRef.current) return

  const video = videoRef.current
  const socket = socketRef.current
  const epoch = epochRef.current

  if (!video || video.readyState < 2 || !socket || socket.readyState !== WebSocket.OPEN) {
    return
  }

  socketPendingRef.current = true

  try {
    const canvas = document.createElement('canvas')

    const scale = Math.min(1, MAX_DETECTION_WIDTH / video.videoWidth)

    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)

    const context = canvas.getContext('2d')

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    )

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.8)
    })

    if (!blob) {
      return
    }

    const resultPromise = new Promise((resolve, reject) => {
      const handleMessage = (event) => {
        socket.removeEventListener('message', handleMessage)

        try {
          resolve(JSON.parse(event.data))
        } catch (error) {
          reject(error)
        }
      }

      socket.addEventListener('message', handleMessage, { once: true })
    })

    socket.send(blob)

    const result = await resultPromise

    if (result.error) {
      throw new Error(result.error)
    }

    applyResponse({
      ...result,
      filename: 'stream-frame.jpg',
      timestamp: new Date().toISOString(),
      annotated_image: null,
    },
  epoch)
  } catch (error) {
    console.error('WebSocket detection failed:', error)
  } finally {
    socketPendingRef.current = false
  }
}

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
      const captureStart = performance.now()


const scale = Math.min(1, MAX_DETECTION_WIDTH / video.videoWidth)

const canvas = document.createElement('canvas')
canvas.width = Math.round(video.videoWidth * scale)
canvas.height = Math.round(video.videoHeight * scale)

const ctx = canvas.getContext('2d')
ctx.drawImage(
  video,
  0,
  0,
  canvas.width,
  canvas.height
)

const drawTime = performance.now() - captureStart

const blobStart = performance.now()

const blob = await new Promise((resolve, reject) => {
  canvas.toBlob(
    (b) => (b ? resolve(b) : reject(new Error('Failed to capture frame'))),
    'image/jpeg',
    0.85
  )
})

const encodeTime = performance.now() - blobStart

console.log({
  videoResolution: `${video.videoWidth}x${video.videoHeight}`,
  drawTime: Math.round(drawTime),
  encodeTime: Math.round(encodeTime),
})

      const file = await blobToFile(blob, `frame-${Date.now()}.jpg`)
      const requestStart = performance.now()

const response = await detectImage(file, controller.signal)

console.log({
  detectionImage: `${response.image_width}x${response.image_height}`,
  firstDetection: response.detections?.[0],
})

const roundTripMs = performance.now() - requestStart

console.log({
  inferenceMs: response.inference_time_ms,
  roundTripMs: Math.round(roundTripMs),
})

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
      // The backend only accepts JPEG/PNG — convert other supported formats
      // (WebP, GIF, BMP, AVIF, ...) to JPEG client-side before uploading.
      const uploadable = await convertToUploadableImage(file)
      const response = await detectImage(uploadable, controller.signal)
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

 const start = useCallback(async () => {
  if (detecting) return

  setDetecting(true)

  console.log('START: setting detecting TRUE')
  setError(null)

  try {
    const socket = await connectDetectionSocket()

    if (!socketRef.current) {
      socket.close()
      setDetecting(false)
      return
    }

    await detectCurrentFrameViaSocket()

    timerRef.current = setInterval(
      detectCurrentFrameViaSocket,
      intervalMs
    )
  } catch (err) {
    console.error('Failed to start detection:', err)
    setError(err.message || 'Failed to start detection')
    setDetecting(false)
  }
}, [detecting, intervalMs])

 const stop = useCallback(() => {
  runningRef.current = false

  setDetecting(false)
  setRunning(false)

  if (timerRef.current) {
    clearInterval(timerRef.current)
    timerRef.current = null
  }

  // Close the detection WebSocket.
  if (socketRef.current) {
    socketRef.current.close()
    socketRef.current = null
  }

  socketPendingRef.current = false

  // Invalidate any in-flight request/response.
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

    if (socketRef.current) {
      socketRef.current.close()
      socketRef.current = null
    }

    socketPendingRef.current = false

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
    detecting,
    // detecting: active,
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
