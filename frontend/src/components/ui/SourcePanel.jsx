import { useRef, useState, useCallback } from 'react'
import { Image as ImageIcon, Film, Radio, Upload, X } from 'lucide-react'

const SOURCE_TYPES = [
  { type: 'image', label: 'Image', icon: ImageIcon, accept: 'image/jpeg,image/png' },
  { type: 'video', label: 'Video', icon: Film, accept: 'video/mp4,video/webm,video/quicktime' },
  { type: 'stream', label: 'Live Stream', icon: Radio, accept: null },
]

/**
 * Lets the user choose an input source: upload an image, upload a video,
 * or start the live webcam stream. Produces a normalized source descriptor:
 *   { type: 'image'|'video'|'stream', url, file, name }
 */
export function SourcePanel({ source, onSourceChange, onError }) {
  const fileInputRef = useRef(null)
  const [pendingType, setPendingType] = useState(null)

  const clearSource = useCallback(() => {
    onSourceChange(null)
  }, [onSourceChange])

  const handleTypeClick = useCallback((type) => {
    if (type === 'stream') {
      onSourceChange({ type: 'stream', url: null, file: null, name: 'Webcam' })
      return
    }
    setPendingType(type)
    fileInputRef.current?.click()
  }, [onSourceChange])

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) {
      setPendingType(null)
      return
    }

    if (pendingType === 'image' && !file.type.startsWith('image/')) {
      onError?.('Please select a JPEG or PNG image.')
      setPendingType(null)
      return
    }
    if (pendingType === 'video' && !file.type.startsWith('video/')) {
      onError?.('Please select an MP4, WebM, or MOV video.')
      setPendingType(null)
      return
    }

    const url = URL.createObjectURL(file)
    onSourceChange({ type: pendingType, url, file, name: file.name })
    setPendingType(null)
  }, [pendingType, onSourceChange, onError])

  return (
    <div className="card">
      <div className="flex items-center justify-between p-4 border-b border-detecto-border">
        <h3 className="section-title mb-0">Input Source</h3>
        {source && (
          <button
            onClick={clearSource}
            className="btn-ghost text-xs flex items-center gap-1"
            title="Remove current source"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {SOURCE_TYPES.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => handleTypeClick(type)}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all duration-200 ${
                source?.type === type
                  ? 'border-detecto-accent bg-detecto-accentDim text-detecto-accent'
                  : 'border-detecto-border bg-detecto-bgSecondary/50 text-detecto-textMuted hover:border-detecto-accent/50 hover:text-detecto-text'
              }`}
              title={
                type === 'stream'
                  ? 'Start live webcam stream'
                  : `Upload ${label.toLowerCase()}`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </button>
            )
          )}
        </div>

        <div className="text-xs text-detecto-textDim">
          {source ? (
            <span className="flex items-center gap-2">
              <Upload className="w-3 h-3 flex-shrink-0" />
              <span className="truncate" title={source.name}>{source.name}</span>
            </span>
          ) : (
            'Select an image, video, or start the live stream to begin detection.'
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={
            pendingType === 'image'
              ? 'image/jpeg,image/png'
              : 'video/mp4,video/webm,video/quicktime'
          }
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  )
}
