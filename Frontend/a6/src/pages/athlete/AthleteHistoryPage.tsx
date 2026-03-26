import { Link, useLoaderData } from 'react-router-dom'
import { DataTable } from '../../components/ui/DataTable'
import { PageHero } from '../../components/ui/PageHero'
import { SectionCard } from '../../components/ui/SectionCard'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { TimeSeriesChart } from '../../components/ui/TimeSeriesChart'
import type { TrainingSession } from '../../types'

interface LoaderData {
  history: TrainingSession[]
  stats: any
  heartRateSeries: Array<{ label: string; value: number }>
}

export default function AthleteHistoryPage() {
  const { history, stats, heartRateSeries } = useLoaderData() as LoaderData

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Trainingshistorie"
        title="Historische Sessions und Kennzahlen"
        description="Diese Ansicht nutzt die Analytics-Historie und zeigt Trainingsdaten so, wie sie serverseitig aggregiert werden."
      />

      <div className="stats-grid">
        <article className="stat-card"><span className="stat-label">Sessions</span><strong className="stat-value">{history.length}</strong></article>
        <article className="stat-card"><span className="stat-label">Statistik</span><strong className="stat-value">{JSON.stringify(stats ?? {}).length > 2 ? 'vorhanden' : 'n/a'}</strong></article>
      </div>

      <SectionCard title="Alle Trainings" subtitle="Von hier gelangst du direkt in die Trainingsdetails einzelner Sessions.">
        <DataTable
          columns={[
            { key: 'sessionId', header: 'Session', render: (row: TrainingSession) => row.sessionId },
            { key: 'sport', header: 'Sport', render: (row: TrainingSession) => row.sport },
            { key: 'status', header: 'Status', render: (row: TrainingSession) => <StatusBadge value={row.status} /> },
            { key: 'startAt', header: 'Start', render: (row: TrainingSession) => new Date(row.startAt).toLocaleString() },
            {
              key: 'details',
              header: 'Details',
              render: (row: TrainingSession) => <Link className="table-link" to={`/app/athlete/history/${row.sessionId}`}>Ansehen</Link>
            }
          ]}
          emptyText="Noch keine Trainings vorhanden."
          rows={history}
        />
      </SectionCard>

      <SectionCard title="Time-Series Analyse" subtitle="Verlauf der durchschnittlichen Herzfrequenz je Session.">
        {heartRateSeries.length > 0 ? (
          <TimeSeriesChart title="Durchschnittliche Herzfrequenz" points={heartRateSeries} unit="bpm" />
        ) : (
          <p className="empty-inline">Keine Zeitreihendaten für die Graphdarstellung verfügbar.</p>
        )}
      </SectionCard>
    </div>
  )
}

