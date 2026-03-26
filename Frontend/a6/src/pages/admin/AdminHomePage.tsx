import { Link, useLoaderData } from 'react-router-dom'
import { PageHero } from '../../components/ui/PageHero'
import { SectionCard } from '../../components/ui/SectionCard'
import { StatCard } from '../../components/ui/StatCard'
import type { SensorCatalogItem, User } from '../../types'

interface LoaderData {
  users: User[]
  sensorCatalog: SensorCatalogItem[]
  dataVolume: any
}

export default function AdminHomePage() {
  const { users, sensorCatalog, dataVolume } = useLoaderData() as LoaderData

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Administration"
        title="Datenpflege, Rollenverwaltung und Systemkontrolle"
        description="Admin-Landingpage mit Einstieg in Nutzerverwaltung, Sensorverwaltung und Monitoring."
        actions={
          <div className="button-row">
            <Link className="button" to="/app/admin/users">Nutzer verwalten</Link>
            <Link className="button button--secondary" to="/app/admin/sensors">Sensoren</Link>
            <Link className="button button--ghost" to="/app/admin/monitoring">Monitoring</Link>
          </div>
        }
      />

      <div className="stats-grid">
        <StatCard label="Nutzer" value={users.length} />
        <StatCard label="Sensortypen" value={sensorCatalog.length} />
        <StatCard label="Datenvolumen" value={Array.isArray(dataVolume) ? dataVolume.length : 'vorhanden'} />
      </div>

      <SectionCard title="Admin-Aufgaben" subtitle="Die Bereiche entsprechen den zentralen administrativen Backend-Operationen.">
        <div className="action-grid">
          <Link className="action-tile" to="/app/admin/users">
            <strong>Nutzer und Rollen</strong>
            <span>Benutzer anlegen und Rechte transparent verwalten</span>
          </Link>
          <Link className="action-tile" to="/app/admin/sensors">
            <strong>Sensortypen</strong>
            <span>Neue Sensortypen ohne Downtime pflegen und Kataloge erweitern</span>
          </Link>
          <Link className="action-tile" to="/app/admin/monitoring">
            <strong>Monitoring</strong>
            <span>Schreibrate, Audit-Logs und Datenvolumen kontrollieren</span>
          </Link>
        </div>
      </SectionCard>
    </div>
  )
}

