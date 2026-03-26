import './FullScreenLoader.css'

export function FullScreenLoader({ text = 'Vergleich wird berechnet und geladen...' }: { text?: string }) {
  return (
    <div className="fullscreen-loader-overlay">
      <div className="fullscreen-loader-content">
        <div className="spinner" />
        <div className="loader-text">{text}</div>
      </div>
    </div>
  )
}

