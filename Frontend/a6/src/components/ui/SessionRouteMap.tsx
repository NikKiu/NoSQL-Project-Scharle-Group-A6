import { useMemo } from 'react'
import type { GpsTrackPoint } from '../../types'

interface SessionRouteMapProps {
  points: GpsTrackPoint[]
  title?: string
  showEndPoint?: boolean
}

interface ViewBoxPoint {
  x: number
  y: number
}

function getBounds(points: GpsTrackPoint[]) {
  const latValues = points.map((point) => point.lat)
  const lonValues = points.map((point) => point.lon)

  const minLat = Math.min(...latValues)
  const maxLat = Math.max(...latValues)
  const minLon = Math.min(...lonValues)
  const maxLon = Math.max(...lonValues)

  return { minLat, maxLat, minLon, maxLon }
}

function toViewBoxPoint(
  point: GpsTrackPoint,
  bounds: ReturnType<typeof getBounds>,
  width: number,
  height: number,
  padding: number
): ViewBoxPoint {
  const lonSpan = Math.max(0.00001, bounds.maxLon - bounds.minLon)
  const latSpan = Math.max(0.00001, bounds.maxLat - bounds.minLat)

  const drawableWidth = Math.max(1, width - padding * 2)
  const drawableHeight = Math.max(1, height - padding * 2)
  const x = padding + ((point.lon - bounds.minLon) / lonSpan) * drawableWidth
  const y = height - (padding + ((point.lat - bounds.minLat) / latSpan) * drawableHeight)

  return { x, y }
}

export function SessionRouteMap({ points, title = 'GPS-Route', showEndPoint = true }: SessionRouteMapProps) {
  const { pathData, startPoint, endPoint } = useMemo(() => {
    if (points.length < 2) {
      return { pathData: '', startPoint: null as ViewBoxPoint | null, endPoint: null as ViewBoxPoint | null }
    }

    const width = 1000
    const height = 520
    const bounds = getBounds(points)
    const padding = 20
    const mapped = points.map((point) => toViewBoxPoint(point, bounds, width, height, padding))

    const pathData = mapped
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(' ')

    return {
      pathData,
      startPoint: mapped[0],
      endPoint: mapped[mapped.length - 1]
    }
  }, [points])

  if (points.length < 2 || !pathData || !startPoint || !endPoint) {
    return (
      <div className="route-map route-map--empty">
        <p className="chart-title">{title}</p>
        <p className="empty-inline">Noch keine GPS-Daten für eine Route vorhanden.</p>
      </div>
    )
  }

  return (
    <div className="route-map">
      <p className="chart-title">{title}</p>
      <svg className="route-map__canvas" viewBox="0 0 1000 520" role="img" aria-label="GPS Route der Session">
        <rect x="0" y="0" width="1000" height="520" fill="#f6f9ff" />
        <path d={pathData} stroke="#2563eb" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={startPoint.x} cy={startPoint.y} r="10" fill="#16a34a" />
        <circle cx={endPoint.x} cy={endPoint.y} r="10" fill={showEndPoint ? '#dc2626' : '#2563eb'} />
      </svg>
      <div className="route-map__legend">
        <span><strong>Start:</strong> grün</span>
        <span><strong>{showEndPoint ? 'Ziel' : 'Aktueller Punkt'}:</strong> {showEndPoint ? 'rot' : 'blau'}</span>
        <span><strong>Punkte:</strong> {points.length}</span>
      </div>
    </div>
  )
}

