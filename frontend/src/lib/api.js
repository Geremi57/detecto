// Thin client for the FastAPI backend. All data comes from the real API — no mocks.
const API_BASE = '/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options)

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`
    try {
      const body = await response.json()
      if (body?.detail) detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)
    } catch {
      // non-JSON error body — keep the generic message
    }
    throw new Error(detail)
  }

  return response.json()
}

/**
 * Run person detection on an uploaded image.
 * The backend endpoint only accepts JPEG/PNG — use convertToUploadableImage()
 * (lib/mediaFormats.js) first for any other format.
 * Returns { filename, count, average_confidence, inference_time_ms, detections, timestamp, image_width, image_height, annotated_image }
 */
export async function detectImage(file, signal) {
  const form = new FormData()
  form.append('file', file, file.name || 'capture.jpg')

  return request('/detect', {
    method: 'POST',
    body: form,
    signal,
  })
}

/**
 * Fetch detection history records.
 * Returns [{ id, timestamp, count, average_confidence, inference_time_ms }]
 */
export async function getHistory({ limit = 50, offset = 0, start, end, signal } = {}) {
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  params.set('offset', String(offset))
  if (start) params.set('start', start)
  if (end) params.set('end', end)

  return request(`/history?${params.toString()}`, { signal })
}

/** Clear all stored detection records. */
export async function resetHistory(signal) {
  return request('/history/reset', { method: 'DELETE', signal })
}

/** Check API + database health. Returns { status, database } */
export async function getHealth(signal) {
  return request('/health', { signal })
}

/** Convert a Blob to a File suitable for the /detect upload endpoint. */
export async function blobToFile(blob, filename) {
  const ext = blob.type === 'image/png' ? 'png' : 'jpg'
  return new File([blob], filename || `capture.${ext}`, { type: blob.type || 'image/jpeg' })
}
