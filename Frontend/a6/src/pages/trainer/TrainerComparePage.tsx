import { useMemo, useState, useEffect } from 'react'
import { useLoaderData } from 'react-router-dom'
import { ComparisonMetricChart } from '../../components/ui/ComparisonMetricChart'
import { PageHero } from '../../components/ui/PageHero'
import { SectionCard } from '../../components/ui/SectionCard'
import { FullScreenLoader } from '../../components/ui/FullScreenLoader'
import { analyticsService } from '../../services'
import type { AthleteProfile } from '../../types'

interface LoaderData {
  athletes: AthleteProfile[]
  notedSessions: unknown
  levelComparison: unknown
}

interface ComparisonRow {
  athleteId: string | null
  label: string
  avgHeartRate: number | null
  maxHeartRate: number | null
  avgSpeed: number | null
  maxSpeed: number | null
  totalDistance: number | null
  sessionCount: number | null
  totalEvents: number | null
}

function normalizeSport(value: string) {
  return value.trim().toLowerCase()
}

function collectSports(athletes: AthleteProfile[]) {
  const unique = new Set<string>()
  for (const athlete of athletes) {
    for (const sport of athlete.sports ?? []) {
      const normalized = normalizeSport(String(sport || ''))
      if (normalized) {
        unique.add(normalized)
      }
    }
  }
  return Array.from(unique).sort((a, b) => a.localeCompare(b))
}

function createEmptyComparisonRow(athleteId: string, fallbackLabel: string): ComparisonRow {
  return {
    athleteId,
    label: fallbackLabel,
    // Für Athleten ohne Daten erzwingen wir y=0-Linien/Null-Balken im Vergleich.
    avgHeartRate: 0,
    maxHeartRate: 0,
    avgSpeed: 0,
    maxSpeed: 0,
    totalDistance: 0,
    sessionCount: 0,
    totalEvents: 0
  }
}

const CHART_COLORS = ['#2563eb', '#0f766e', '#7c3aed', '#dc2626', '#0891b2', '#ea580c']

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
}

function toNumberOrNull(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return null
}

export default function TrainerComparePage() {
  const { athletes } = useLoaderData() as LoaderData
  const availableSports = useMemo(() => collectSports(athletes), [athletes])
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>(
    athletes.slice(0, 2).map((athlete) => athlete.athleteId)
  )
  const [selectedSport, setSelectedSport] = useState<string>(() => collectSports(athletes)[0] ?? '')
  const [comparison, setComparison] = useState<unknown>(null)
  const [isComparing, setIsComparing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (availableSports.length === 0) {
      if (selectedSport !== '') {
        setSelectedSport('')
      }
      return
    }

    if (!availableSports.includes(selectedSport)) {
      setSelectedSport(availableSports[0])
    }
  }, [availableSports, selectedSport])

  // Automatischer Vergleich bei Initialisierung und Auswahländerung
  useEffect(() => {
    let cancelled = false
    async function fetchComparison() {
      if (!selectedSport) {
        setComparison(null)
        setError('Keine Sportart verfügbar. Bitte Athleten mit hinterlegten Sportarten prüfen.')
        return
      }

      if (selectedAthletes.length < 2) {
        setComparison(null)
        setError('Bitte mindestens zwei Sportler auswählen.')
        return
      }
      setIsComparing(true)
      setError(null)
      try {
        const result = await analyticsService.compareAthletes({ athleteIds: selectedAthletes, sport: selectedSport })
        if (!cancelled) setComparison(result)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Vergleich fehlgeschlagen')
      } finally {
        if (!cancelled) setIsComparing(false)
      }
    }
    fetchComparison()
    return () => { cancelled = true }
  }, [selectedAthletes, selectedSport])

  const athleteNameById = useMemo(() => {
    const map = new Map<string, string>()
    athletes.forEach((athlete) => {
      map.set(athlete.athleteId, `${athlete.firstName} ${athlete.lastName}`)
    })
    return map
  }, [athletes])

  const comparisonRows = useMemo(() => {
    const sourceRaw = asRecord(comparison)
    const source = Array.isArray(comparison)
      ? comparison
      : Array.isArray(sourceRaw?.athletes)
        ? sourceRaw.athletes
        : Array.isArray(sourceRaw?.results)
          ? sourceRaw.results
          : []

    return source
      .map((rawRow) => {
        const row = asRecord(rawRow)
        if (!row) {
          return null
        }

        const metrics = asRecord(row.metrics)
        const athleteId = typeof row.athleteId === 'string' ? row.athleteId : null
        const fallbackLabel = athleteId ? athleteNameById.get(athleteId) : null
        const rowLabelValue = [row.athleteName, row.name, row.label, row.athleteId].find(
          (value) => typeof value === 'string'
        )

        return {
          athleteId,
          label: String(fallbackLabel ?? rowLabelValue ?? 'Athlete'),
          avgHeartRate: toNumberOrNull(row.avgHeartRate, metrics?.avgHeartRate),
          maxHeartRate: toNumberOrNull(row.maxHeartRate, metrics?.maxHeartRate),
          avgSpeed: toNumberOrNull(row.avgSpeed, metrics?.avgSpeed),
          maxSpeed: toNumberOrNull(row.maxSpeed, metrics?.maxSpeed),
          totalDistance: toNumberOrNull(row.totalDistance, metrics?.totalDistance),
          sessionCount: toNumberOrNull(row.sessionCount, metrics?.sessionCount),
          totalEvents: toNumberOrNull(row.totalEvents, row.eventCount, metrics?.totalEvents, metrics?.eventCount)
        } satisfies ComparisonRow
      })
      .filter((row): row is ComparisonRow => {
        if (!row) {
          return false
        }

        return [
          row.avgHeartRate,
          row.maxHeartRate,
          row.avgSpeed,
          row.maxSpeed,
          row.totalDistance,
          row.sessionCount,
          row.totalEvents
        ].some((value) => value !== null)
      })
  }, [comparison, athleteNameById])

  const orderedComparisonRows = useMemo(() => {
    // Before the first compare call we keep the chart area empty.
    if (comparison === null) {
      return []
    }

    const byAthleteId = new Map<string, ComparisonRow>()
    comparisonRows.forEach((row) => {
      if (row.athleteId) {
        byAthleteId.set(row.athleteId, row)
      }
    })

    const supportsSportByAthleteId = new Map<string, boolean>()
    athletes.forEach((athlete) => {
      const supportsSport = (athlete.sports ?? []).some((sport) => normalizeSport(String(sport || '')) === selectedSport)
      supportsSportByAthleteId.set(athlete.athleteId, supportsSport)
    })

    const selected = selectedAthletes.map((athleteId) => {
      if (!supportsSportByAthleteId.get(athleteId)) {
        return createEmptyComparisonRow(athleteId, athleteNameById.get(athleteId) ?? athleteId)
      }

      const existing = byAthleteId.get(athleteId)
      if (existing) {
        return existing
      }

      return createEmptyComparisonRow(athleteId, athleteNameById.get(athleteId) ?? athleteId)
    })

    return selected.length > 0 ? selected : comparisonRows
  }, [athleteNameById, athletes, comparison, comparisonRows, selectedAthletes, selectedSport])

  const athleteLabels = orderedComparisonRows.map((row) => row.label)

  const speedProfileDatasets = orderedComparisonRows.map((row, index) => ({
    label: row.label,
    values: [row.avgSpeed ?? 0, row.maxSpeed ?? 0],
    color: CHART_COLORS[index % CHART_COLORS.length]
  }))

  const heartRateProfileDatasets = orderedComparisonRows.map((row, index) => ({
    label: row.label,
    values: [row.avgHeartRate ?? 0, row.maxHeartRate ?? 0],
    color: CHART_COLORS[index % CHART_COLORS.length]
  }))

  const avgSpeedDataset = [
    {
      label: 'Avg Speed',
      values: orderedComparisonRows.map((row) => row.avgSpeed ?? 0),
      color: '#0284c7'
    }
  ]

  const maxSpeedDataset = [
    {
      label: 'Max Speed',
      values: orderedComparisonRows.map((row) => row.maxSpeed ?? 0),
      color: '#1d4ed8'
    }
  ]

  const totalDistanceDataset = [
    {
      label: 'Gesamtdistanz',
      values: orderedComparisonRows.map((row) => row.totalDistance ?? 0),
      color: '#7c3aed'
    }
  ]

  const sessionCountDataset = [
    {
      label: 'Sessions',
      values: orderedComparisonRows.map((row) => row.sessionCount ?? 0),
      color: '#0f766e'
    }
  ]

  const totalEventsDataset = [
    {
      label: 'Events',
      values: orderedComparisonRows.map((row) => row.totalEvents ?? 0),
      color: '#ea580c'
    }
  ]

  function toggleAthlete(athleteId: string) {
    setSelectedAthletes((current) =>
      current.includes(athleteId) ? current.filter((entry) => entry !== athleteId) : [...current, athleteId].slice(-4)
    )
  }

  return (
    <div className="page-stack">
      {isComparing && <FullScreenLoader text="Vergleich wird berechnet und geladen..." />}
      <PageHero
        eyebrow="Vergleiche"
        title="Sportler und Trainingsdaten vergleichen"
        description="Vergleich erfolgt immer sportartspezifisch für eine faire und fachlich saubere Gegenüberstellung."
      />

      <SectionCard
        title="Sportlervergleich"
        subtitle="Wähle zuerst eine Sportart und danach mindestens zwei Athleten. Die Charts aktualisieren sich automatisch."
      >
        <div className="form-grid form-grid--two-columns" style={{ marginBottom: '12px' }}>
          <label>
            <span>Sportart</span>
            <select value={selectedSport} onChange={(event) => setSelectedSport(event.target.value)}>
              {availableSports.length === 0 ? <option value="">Keine Sportarten verfügbar</option> : null}
              {availableSports.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="chip-grid">
          {athletes.map((athlete) => (
            <label className="sensor-chip" key={athlete.athleteId}>
              <input
                checked={selectedAthletes.includes(athlete.athleteId)}
                onChange={() => toggleAthlete(athlete.athleteId)}
                type="checkbox"
              />
              <span>
                {athlete.firstName} {athlete.lastName}
              </span>
            </label>
          ))}
        </div>
        {error ? <p className="error-text">{error}</p> : null}

        {orderedComparisonRows.length > 0 ? (
          <div className="chart-grid comparison-chart-grid">
            <ComparisonMetricChart
              title="Geschwindigkeitsprofil (Funktionsgraphen je Sportler)"
              labels={['Avg Speed', 'Max Speed']}
              datasets={speedProfileDatasets}
              chartType="line"
              unit="km/h"
            />
            <ComparisonMetricChart
              title="Herzfrequenzprofil (Funktionsgraphen je Sportler)"
              labels={['Avg Herzfrequenz', 'Max Herzfrequenz']}
              datasets={heartRateProfileDatasets}
              chartType="line"
              unit="bpm"
            />
            <ComparisonMetricChart
              title="Avg Speed Vergleich je Sportler"
              labels={athleteLabels}
              datasets={avgSpeedDataset}
              chartType="bar"
              unit="km/h"
            />
            <ComparisonMetricChart
              title="Max Speed Vergleich je Sportler"
              labels={athleteLabels}
              datasets={maxSpeedDataset}
              chartType="bar"
              unit="km/h"
            />
            <ComparisonMetricChart
              title="Gesamtdistanz Vergleich"
              labels={athleteLabels}
              datasets={totalDistanceDataset}
              chartType="horizontalBar"
              unit="m"
            />
            <ComparisonMetricChart
              title="Session-Anzahl Vergleich"
              labels={athleteLabels}
              datasets={sessionCountDataset}
              chartType="horizontalBar"
              unit="Sessions"
            />
            <ComparisonMetricChart
              title="Event-Anzahl Vergleich"
              labels={athleteLabels}
              datasets={totalEventsDataset}
              chartType="horizontalBar"
              unit="Events"
            />
          </div>
        ) : null}
      </SectionCard>
    </div>
  )
}

