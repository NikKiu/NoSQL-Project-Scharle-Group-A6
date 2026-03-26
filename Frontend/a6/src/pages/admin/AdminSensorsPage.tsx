import { useState } from 'react'
import { useLoaderData } from 'react-router-dom'
import { DataTable } from '../../components/ui/DataTable'
import { PageHero } from '../../components/ui/PageHero'
import { SectionCard } from '../../components/ui/SectionCard'
import { adminService } from '../../services'
import type { SensorCatalogItem } from '../../types'

interface LoaderData {
  sensorCatalog: SensorCatalogItem[]
  sensorStats: any
}

export default function AdminSensorsPage() {
  const { sensorCatalog, sensorStats } = useLoaderData() as LoaderData
  const [form, setForm] = useState({
    sensorType: '',
    displayName: '',
    unit: '',
    description: '',
    generatorType: 'custom' as 'heart-rate' | 'gps' | 'power' | 'custom',
    generatorConfig: '{"metricKey":"customMetric","base":50,"amplitude":10,"noise":6,"min":0,"max":100,"frequencyDivisor":10}'
  })
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)
    setError(null)

    try {
      let parsedConfig: Record<string, unknown> | undefined
      const rawConfig = form.generatorConfig.trim()
      if (rawConfig.length > 0) {
        const parsed = JSON.parse(rawConfig)
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          setError('generatorConfig muss ein JSON-Objekt sein')
          return
        }
        parsedConfig = parsed as Record<string, unknown>
      }

      await adminService.upsertSensorType({
        sensorType: form.sensorType,
        displayName: form.displayName,
        unit: form.unit,
        description: form.description,
        generatorType: form.generatorType,
        generatorConfig: parsedConfig
      })
      setFeedback('Sensortyp gespeichert. Route neu laden, um den Katalog via Loader zu aktualisieren.')
      setForm((prev) => ({ ...prev, sensorType: '', displayName: '', unit: '', description: '' }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sensortyp konnte nicht gespeichert werden')
    }
  }

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Sensorkatalog"
        title="Sensortypen flexibel verwalten"
        description="Admin kann neue Sensorprofile hinzufuegen, während Sportler und Trainer den Katalog adaptiv nutzen."
      />

      <SectionCard title="Sensortyp anlegen oder aktualisieren" subtitle="Wichtig für erweiterbare Sport- und Sensorkonfigurationen ohne Frontend-Umbauten.">
        <form className="form-grid form-grid--two-columns" onSubmit={handleSave}>
          <label>
            <span>Technischer Typ</span>
            <input value={form.sensorType} onChange={(event) => setForm((prev) => ({ ...prev, sensorType: event.target.value }))} required />
          </label>
          <label>
            <span>Anzeigename</span>
            <input value={form.displayName} onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))} />
          </label>
          <label>
            <span>Einheit</span>
            <input value={form.unit} onChange={(event) => setForm((prev) => ({ ...prev, unit: event.target.value }))} />
          </label>
          <label>
            <span>Beschreibung</span>
            <input value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
          </label>
          <label>
            <span>Generator-Typ (Backend-Funktion)</span>
            <select
              value={form.generatorType}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  generatorType: event.target.value as 'heart-rate' | 'gps' | 'power' | 'custom'
                }))
              }
            >
              <option value="heart-rate">heart-rate</option>
              <option value="gps">gps</option>
              <option value="power">power</option>
              <option value="custom">custom</option>
            </select>
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            <span>Generator-Parameter (JSON)</span>
            <textarea
              rows={5}
              value={form.generatorConfig}
              onChange={(event) => setForm((prev) => ({ ...prev, generatorConfig: event.target.value }))}
              placeholder='{"metricKey":"cadence","base":90,"amplitude":12,"noise":4,"min":40,"max":160,"frequencyDivisor":10}'
            />
          </label>
          {feedback ? <p className="success-text">{feedback}</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
          <button className="button" type="submit">Sensortyp speichern</button>
        </form>
      </SectionCard>

      <SectionCard title="Aktueller Sensorkatalog" subtitle="Direkt durch den Loader aus MongoDB geladen.">
        <DataTable
          columns={[
            { key: 'sensorType', header: 'Typ', render: (row: SensorCatalogItem) => row.sensorType },
            { key: 'displayName', header: 'Name', render: (row: SensorCatalogItem) => row.displayName },
            { key: 'unit', header: 'Einheit', render: (row: SensorCatalogItem) => row.unit ?? '-' },
            { key: 'generatorType', header: 'Generator', render: (row: SensorCatalogItem) => row.generatorType ?? '-' },
            { key: 'description', header: 'Beschreibung', render: (row: SensorCatalogItem) => row.description ?? '-' }
          ]}
          emptyText="Keine Sensortypen vorhanden."
          rows={sensorCatalog}
        />
      </SectionCard>

      <SectionCard title="Sensor-Nutzung" subtitle="Analytics-Endpunkt für Nutzungsauswertungen und Datenqualität.">
        <pre className="json-panel">{JSON.stringify(sensorStats, null, 2)}</pre>
      </SectionCard>
    </div>
  )
}

