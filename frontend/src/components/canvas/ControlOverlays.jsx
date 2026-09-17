export function ControlOverlays({ options, onChange }) {
  const toggles = [
    { key: 'showBoxes', label: 'Bounding Boxes' },
    { key: 'showLabels', label: 'Class Labels' },
    { key: 'showConfidence', label: 'Confidence Scores' },
    { key: 'showTrails', label: 'Tracking Trails' },
    { key: 'showFPS', label: 'FPS Counter' },
  ]

  return (
    <div className="absolute top-4 right-4 bg-gray-900/90 backdrop-blur rounded-lg p-3 space-y-2 border border-gray-700">
      <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Overlays</h3>
      {toggles.map(({ key, label }) => (
        <label key={key} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options[key]}
            onChange={(e) => onChange(key, e.target.checked)}
            className="w-4 h-4 accent-blue-500 rounded border-gray-600"
          />
          <span className="text-sm text-gray-200">{label}</span>
        </label>
      ))}
    </div>
  )
}