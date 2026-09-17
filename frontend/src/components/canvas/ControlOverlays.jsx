export function ControlOverlays({ options, onChange }) {
  const toggles = [
    { key: 'showBoxes', label: 'Bounding Boxes' },
    { key: 'showLabels', label: 'Class Labels' },
    { key: 'showConfidence', label: 'Confidence Scores' },
    { key: 'showTrails', label: 'Tracking Trails' },
    { key: 'showFPS', label: 'FPS Counter' },
  ]

  return (
    <div className="absolute top-4 right-4 bg-detecto-bgCard/95 backdrop-blur-xl rounded-xl p-3 space-y-2 border border-detecto-border/50 shadow-xl">
      <h3 className="text-xs font-semibold text-detecto-textMuted uppercase tracking-wider">Overlays</h3>
      {toggles.map(({ key, label }) => (
        <label key={key} className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={options[key]}
            onChange={(e) => onChange(key, e.target.checked)}
            className="w-4 h-4 accent-detecto-accent rounded border-detecto-border bg-detecto-bgSecondary focus:ring-2 focus:ring-detecto-accent/30"
          />
          <span className="text-sm text-detecto-text group-hover:text-detecto-accent transition-colors">{label}</span>
        </label>
      ))}
    </div>
  )
}