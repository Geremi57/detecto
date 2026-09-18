import { ChevronDown, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const toggleGroups = {
  detection: [
    { key: 'showBoxes', label: 'Bounding Boxes', description: 'Draw detection rectangles' },
    { key: 'showLabels', label: 'Labels', description: 'Show the person label' },
    { key: 'showConfidence', label: 'Confidence Scores', description: 'Display detection confidence %' },
  ],
  display: [
    { key: 'boxThickness', label: 'Box Thickness', type: 'range', min: 1, max: 5, step: 1, description: 'Bounding box line width' },
    { key: 'fontSize', label: 'Label Font Size', type: 'range', min: 10, max: 18, step: 1, description: 'Text label size' },
  ],
}

const DEFAULTS = {
  showBoxes: true,
  showLabels: true,
  showConfidence: true,
  boxThickness: 2,
  fontSize: 12,
}

export function ControlOverlays({ options, onChange }) {
  const [open, setOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState({
    detection: true,
    display: false,
  })
  const rootRef = useRef(null)

  // Close the dropdown on outside click or Escape.
  useEffect(() => {
    if (!open) return
    const handlePointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }))
  }

  const resetDefaults = () => {
    Object.entries(DEFAULTS).forEach(([key, value]) => onChange(key, value))
  }

  const renderControl = ({ key, label, description, type = 'checkbox', min, max, step }) => {
    const value = options[key]
    const isRange = type === 'range'

    return (
      <div key={key} className="flex items-center gap-3 group">
        <label className="flex-1 cursor-pointer" title={description}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-detecto-text group-hover:text-detecto-accent transition-colors">{label}</span>
            {isRange ? (
              <span className="text-xs font-mono text-detecto-accent">{value}</span>
            ) : null}
          </div>
          <p className="text-xs text-detecto-textDim mt-0.5">{description}</p>
        </label>
        {isRange ? (
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(key, parseFloat(e.target.value))}
            className="w-24 h-2 accent-detecto-accent"
            aria-label={label}
          />
        ) : (
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => onChange(key, e.target.checked)}
            className="w-4 h-4 accent-detecto-accent rounded border-detecto-border bg-detecto-bgSecondary focus:ring-2 focus:ring-detecto-accent/30"
            aria-label={label}
          />
        )}
      </div>
    )
  }

  return (
    <div ref={rootRef} className="absolute top-4 right-4 z-10 pointer-events-auto">
      {/* Collapsed trigger — keeps the media view unobstructed */}
      <button
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border backdrop-blur-xl transition-colors shadow-lg ${
          open
            ? 'bg-detecto-accentDim border-detecto-accent/50 text-detecto-accent'
            : 'bg-detecto-bgCard/90 border-detecto-border/50 text-detecto-textMuted hover:text-detecto-text hover:border-detecto-accent/50'
        }`}
        title="Overlay settings"
      >
        <SlidersHorizontal className="w-4 h-4" />
        <span className="text-xs font-medium">Overlays</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[260px] bg-detecto-bgCard/95 backdrop-blur-xl rounded-xl border border-detecto-border/50 shadow-xl overflow-hidden animate-fade-in">
          <div className="p-3 space-y-4 max-h-[60vh] overflow-y-auto">
            {Object.entries(toggleGroups).map(([group, controls]) => (
              <div key={group} className="border-b border-detecto-border/30 last:border-0 pb-3">
                <button
                  onClick={() => toggleGroup(group)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-detecto-accentDim transition-colors"
                  aria-expanded={expandedGroups[group]}
                >
                  <span className="text-xs font-medium text-detecto-textMuted uppercase tracking-wider">
                    {group.charAt(0).toUpperCase() + group.slice(1)}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-detecto-textDim transition-transform duration-200 ${expandedGroups[group] ? 'rotate-180' : ''}`} />
                </button>
                {expandedGroups[group] && (
                  <div className="mt-2 space-y-2 pt-2 animate-fade-in">
                    {controls.map(control => renderControl(control))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-detecto-border/50 flex items-center gap-2">
            <button onClick={resetDefaults} className="btn-ghost text-xs flex-1 py-1.5 flex items-center justify-center gap-1.5">
              <RotateCcw className="w-3 h-3" />
              Reset Defaults
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
