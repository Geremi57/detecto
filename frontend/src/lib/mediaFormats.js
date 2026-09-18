/**
 * Shared media format definitions and validators.
 *
 * The backend only accepts JPEG and PNG uploads (see backend/app/routes/detect.py
 * ALLOWED_CONTENT_TYPES), so the frontend accepts any browser-decodable image
 * format and converts non-JPEG/PNG images to JPEG before upload. Video formats
 * are validated by MIME type OR file extension — some common containers (e.g.
 * .mkv) report an empty MIME type in browsers.
 */

/** Extensions decodable by <img> in modern browsers. */
export const IMAGE_EXTENSIONS = [
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'avif', 'svg',
]

/** Extensions playable by <video> in common browsers (codec support varies). */
export const VIDEO_EXTENSIONS = [
  'mp4', 'webm', 'mov', 'm4v', 'mkv', 'avi', 'ogv',
]

/** File-picker accept string for images. */
export const IMAGE_ACCEPT = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/avif',
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.avif',
].join(',')

/** File-picker accept string for videos. */
export const VIDEO_ACCEPT = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
  'video/x-msvideo',
  'video/ogg',
  '.mp4', '.m4v', '.webm', '.mov', '.mkv', '.avi', '.ogv',
].join(',')

export function getExtension(name) {
  const match = /\.([a-z0-9]+)$/i.exec(name || '')
  return match ? match[1].toLowerCase() : ''
}

export function isImageFile(file) {
  if (file.type?.startsWith('image/')) return true
  return IMAGE_EXTENSIONS.includes(getExtension(file.name))
}

export function isVideoFile(file) {
  if (file.type?.startsWith('video/')) return true
  return VIDEO_EXTENSIONS.includes(getExtension(file.name))
}

/**
 * True if the backend accepts this file as-is (JPEG or PNG only).
 */
export function isDirectlyUploadable(file) {
  if (file.type === 'image/jpeg' || file.type === 'image/png') return true
  const ext = getExtension(file.name)
  return ext === 'jpg' || ext === 'jpeg' || ext === 'png'
}

/**
 * Convert any browser-decodable image to a JPEG File so the backend's
 * JPEG/PNG-only endpoint accepts it. Animated images (GIF/WebP) are
 * flattened to their first frame.
 */
export async function convertToUploadableImage(file) {
  if (isDirectlyUploadable(file)) return file

  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Unsupported image format'))
      el.src = url
    })

    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    // Flatten transparency onto black — JPEG has no alpha channel.
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Image conversion failed'))),
        'image/jpeg',
        0.95,
      )
    })

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image'
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
  } finally {
    URL.revokeObjectURL(url)
  }
}
