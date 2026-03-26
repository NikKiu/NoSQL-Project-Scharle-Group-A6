import { useEffect, useState } from 'react'
import { useLoaderData, useRevalidator } from 'react-router-dom'
import { DataTable } from '../../components/ui/DataTable'
import { PageHero } from '../../components/ui/PageHero'
import { SectionCard } from '../../components/ui/SectionCard'
import { adminService } from '../../services'
import type { AthleteProfile, TrainerAssignment } from '../../types'

interface LoaderData {
  assignments: TrainerAssignment[]
  athletes: AthleteProfile[]
}

export default function AdminAssignmentsPage() {
  const { assignments, athletes } = useLoaderData() as LoaderData
  const revalidator = useRevalidator()
  const [selectedTrainerId, setSelectedTrainerId] = useState(assignments[0]?.trainerId ?? '')
  const [selectedAthleteId, setSelectedAthleteId] = useState(athletes[0]?.athleteId ?? '')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(timeout)
  }, [toast])

  async function applyAssignment(action: 'add' | 'remove') {
    if (!selectedTrainerId || !selectedAthleteId) return
    setToast(null)

    try {
      await adminService.updateTrainerAthleteAssignment(selectedTrainerId, {
        action,
        athleteId: selectedAthleteId
      })
      revalidator.revalidate()
      setToast({
        type: 'success',
        text: action === 'add' ? 'Sportler wurde dem Trainer hinzugefügt.' : 'Sportler wurde vom Trainer entfernt.'
      })
    } catch (err) {
      setToast({ type: 'error', text: err instanceof Error ? err.message : 'Zuordnung konnte nicht aktualisiert werden' })
    }
  }

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Trainer-Zuordnung"
        title="Sportler Trainern zuordnen"
        description="Admin kann Zuordnungen transparent einsehen und einzelne Sportler pro Trainer hinzufuegen oder entfernen."
      />

      <SectionCard title="Zuordnung bearbeiten" subtitle="Fuege einen Sportler zu einem Trainer hinzu oder entferne ihn wieder.">
        <div className="form-grid form-grid--two-columns">
          <label>
            <span>Trainer</span>
            <select value={selectedTrainerId} onChange={(event) => setSelectedTrainerId(event.target.value)}>
              {assignments.map((assignment) => (
                <option key={assignment.trainerId} value={assignment.trainerId}>
                  {assignment.trainerName ?? assignment.trainerEmail}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Sportler</span>
            <select value={selectedAthleteId} onChange={(event) => setSelectedAthleteId(event.target.value)}>
              {athletes.map((athlete) => (
                <option key={athlete.athleteId} value={athlete.athleteId}>
                  {athlete.firstName} {athlete.lastName}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="button-row">
          <button className="button" onClick={() => applyAssignment('add')} type="button" disabled={revalidator.state === 'loading'}>
            Sportler hinzufügen
          </button>
          <button className="button button--secondary" onClick={() => applyAssignment('remove')} type="button" disabled={revalidator.state === 'loading'}>
            Sportler entfernen
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Aktuelle Zuordnungen" subtitle="Alle Trainer mit den jeweils zugeordneten Sportlern.">
        <DataTable
          columns={[
            { key: 'trainer', header: 'Trainer', render: (row: TrainerAssignment) => row.trainerName ?? row.trainerEmail },
            {
              key: 'athletes',
              header: 'Sportler',
              render: (row: TrainerAssignment) =>
                row.assignedAthletes.length > 0
                  ? row.assignedAthletes.map((athlete) => athlete.name).join(', ')
                  : '-'
            },
            {
              key: 'count',
              header: 'Anzahl',
              render: (row: TrainerAssignment) => row.trainerAthleteIds.length
            }
          ]}
          rows={assignments}
          emptyText="Keine Trainerzuordnungen vorhanden."
        />
      </SectionCard>

      {toast ? (
        <div className={`toast toast--${toast.type}`} role="status" aria-live="polite">
          {toast.text}
        </div>
      ) : null}
    </div>
  )
}

