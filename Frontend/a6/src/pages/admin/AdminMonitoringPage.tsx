import { useLoaderData, useRevalidator } from 'react-router-dom'
import { ComparisonMetricChart, type ComparisonMetricDataset } from '../../components/ui/ComparisonMetricChart'
import { PageHero } from '../../components/ui/PageHero'
import { SectionCard } from '../../components/ui/SectionCard'
import { StatCard } from '../../components/ui/StatCard'
import { TimeSeriesChart } from '../../components/ui/TimeSeriesChart'

interface SystemMetricRow {
  interval: string
  sensorType: string
  eventCount: number
  athleteCount: number
  avgLatencyMs: number
  eventsPerSecond: number
}

interface WritePerformanceRow {
  interval: string
  totalEvents: number
  activeAthletes: number
  eventsPerSecond: number
  avgLatencyMs: number
  maxLatencyMs: number
  eventsPerAthlete: number
}

interface AuditLogRow {
  action: string
  userRole?: string
  date: string
  count: number
}

interface DataVolumeRow {
  sport: string
  sessionCount: number
  totalEvents: number
  uniqueAthleteCount: number
  avgEventsPerSession: number
}

interface LoaderData {
  systemMetrics: SystemMetricRow[]
  writePerformance: WritePerformanceRow[]
  auditLogs: AuditLogRow[]
  dataVolume: DataVolumeRow[]
}

function formatInterval(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function buildDatasetsBySensor(
  rows: SystemMetricRow[],
  valueAccessor: (row: SystemMetricRow) => number
): { labels: string[]; datasets: ComparisonMetricDataset[] } {
  const labels = Array.from(new Set(rows.map((row) => formatInterval(row.interval))))
  const grouped = new Map<string, Map<string, number>>()

  for (const row of rows) {
    const intervalLabel = formatInterval(row.interval)
    if (!grouped.has(row.sensorType)) {
      grouped.set(row.sensorType, new Map<string, number>())
    }
    grouped.get(row.sensorType)!.set(intervalLabel, valueAccessor(row))
  }

  const datasets = Array.from(grouped.entries()).map(([sensorType, valuesByLabel]) => ({
    label: sensorType,
    values: labels.map((label) => valuesByLabel.get(label) ?? 0)
  }))

  return { labels, datasets }
}

function aggregateCounts<T>(rows: T[], keySelector: (row: T) => string, countSelector: (row: T) => number) {
  const map = new Map<string, number>()
  for (const row of rows) {
    const key = keySelector(row)
    map.set(key, (map.get(key) ?? 0) + countSelector(row))
  }
  return map
}

export default function AdminMonitoringPage() {
  const { systemMetrics, writePerformance, auditLogs, dataVolume } = useLoaderData() as LoaderData
  const revalidator = useRevalidator()

  const systemThroughputBySensor = buildDatasetsBySensor(systemMetrics, (row) => row.eventsPerSecond)
  const systemLatencyBySensor = buildDatasetsBySensor(systemMetrics, (row) => row.avgLatencyMs)

  const writePerformanceLabels = writePerformance.map((row) => formatInterval(row.interval))
  const totalEvents = writePerformance.reduce((sum, row) => sum + Number(row.totalEvents || 0), 0)
  const avgLatency =
    writePerformance.length > 0
      ? writePerformance.reduce((sum, row) => sum + Number(row.avgLatencyMs || 0), 0) / writePerformance.length
      : 0

  const auditByAction = aggregateCounts(auditLogs, (row) => row.action, (row) => Number(row.count || 0))
  const auditByRole = aggregateCounts(auditLogs, (row) => row.userRole || 'unknown', (row) => Number(row.count || 0))

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Monitoring"
        title="Systemmetriken, Audit-Logs und Datenvolumen"
        description="Die Monitoring-Subpage mappt auf die administrativen Analytics- und Pipeline-Endpunkte des Backends."
        actions={
          <button
            className="button"
            onClick={() => revalidator.revalidate()}
            type="button"
          >
            {revalidator.state === 'loading' ? 'Aktualisiere...' : 'Daten aktualisieren'}
          </button>
        }
      />

      <SectionCard title="Systemmetriken" subtitle="Schreibrate und Latenz nach Sensoren als Zeitreihenansicht.">
        <div className="stats-grid">
          <StatCard label="Messpunkte (Intervall x Sensor)" value={String(systemMetrics.length)} />
          <StatCard label="Erfasste Sensortypen" value={String(new Set(systemMetrics.map((row) => row.sensorType)).size)} />
          <StatCard label="Events im Zeitraum" value={String(totalEvents)} />
          <StatCard label="Durchschn. Latenz" value={`${avgLatency.toFixed(0)} ms`} />
        </div>
        <div className="chart-grid comparison-chart-grid monitoring-chart-grid">
          <ComparisonMetricChart
            title="Events pro Sekunde nach Sensor"
            chartType="line"
            labels={systemThroughputBySensor.labels}
            datasets={systemThroughputBySensor.datasets}
            unit="events/s"
          />
          <ComparisonMetricChart
            title="Durchschnittliche Latenz nach Sensor"
            chartType="line"
            labels={systemLatencyBySensor.labels}
            datasets={systemLatencyBySensor.datasets}
            unit="ms"
          />
        </div>
      </SectionCard>

      <SectionCard title="Write Performance" subtitle="Hilft bei der Bewertung von Time-Series- und Echtzeit-Workloads.">
        <div className="chart-grid monitoring-chart-grid">
          <TimeSeriesChart
            title="Gesamt-Events pro Intervall"
            unit="events"
            points={writePerformance.map((row) => ({ label: formatInterval(row.interval), value: row.totalEvents }))}
            color="#2563eb"
          />
          <ComparisonMetricChart
            title="Latenzprofil (Durchschnitt / Maximum)"
            chartType="bar"
            labels={writePerformanceLabels}
            datasets={[
              { label: 'Durchschnitt', values: writePerformance.map((row) => row.avgLatencyMs) },
              { label: 'Maximum', values: writePerformance.map((row) => row.maxLatencyMs) }
            ]}
            unit="ms"
          />
        </div>
      </SectionCard>

      <SectionCard title="Audit-Logs" subtitle="Administrative Änderungen nachvollziehbar darstellen.">
        <div className="chart-grid monitoring-chart-grid">
          <ComparisonMetricChart
            title="Aktionen nach Typ"
            chartType="horizontalBar"
            labels={Array.from(auditByAction.keys())}
            datasets={[{ label: 'Anzahl', values: Array.from(auditByAction.values()) }]}
          />
          <ComparisonMetricChart
            title="Audit-Einträge nach Rolle"
            chartType="bar"
            labels={Array.from(auditByRole.keys())}
            datasets={[{ label: 'Anzahl', values: Array.from(auditByRole.values()) }]}
          />
        </div>
      </SectionCard>

      <SectionCard title="Datenvolumen pro Sportart" subtitle="Vordefinierte Analyseabfragen für das NoSQL-System.">
        <div className="chart-grid monitoring-chart-grid">
          <ComparisonMetricChart
            title="Sessions und Events pro Sportart"
            chartType="bar"
            labels={dataVolume.map((row) => row.sport)}
            datasets={[
              { label: 'Sessions', values: dataVolume.map((row) => row.sessionCount) },
              { label: 'Events', values: dataVolume.map((row) => row.totalEvents) }
            ]}
          />
          <ComparisonMetricChart
            title="Athletenabdeckung und Event-Dichte"
            chartType="horizontalBar"
            labels={dataVolume.map((row) => row.sport)}
            datasets={[
              { label: 'Unique Athletes', values: dataVolume.map((row) => row.uniqueAthleteCount) },
              { label: 'Avg Events/Session', values: dataVolume.map((row) => row.avgEventsPerSession) }
            ]}
          />
        </div>
      </SectionCard>
    </div>
  )
}

