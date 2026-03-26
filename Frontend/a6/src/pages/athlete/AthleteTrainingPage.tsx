import { useEffect, useMemo, useRef, useState } from 'react'
import { useLoaderData } from 'react-router-dom'
import { PageHero } from '../../components/ui/PageHero'
import { SectionCard } from '../../components/ui/SectionCard'
import { SessionRouteMap } from '../../components/ui/SessionRouteMap'
import { StatCard } from '../../components/ui/StatCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { sensorEventsService, sessionsService } from '../../services'
import type { AthleteProfile, GpsTrackPoint, SensorCatalogItem, SensorEvent, TrainingSession } from '../../types'

interface LoaderData {
  athlete: AthleteProfile | null
  sensorCatalog: SensorCatalogItem[]
  recentEvents: SensorEvent[]
}

const sportOptions = [
  { value: 'running', label: 'Laufen' },
  { value: 'cycling', label: 'Radfahren' },
  { value: 'swimming', label: 'Schwimmen' }
]

export default function AthleteTrainingPage() {
  const { athlete, sensorCatalog, recentEvents } = useLoaderData() as LoaderData
  const [sport, setSport] = useState(athlete?.sports?.[0] ?? 'running')
  const [selectedSensors, setSelectedSensors] = useState<string[]>(sensorCatalog.slice(0, 2).map((sensor) => sensor.sensorType))
  const [status, setStatus] = useState<'idle' | 'running' | 'paused'>('idle')
  const [currentSession, setCurrentSession] = useState<TrainingSession | null>(null)
  const [metrics, setMetrics] = useState({ heartRate: 0, speed: 0, avgHeartRate: 0, maxSpeed: 0, distance: 0, samples: 0 })
  const [routePoints, setRoutePoints] = useState<GpsTrackPoint[]>([])
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<number | null>(null)

  const sensorChoices = useMemo(
    () => (sensorCatalog.length > 0 ? sensorCatalog : [{ sensorType: 'heart-rate', displayName: 'Herzfrequenz' }]),
    [sensorCatalog]
  )

  function cleanupTimer() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => () => cleanupTimer(), [])

  function toggleSensor(sensorType: string) {
    setSelectedSensors((current) =>
      current.includes(sensorType) ? current.filter((entry) => entry !== sensorType) : [...current, sensorType]
    )
  }

  async function pushSample(sessionId: string) {
    const simulation = await sensorEventsService.simulateSample({ sessionId, timestamp: new Date().toISOString() })
    const sample = simulation.sample ?? {}

    setMetrics((current) => {
      const hasHeartRate = typeof sample.heartRate === 'number' && Number.isFinite(sample.heartRate)
      const samples = hasHeartRate ? current.samples + 1 : current.samples
      const avgHeartRate = hasHeartRate
        ? Math.round(((current.avgHeartRate * current.samples) + Number(sample.heartRate)) / Math.max(1, samples))
        : current.avgHeartRate

      const speed = typeof sample.speed === 'number' && Number.isFinite(sample.speed) ? sample.speed : current.speed
      const delta = typeof sample.distanceDelta === 'number' && Number.isFinite(sample.distanceDelta) ? sample.distanceDelta : 0

      return {
        heartRate: hasHeartRate ? Number(sample.heartRate) : current.heartRate,
        speed,
        avgHeartRate,
        maxSpeed: Math.max(current.maxSpeed, speed),
        distance: Number((current.distance + delta).toFixed(2)),
        samples
      }
    })

    if (
      typeof sample.lat === 'number' &&
      Number.isFinite(sample.lat) &&
      typeof sample.lon === 'number' &&
      Number.isFinite(sample.lon)
    ) {
      const lat = sample.lat
      const lon = sample.lon
      setRoutePoints((current) => [
        ...current,
        {
          timestamp: simulation.timestamp,
          lat,
          lon,
          speed: typeof sample.speed === 'number' ? sample.speed : null,
          distanceDelta: typeof sample.distanceDelta === 'number' ? sample.distanceDelta : null
        }
      ])
    }
  }

  async function startTraining() {
    if (!athlete?.athleteId) {
      setError('Kein Sportlerprofil vorhanden.')
      return
    }
    if (selectedSensors.length === 0) {
      setError('Bitte mindestens einen Sensor auswählen.')
      return
    }

    setError(null)
    const session = await sessionsService.create({
      athleteId: athlete.athleteId,
      sport,
      sensorTypes: selectedSensors
    })

    setCurrentSession(session)
    setMetrics({ heartRate: 0, speed: 0, avgHeartRate: 0, maxSpeed: 0, distance: 0, samples: 0 })
    setRoutePoints([])
    setStatus('running')
    cleanupTimer()
    timerRef.current = window.setInterval(() => {
      pushSample(session.sessionId).catch((err) => {
        setError(err instanceof Error ? err.message : 'Live-Daten konnten nicht gespeichert werden')
      })
    }, 2000)
  }

  function pauseTraining() {
    cleanupTimer()
    setStatus('paused')
  }

  function resumeTraining() {
    if (!currentSession) return
    setStatus('running')
    cleanupTimer()
    timerRef.current = window.setInterval(() => {
      pushSample(currentSession.sessionId).catch((err) => {
        setError(err instanceof Error ? err.message : 'Live-Daten konnten nicht gespeichert werden')
      })
    }, 2000)
  }

  async function finishTraining() {
    if (!currentSession) return
    cleanupTimer()
    await sessionsService.finish(currentSession.sessionId, { endAt: new Date().toISOString() })
    setStatus('idle')
    setCurrentSession(null)
  }

  const animationLabel = sport === 'cycling' ? 'BIKE' : sport === 'swimming' ? 'SWIM' : 'RUN'

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Training"
        title="Live-Training und Sensor-Simulation"
        description="Wählbar nach Sportart und frei verwaltbaren Sensorprofilen. Die Seite nutzt Sessions-, Sensor-Events- und Analytics-Endpunkte des Backends."
      />

      <SectionCard title="Trainingssteuerung" subtitle="Start, Pause, Fortsetzen und Beenden direkt aus der Sportler-Subpage.">
        {!athlete ? (
          <EmptyState title="Kein Profil gefunden" description="Lege zuerst ein Athletenprofil an oder ordne das Nutzerkonto einem Profil zu." />
        ) : (
          <div className="training-layout">
            <div className="form-grid form-grid--compact">
              <label>
                <span>Sportart</span>
                <select value={sport} onChange={(event) => setSport(event.target.value)} disabled={status !== 'idle'}>
                  {sportOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <div>
                <span className="label-text">Sensoren</span>
                <div className="chip-grid">
                  {sensorChoices.map((sensor) => (
                    <label className="sensor-chip" key={sensor.sensorType}>
                      <input
                        checked={selectedSensors.includes(sensor.sensorType)}
                        disabled={status !== 'idle'}
                        onChange={() => toggleSensor(sensor.sensorType)}
                        type="checkbox"
                      />
                      <span>{sensor.displayName}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="button-row">
                {status === 'idle' ? <button className="button" onClick={startTraining} type="button">Training starten</button> : null}
                {status === 'running' ? <button className="button button--secondary" onClick={pauseTraining} type="button">Pausieren</button> : null}
                {status === 'paused' ? <button className="button" onClick={resumeTraining} type="button">Fortsetzen</button> : null}
                {status !== 'idle' ? <button className="button button--ghost" onClick={finishTraining} type="button">Beenden</button> : null}
              </div>
              {error ? <p className="error-text">{error}</p> : null}
            </div>
            <div className="training-visual">
              <div className="training-visual__badge">{animationLabel}</div>
              <p>{currentSession ? `Session ${currentSession.sessionId}` : 'Bereit für eine neue Session'}</p>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Live GPS-Route"
        subtitle="Falls GPS aktiviert ist, wird die Trainingsstrecke während der Session live gezeichnet."
      >
        <SessionRouteMap
          points={routePoints}
          title="Aktuelle Trainingsroute"
          showEndPoint={status === 'idle' && currentSession === null && routePoints.length > 1}
        />
      </SectionCard>

      <div className="stats-grid">
        <StatCard label="Aktueller Puls" value={metrics.heartRate ? `${metrics.heartRate} bpm` : '-'} />
        <StatCard label="Aktuelle Geschwindigkeit" value={metrics.speed ? `${metrics.speed} km/h` : '-'} />
        <StatCard label="Durchschnittspuls" value={metrics.avgHeartRate ? `${metrics.avgHeartRate} bpm` : '-'} />
        <StatCard label="Max. Geschwindigkeit" value={metrics.maxSpeed ? `${metrics.maxSpeed} km/h` : '-'} />
        <StatCard label="Distanz" value={`${metrics.distance.toFixed(2)} m`} />
      </div>

      <SectionCard title="Letzte Sensorevents" subtitle="Direkt aus dem Backend geladen, damit du sofort live-nahe Daten siehst.">
        {recentEvents.length === 0 ? (
          <EmptyState title="Keine Sensorevents vorhanden" description="Sobald Trainings laufen, erscheinen hier die letzten Messwerte." />
        ) : (
          <div className="list-grid">
            {recentEvents.slice(0, 6).map((event) => (
              <article className="list-card" key={`${event.sessionId}-${event.timestamp}-${event.sensorType}`}>
                <strong>{event.sensorType}</strong>
                <span>{new Date(event.timestamp).toLocaleString()}</span>
                <span>HR: {event.heartRate ?? '-'}</span>
                <span>Speed: {event.speed ?? '-'}</span>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

