import { Link, useLoaderData } from 'react-router-dom'
import { PageHero } from '../../components/ui/PageHero'
import { SectionCard } from '../../components/ui/SectionCard'
import { StatCard } from '../../components/ui/StatCard'
import type { AthleteProfile } from '../../types'

interface LoaderData {
  athletes: AthleteProfile[]
  liveOverview: any
  leaderboard: any
}

export default function TrainerHomePage() {
  const { athletes, liveOverview, leaderboard } = useLoaderData() as LoaderData

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Trainer"
        title="Teamsteuerung und Leistungsanalyse"
        description="Landingpage für Trainer mit Schnellzugriff auf Athleten, Echtzeitübersicht und Vergleichsseiten."
        actions={
          <div className="button-row">
            <Link className="button" to="/app/trainer/athletes">Sportlerliste</Link>
            <Link className="button button--secondary" to="/app/trainer/compare">Vergleiche</Link>
          </div>
        }
      />

      <div className="stats-grid">
        <StatCard label="Zugeordnete Sportler" value={athletes.length} />
        <StatCard label="Live-Overview" value={Array.isArray(liveOverview) ? liveOverview.length : 'aktiv'} />
        <StatCard label="Leaderboard" value={Array.isArray(leaderboard) ? leaderboard.length : 'vorhanden'} />
      </div>

      <SectionCard title="Traineraktionen" subtitle="Logisch nach Backend-Use-Cases strukturiert.">
        <div className="action-grid">
          <Link className="action-tile" to="/app/trainer/athletes">
            <strong>Sportler und Historie</strong>
            <span>Zugriff auf historische Trainingsdaten und Performance-Kennzahlen</span>
          </Link>
          <Link className="action-tile" to="/app/trainer/compare">
            <strong>Vergleiche</strong>
            <span>Sportler und Sessions anhand frei wählbarer Metriken gegeneinander stellen</span>
          </Link>
        </div>
      </SectionCard>

      <SectionCard title="Athleten im Fokus" subtitle="Direkter Einstieg in einzelne Sportleransichten.">
        <div className="list-grid">
          {athletes.map((athlete) => (
            <Link className="list-card" key={athlete.athleteId} to={`/app/trainer/athletes/${athlete.athleteId}`}>
              <strong>{athlete.firstName} {athlete.lastName}</strong>
              <span>{athlete.trainingLevel ?? 'kein Level'}</span>
              <span>{athlete.sports.join(', ')}</span>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

