import { Link, useLoaderData } from 'react-router-dom'
import { DataTable } from '../../components/ui/DataTable'
import { PageHero } from '../../components/ui/PageHero'
import { SectionCard } from '../../components/ui/SectionCard'
import { StatCard } from '../../components/ui/StatCard'
import { TimeSeriesChart } from '../../components/ui/TimeSeriesChart'
import type { AthleteProfile, TrainingSession } from '../../types'

interface LoaderData {
  athlete: AthleteProfile
  history: TrainingSession[]
  performance: any
  heartRateSeries: Array<{ label: string; value: number }>
}

export default function TrainerAthleteDetailPage() {
  const { athlete, history, performance, heartRateSeries } = useLoaderData() as LoaderData

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Sportlerdetail"
        title={`${athlete.firstName} ${athlete.lastName}`}
        description="Historie, Performance und Auswertungen für einen einzelnen Sportler."
      />

      <div className="stats-grid">
        <StatCard label="Sportarten" value={athlete.sports.join(', ')} />
        <StatCard label="Level" value={athlete.trainingLevel ?? '-'} />
        <StatCard label="Sessions" value={history.length} />
        <StatCard label="Performance" value={performance ? 'geladen' : 'n/a'} />
      </div>

      <SectionCard title="Historische Sessions" subtitle="Trainingsdaten des Sportlers über die Analytics- und Session-Endpunkte.">
        <DataTable
          columns={[
            { key: 'sessionId', header: 'Session', render: (row: TrainingSession) => row.sessionId },
            { key: 'sport', header: 'Sport', render: (row: TrainingSession) => row.sport },
            { key: 'status', header: 'Status', render: (row: TrainingSession) => row.status },
            { key: 'startAt', header: 'Start', render: (row: TrainingSession) => new Date(row.startAt).toLocaleString() },
            {
              key: 'details',
              header: 'Insights',
              render: (row: TrainingSession) => (
                <Link className="table-link" to={`/app/trainer/sessions/${row.sessionId}`}>
                  Öffnen
                </Link>
              )
            }
          ]}
          emptyText="Keine historischen Sessions vorhanden."
          rows={history}
        />
      </SectionCard>

      <SectionCard title="Performance-Metriken" subtitle="Serverseitig aggregierte Kennzahlen für die Traineranalyse.">
        <pre className="json-panel">{JSON.stringify(performance, null, 2)}</pre>
      </SectionCard>

      <SectionCard title="Time-Series Analyse" subtitle="Verlauf der durchschnittlichen Herzfrequenz über die letzten Sessions.">
        {heartRateSeries.length > 0 ? (
          <TimeSeriesChart title="Durchschnittliche Herzfrequenz" points={heartRateSeries} unit="bpm" color="#0f766e" />
        ) : (
          <p className="empty-inline">Keine Zeitreihendaten für diesen Sportler verfügbar.</p>
        )}
      </SectionCard>
    </div>
  )
}

