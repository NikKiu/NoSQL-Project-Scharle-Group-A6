import { useState } from 'react'
import { useLoaderData } from 'react-router-dom'
import { PageHero } from '../../components/ui/PageHero'
import { SectionCard } from '../../components/ui/SectionCard'
import { SessionRouteMap } from '../../components/ui/SessionRouteMap'
import { StatCard } from '../../components/ui/StatCard'
import { TimeSeriesChart } from '../../components/ui/TimeSeriesChart'
import { sessionsService } from '../../services'
import type { DetailedSessionAnalysis, SessionSummary, TrainingSession } from '../../types'

interface LoaderData {
  sessionData: TrainingSession
  summary: SessionSummary
  detailed: DetailedSessionAnalysis
}

export default function TrainerSessionDetailPage() {
  const { sessionData, summary, detailed } = useLoaderData() as LoaderData
  const [notes, setNotes] = useState(sessionData.notes ?? '')
  const [appendMode, setAppendMode] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  const distanceSeries = seriesRows
    .map((row: any) => ({
      label: row?._id ? new Date(row._id).toLocaleTimeString() : '-',
      value: Number(row?.distanceCovered ?? 0)
    }))
    .filter((point: any) => Number.isFinite(point.value))

  const gpsTrack = Array.isArray(detailed?.gpsTrack) ? detailed.gpsTrack : []
  const bySensorType = Array.isArray(detailed?.bySensorType) ? detailed.bySensorType : []

  async function saveNotes(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setError(null)

    try {
      await sessionsService.updateNotes(sessionData.sessionId, { notes, append: appendMode })
      setMessage('Notizen gespeichert.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Notizen konnten nicht gespeichert werden')
    }
  }

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Session Insight"
        title={`Session ${sessionData.sessionId}`}
        description="Trainer sieht Kennzahlen im Detail und kann Session-Notizen direkt pflegen."
      />

      <div className="stats-grid">
        <StatCard label="Sport" value={summary.sport} />
        <StatCard label="Status" value={summary.status} />
        <StatCard label="Avg. Herzfrequenz" value={summary.avgHeartRate ?? '-'} />
        <StatCard label="Distanz" value={summary.totalDistance ?? '-'} />
      </div>

      <SectionCard title="Session-Analyse" subtitle="Detaillierte Einblicke aus der Analytics Pipeline.">
        {heartRateSeries.length > 0 ? (
          <div className="chart-grid">
            <TimeSeriesChart title="Herzfrequenzverlauf" points={heartRateSeries} unit="bpm" color="#ef4444" />
            <TimeSeriesChart title="Geschwindigkeitsverlauf" points={speedSeries} unit="km/h" color="#2563eb" />
            <TimeSeriesChart title="Distanz pro Intervall" points={distanceSeries} unit="m" color="#7c3aed" />
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

      <SectionCard title="Notizen" subtitle="Trainerspezifische Notizen zur Session pflegen.">
        <form className="form-grid" onSubmit={saveNotes}>
          <label>
            <span>Notiztext</span>
            <textarea
              rows={6}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Trainingsnotiz eingeben"
            />
          </label>

          <label className="sensor-chip flex items-center gap-2 cursor-pointer">
            <span>An bestehende Notizen anhängen</span>
            <input type="checkbox" checked={appendMode} onChange={(event) => setAppendMode(event.target.checked)} />
          </label>

          {message ? <p className="success-text">{message}</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
          <button className="button" type="submit">Notizen speichern</button>
        </form>
      </SectionCard>
    </div>
  )
}

