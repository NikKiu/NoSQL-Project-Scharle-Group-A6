import { Link, useLoaderData } from 'react-router-dom'
import { PageHero } from '../../components/ui/PageHero'
import { SectionCard } from '../../components/ui/SectionCard'
import { StatCard } from '../../components/ui/StatCard'
import { EmptyState } from '../../components/ui/EmptyState'
import type { AthleteProfile, TrainingSession } from '../../types'

interface LoaderData {
  athlete: AthleteProfile | null
  stats: any
  history: TrainingSession[]
}

export default function AthleteHomePage() {
  const { athlete, stats, history } = useLoaderData() as LoaderData

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Sportler"
        title={`Willkommen${athlete ? `, ${athlete.firstName}` : ''}`}
        description="Starte Trainings, analysiere historische Sessions und pflege dein Profil über klar getrennte Unterseiten."
        actions={
          <div className="button-row">
            <Link className="button" to="/app/athlete/training">Training starten</Link>
            <Link className="button button--secondary" to="/app/athlete/history">Historie ansehen</Link>
          </div>
        }
      />

      <div className="stats-grid">
        <StatCard label="Sportarten" value={athlete?.sports?.join(', ') ?? '-'} />
        <StatCard label="Trainingslevel" value={athlete?.trainingLevel ?? '-'} />
        <StatCard label="Gesamtsessions" value={stats?.totals?.sessions ?? history.length} />
        <StatCard label="Max. Geschwindigkeit" value={stats?.maxSpeed ?? '-'} hint="laut Analytics" />
      </div>

      <SectionCard
        title="Schnellzugriffe"
        subtitle="Die Sportlerfunktionen sind nach den Backend-Operationen gruppiert."
      >
        <div className="action-grid">
          <Link className="action-tile" to="/app/athlete/training">
            <strong>Training</strong>
            <span>Sportart wählen, Sensoren koppeln, Simulation starten</span>
          </Link>
          <Link className="action-tile" to="/app/athlete/history">
            <strong>Trainingshistorie</strong>
            <span>Vergangene Sessions, Kennzahlen und Details einsehen</span>
          </Link>
          <Link className="action-tile" to="/app/athlete/profile">
            <strong>Profil</strong>
            <span>Stammdaten, Körperdaten und bevorzugte Sportarten pflegen</span>
          </Link>
        </div>
      </SectionCard>

      <SectionCard title="Letzte Sessions" subtitle="Die wichtigsten letzten Einheiten direkt auf der Landingpage.">
        {history.length === 0 ? (
          <EmptyState title="Noch keine Historie" description="Starte dein erstes Training, um Sensor- und Leistungsdaten zu sehen." />
        ) : (
          <div className="list-grid">
            {history.slice(0, 3).map((session) => (
              <Link key={session.sessionId} className="list-card" to={`/app/athlete/history/${session.sessionId}`}>
                <strong>{session.sport}</strong>
                <span>{new Date(session.startAt).toLocaleString()}</span>
                <span>Status: {session.status}</span>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

