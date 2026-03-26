import { useLoaderData } from 'react-router-dom'
import { PageHero } from '../../components/ui/PageHero'
import { SectionCard } from '../../components/ui/SectionCard'
import { SessionRouteMap } from '../../components/ui/SessionRouteMap'
import { StatCard } from '../../components/ui/StatCard'
import { TimeSeriesChart } from '../../components/ui/TimeSeriesChart'
import type { DetailedSessionAnalysis, SessionSummary, TrainingSession } from '../../types'

interface LoaderData {
  trainingSession: TrainingSession
  summary: SessionSummary
  detailed: DetailedSessionAnalysis
  heartRateZones: unknown
}

export default function AthleteSessionDetailPage() {
  const { trainingSession, summary, detailed, heartRateZones } = useLoaderData() as LoaderData

  const seriesRows = Array.isArray(detailed?.timeSeriesData) ? detailed.timeSeriesData : []
  const heartRateSeries = seriesRows
    .map((row: any) => ({
      label: row?._id ? new Date(row._id).toLocaleTimeString() : '-',
      value: Number(row?.avgHeartRate ?? 0)
    }))
    .filter((point: any) => Number.isFinite(point.value))

  const speedSeries = seriesRows
    .map((row: any) => ({
      label: row?._id ? new Date(row._id).toLocaleTimeString() : '-',
      value: Number(row?.avgSpeed ?? 0)
    }))
    .filter((point: any) => Number.isFinite(point.value))

  const gpsTrack = Array.isArray(detailed?.gpsTrack) ? detailed.gpsTrack : []
  const bySensorType = Array.isArray(detailed?.bySensorType) ? detailed.bySensorType : []

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Trainingsdetails"
        title={`Session ${trainingSession.sessionId}`}
        description="Detailansicht für eine konkrete Session inklusive Zusammenfassung, Detailanalyse und Herzfrequenz-Zonen."
      />

      <div className="stats-grid">
        <StatCard label="Sport" value={summary.sport} />
        <StatCard label="Status" value={summary.status} />
        <StatCard label="Avg. Herzfrequenz" value={summary.avgHeartRate ?? '-'} />
        <StatCard label="Max. Speed" value={summary.maxSpeed ?? '-'} />
        <StatCard label="Distanz" value={summary.totalDistance ?? '-'} />
      </div>

      <SectionCard title="Zusammenfassung" subtitle="Serverseitig aggregiert über die Analytics-Pipeline.">
        <pre className="json-panel">{JSON.stringify(summary, null, 2)}</pre>
      </SectionCard>

      <SectionCard title="Detailanalyse" subtitle="Das Backend liefert hier erweiterte Session-Metriken für tiefergehende Auswertungen.">
        {heartRateSeries.length > 0 ? (
          <div className="chart-grid">
            <TimeSeriesChart title="Herzfrequenzverlauf" points={heartRateSeries} unit="bpm" color="#ef4444" />
            <TimeSeriesChart title="Geschwindigkeitsverlauf" points={speedSeries} unit="km/h" color="#2563eb" />
          </div>
        ) : null}

        <SessionRouteMap points={gpsTrack} title="GPS Route der Session" />

        {bySensorType.length > 0 ? (
          <div className="list-grid" style={{ marginTop: 16 }}>
            {bySensorType.map((sensor) => (
              <article className="list-card" key={sensor._id}>
                <strong>{sensor._id}</strong>
                <span>Events: {sensor.eventCount}</span>
                {Object.entries(sensor.metrics ?? {}).map(([key, value]) => (
                  <span key={key}>{key}: {typeof value === 'number' ? value.toFixed(2) : String(value ?? '-')}</span>
                ))}
              </article>
            ))}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="Herzfrequenz-Zonen" subtitle="Nur verfügbar, wenn Belastungszonen für den Sportler gepflegt wurden.">
        <pre className="json-panel">{JSON.stringify(heartRateZones, null, 2)}</pre>
      </SectionCard>
    </div>
  )
}

