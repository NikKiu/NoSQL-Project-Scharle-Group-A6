import { useState } from 'react'
import { useLoaderData } from 'react-router-dom'
import { PageHero } from '../../components/ui/PageHero'
import { SectionCard } from '../../components/ui/SectionCard'
import { athletesService } from '../../services'
import type { AthleteProfile } from '../../types'

interface LoaderData {
  athlete: AthleteProfile | null
}

export default function AthleteProfilePage() {
  const { athlete } = useLoaderData() as LoaderData
  const [form, setForm] = useState({
    firstName: athlete?.firstName ?? '',
    lastName: athlete?.lastName ?? '',
    weightKg: athlete?.weightKg?.toString() ?? '',
    heightCm: athlete?.heightCm?.toString() ?? '',
    trainingLevel: athlete?.trainingLevel ?? '',
    sports: athlete?.sports?.join(', ') ?? ''
  })
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!athlete) return
    setMessage(null)
    setError(null)

    try {
      await athletesService.update(athlete.athleteId, {
        firstName: form.firstName,
        lastName: form.lastName,
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        heightCm: form.heightCm ? Number(form.heightCm) : undefined,
        trainingLevel: form.trainingLevel,
        sports: form.sports.split(',').map((entry) => entry.trim()).filter(Boolean)
      })
      setMessage('Profil wurde gespeichert. Lade die Seite neu, um aktuelle Loader-Daten zu sehen.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profil konnte nicht gespeichert werden')
    }
  }

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Profil"
        title="Stammdaten und Körperdaten"
        description="Die Profilseite mappt direkt auf die Athlete-Endpunkte des Backends für Lesen und Aktualisieren."
      />

      <SectionCard title="Profil bearbeiten" subtitle="Gewicht, Größe, Trainingslevel und Sportarten lassen sich direkt aktualisieren.">
        {!athlete ? (
          <p className="error-text">Kein Athletenprofil verknüpft.</p>
        ) : (
          <form className="form-grid form-grid--two-columns" onSubmit={saveProfile}>
            <label>
              <span>Vorname</span>
              <input value={form.firstName} onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))} />
            </label>
            <label>
              <span>Nachname</span>
              <input value={form.lastName} onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))} />
            </label>
            <label>
              <span>Gewicht (kg)</span>
              <input value={form.weightKg} onChange={(event) => setForm((prev) => ({ ...prev, weightKg: event.target.value }))} />
            </label>
            <label>
              <span>Größe (cm)</span>
              <input value={form.heightCm} onChange={(event) => setForm((prev) => ({ ...prev, heightCm: event.target.value }))} />
            </label>
            <label>
              <span>Trainingslevel</span>
              <input value={form.trainingLevel} onChange={(event) => setForm((prev) => ({ ...prev, trainingLevel: event.target.value }))} />
            </label>
            <label>
              <span>Sportarten (kommagetrennt)</span>
              <input value={form.sports} onChange={(event) => setForm((prev) => ({ ...prev, sports: event.target.value }))} />
            </label>
            {message ? <p className="success-text">{message}</p> : null}
            {error ? <p className="error-text">{error}</p> : null}
            <button className="button" type="submit">Profil speichern</button>
          </form>
        )}
      </SectionCard>
    </div>
  )
}

