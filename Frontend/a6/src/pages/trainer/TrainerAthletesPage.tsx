import { Link, useLoaderData } from 'react-router-dom'
import { DataTable } from '../../components/ui/DataTable'
import { PageHero } from '../../components/ui/PageHero'
import { SectionCard } from '../../components/ui/SectionCard'
import type { AthleteProfile } from '../../types'

interface LoaderData {
  athletes: AthleteProfile[]
}

export default function TrainerAthletesPage() {
  const { athletes } = useLoaderData() as LoaderData

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Sportlerliste"
        title="Athleten, Rollen und Historienzugang"
        description="Trainer sehen hier ihre Sportler und navigieren in deren historische Leistungsdaten."
      />

      <SectionCard title="Zugeordnete Athleten" subtitle="Die Liste ist an die Trainerrolle und ggf. zugeordnete Athlete-IDs gekoppelt.">
        <DataTable
          columns={[
            { key: 'name', header: 'Name', render: (row: AthleteProfile) => `${row.firstName} ${row.lastName}` },
            { key: 'sports', header: 'Sportarten', render: (row: AthleteProfile) => row.sports.join(', ') },
            { key: 'level', header: 'Level', render: (row: AthleteProfile) => row.trainingLevel ?? '-' },
            {
              key: 'details',
              header: 'Historie',
              render: (row: AthleteProfile) => <Link className="table-link" to={`/app/trainer/athletes/${row.athleteId}`}>Analysieren</Link>
            }
          ]}
          emptyText="Keine Athleten zugewiesen."
          rows={athletes}
        />
      </SectionCard>
    </div>
  )
}

