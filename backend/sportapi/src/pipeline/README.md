# MongoDB Aggregation Pipelines

Diese Datei enthält vordefinierte MongoDB Aggregation Pipelines für das Sport-Performance Tracking System.

## Übersicht

Die Pipelines sind nach funktionalen und nicht-funktionalen Anforderungen strukturiert und implementieren verschiedene Analysen und Auswertungen für:
- Sportler
- Trainer
- Administratoren

## Verfügbare Funktionen

### 1. Sportlerspezifische Auswertungen

#### `getAthletePerformanceMetrics(db, athleteId, fromDate, toDate)`
**Anforderungen**: F10, NF4, US 6 & 7
- Durchschnittspuls über einen definierten Zeitraum
- Maximalgeschwindigkeit
- Gesamtdistanz
- Trainingshistorie

**Rückgabe**: Aggregierte Metriken für einen Sportler in einem Zeitraum

```typescript
const metrics = await getAthletePerformanceMetrics(
  db,
  'athlete123',
  new Date('2026-01-01'),
  new Date('2026-03-10')
);
```

#### `getTrainingHistory(db, athleteId, limit)`
**Anforderungen**: F10, NF4, US 7, US 16
- Trainingshistorie mit Durchschnittskennzahlen pro Session
- Zeitlich sortiert (neueste zuerst)

**Rückgabe**: Array von Sessions mit aggregierten Sensordaten

```typescript
const history = await getTrainingHistory(db, 'athlete123', 50);
```

#### `getProgressOverTime(db, athleteId, sport, metric, intervalDays)`
**Anforderungen**: F10, US 6 & 7
- Fortschrittsverfolgung über Zeit
- Vergleich von Metriken (speed, heartRate, distance)
- Gruppierung nach konfigurierbaren Intervallen

**Rückgabe**: Zeitbasierte Entwicklung einer Metrik

```typescript
const progress = await getProgressOverTime(
  db,
  'athlete123',
  'running',
  'speed',
  7 // 7-Tage-Intervalle
);
```

### 2. Sportartspezifische Auswertungen

#### `getSportStatistics(db, athleteId, fromDate?, toDate?)`
**Anforderungen**: F10, NF4, US 5
- Statistiken pro Sportart für einen Sportler
- Anzahl Sessions, durchschnittliche Werte

**Rückgabe**: Statistiken gruppiert nach Sportart

```typescript
const sportStats = await getSportStatistics(db, 'athlete123');
```

#### `getDataVolumePerSport(db, fromDate?, toDate?)`
**Anforderungen**: F16, US 12
- Datenvolumen pro Sportart analysieren
- Anzahl Events und Sessions
- Unique Athletes

**Rückgabe**: Datenvolumen-Statistiken pro Sportart

```typescript
const volume = await getDataVolumePerSport(db);
```

### 3. Trainer-Funktionen

#### `compareAthletes(db, athleteIds, sport?, fromDate?, toDate?)`
**Anforderungen**: F17, F22, NF10, US 13, US 19
- Vergleiche zwischen Sportlern
- Frei wählbare Metriken
- Optional nach Sportart gefiltert

**Rückgabe**: Vergleichsübersicht mehrerer Sportler

```typescript
const comparison = await compareAthletes(
  db,
  ['athlete1', 'athlete2', 'athlete3'],
  'running'
);
```

#### `getSessionComparison(db, sessionIds)`
**Anforderungen**: F10, F17, US 17
- Durchschnittliche Leistungsdaten über mehrere Sessions
- Detaillierte Session-Vergleiche

**Rückgabe**: Vergleich der angegebenen Sessions

```typescript
const sessionComp = await getSessionComparison(
  db,
  ['session1', 'session2', 'session3']
);
```

#### `getLiveTrainingOverview(db, athleteIds, lastMinutes)`
**Anforderungen**: F17, NF10, NF2, US 14
- Echtzeit-Leistungsübersicht mehrerer Sportler
- Aktuelle Werte und Durchschnitte
- Datenalter-Tracking

**Rückgabe**: Live-Übersicht aller aktiven Sportler

```typescript
const liveData = await getLiveTrainingOverview(
  db,
  ['athlete1', 'athlete2'],
  5 // letzte 5 Minuten
);
```

#### `getSessionsWithNotes(db, athleteId?, trainerId?, fromDate?, toDate?)`
**Anforderungen**: F21, US 15
- Trainingsnotizen mit Kontext
- Durchsuchen von Sessions mit Notizen

**Rückgabe**: Sessions, die Notizen enthalten

```typescript
const notedSessions = await getSessionsWithNotes(db, 'athlete123');
```

#### `compareTrainingLevels(db, sport, fromDate?, toDate?)`
**Anforderungen**: F10, US 19
- Leistungsvergleich zwischen verschiedenen Trainingslevels
- Gruppiert nach trainingLevel

**Rückgabe**: Vergleich der Leistungen nach Trainingslevel

```typescript
const levelComp = await compareTrainingLevels(db, 'running');
```

#### `getSportLeaderboard(db, sport, metric, fromDate?, toDate?, limit)`
**Anforderungen**: F10, US 19, NF10
- Leistungsranking für eine Sportart
- Basierend auf Metrik (speed, heartRate, distance)

**Rückgabe**: Top-Sportler für die gewählte Metrik

```typescript
const leaderboard = await getSportLeaderboard(
  db,
  'running',
  'speed',
  undefined,
  undefined,
  10
);
```

### 4. Administrator-Funktionen

#### `getSystemMetrics(db, fromDate, toDate, intervalMinutes)`
**Anforderungen**: F14, F16, NF1, NF3, US 8
- Überwachung der Daten-Pipelines
- Schreibrate und Latenz
- Events pro Sekunde

**Rückgabe**: System-Performance-Metriken

```typescript
const metrics = await getSystemMetrics(
  db,
  new Date('2026-03-10T00:00:00'),
  new Date('2026-03-10T23:59:59'),
  5 // 5-Minuten-Intervalle
);
```

#### `getWritePerformanceMetrics(db, fromDate, toDate, groupByMinutes)`
**Anforderungen**: NF1, NF3, US 8, F14
- Performance-Monitoring
- Schreiblast-Analyse
- Latenz-Tracking

**Rückgabe**: Detaillierte Schreibperformance-Metriken

```typescript
const writePerf = await getWritePerformanceMetrics(
  db,
  startDate,
  endDate,
  1 // 1-Minuten-Intervalle
);
```

#### `getAuditLogSummary(db, fromDate, toDate, action?)`
**Anforderungen**: F15, F23, US 11, NF7
- Audit-Logs zusammengefasst
- Rollenbasierte Zugriffskontrolle
- Optional nach Action gefiltert

**Rückgabe**: Audit-Log-Zusammenfassung

```typescript
const auditLogs = await getAuditLogSummary(
  db,
  startDate,
  endDate,
  'CREATE_SESSION'
);
```

#### `getSensorTypeUsageStats(db, fromDate?, toDate?)`
**Anforderungen**: F13, F16, US 9, US 12
- Sensortypen- und Sportarten-Übersicht
- Usage-Statistiken
- Erste und letzte Verwendung

**Rückgabe**: Nutzungsstatistiken pro Sensortyp

```typescript
const sensorStats = await getSensorTypeUsageStats(db);
```

### 5. Erweiterte Analysen

#### `getHeartRateZoneAnalysis(db, sessionId, zones)`
**Anforderungen**: F10
- Herzfrequenz-Zonen Analyse
- Zeit in verschiedenen Belastungszonen
- Basierend auf konfigurierten Zonen

**Rückgabe**: Verteilung der Zeit in HR-Zonen

```typescript
const zones = {
  z1: { min: 90, max: 114 },
  z2: { min: 114, max: 133 },
  z3: { min: 133, max: 152 },
  z4: { min: 152, max: 171 },
  z5: { min: 171, max: 190 }
};
const zoneAnalysis = await getHeartRateZoneAnalysis(db, 'session123', zones);
```

#### `getDetailedSessionAnalysis(db, sessionId)`
**Anforderungen**: F10, NF9, US 3, US 7
- Detaillierte Session-Analyse mit allen Metriken
- Grundlegende Statistiken
- Zeitbasierte Analyse (Minuten-Intervalle)
- Sensor-spezifische Statistiken
- Inkludiert Athleten- und Session-Informationen

**Rückgabe**: Umfassende Session-Analyse mit mehreren Dimensionen

```typescript
const analysis = await getDetailedSessionAnalysis(db, 'session123');
// Enthält: summary, timeSeriesData, bySensorType, session, athlete
```

## Verwendung im Service

Um diese Funktionen in einem NestJS Service zu verwenden:

```typescript
import { Injectable } from '@nestjs/common';
import { MongoService } from '../mongo.service';
import * as AggregationPipelines from '../pipeline/aggregatedData';

@Injectable()
export class AnalyticsService {
  constructor(private readonly mongoService: MongoService) {}

  async getAthleteMetrics(athleteId: string, from: Date, to: Date) {
    const db = this.mongoService.getDb();
    return AggregationPipelines.getAthletePerformanceMetrics(
      db,
      athleteId,
      from,
      to
    );
  }

  async compareMultipleAthletes(athleteIds: string[], sport?: string) {
    const db = this.mongoService.getDb();
    return AggregationPipelines.compareAthletes(
      db,
      athleteIds,
      sport
    );
  }

  // ... weitere Methoden
}
```

## Performance-Hinweise

### Indizes
Stellen Sie sicher, dass folgende Indizes existieren:

```javascript
// sensor_events Collection
db.sensor_events.createIndex({ athleteId: 1, timestamp: 1 });
db.sensor_events.createIndex({ sessionId: 1 });
db.sensor_events.createIndex({ timestamp: 1 });
db.sensor_events.createIndex({ createdAt: 1 });
db.sensor_events.createIndex({ sensorType: 1 });

// training_sessions Collection
db.training_sessions.createIndex({ athleteId: 1, startAt: -1 });
db.training_sessions.createIndex({ sessionId: 1 });
db.training_sessions.createIndex({ sport: 1 });

// athletes Collection
db.athletes.createIndex({ athleteId: 1 });
db.athletes.createIndex({ userId: 1 });
```

### Time-Series Collection
Für optimale Performance sollte `sensor_events` als Time-Series Collection konfiguriert werden:

```javascript
db.createCollection("sensor_events", {
  timeseries: {
    timeField: "timestamp",
    metaField: "athleteId",
    granularity: "seconds"
  }
});
```

## Anforderungs-Mapping

| Funktion | Anforderungen | User Stories |
|----------|---------------|--------------|
| `getAthletePerformanceMetrics` | F10, NF4 | US 6, 7 |
| `getTrainingHistory` | F10, NF4 | US 7, 16 |
| `compareAthletes` | F17, F22, NF10 | US 13, 19 |
| `getSportStatistics` | F10, NF4 | US 5 |
| `getSystemMetrics` | F14, F16, NF1, NF3 | US 8 |
| `getSessionComparison` | F10, F17 | US 17 |
| `getHeartRateZoneAnalysis` | F10 | - |
| `getDataVolumePerSport` | F16 | US 12 |
| `getProgressOverTime` | F10 | US 6, 7 |
| `getLiveTrainingOverview` | F17, NF10, NF2 | US 14 |
| `getAuditLogSummary` | F15, F23, NF7 | US 11 |
| `getSensorTypeUsageStats` | F13, F16 | US 9, 12 |
| `compareTrainingLevels` | F10 | US 19 |
| `getSessionsWithNotes` | F21 | US 15 |
| `getWritePerformanceMetrics` | NF1, NF3, F14 | US 8 |
| `getDetailedSessionAnalysis` | F10, NF9 | US 3, 7 |
| `getSportLeaderboard` | F10, NF10 | US 19 |

## Testing

Beispiel-Tests für die Pipelines:

```typescript
describe('Aggregation Pipelines', () => {
  let db: Db;

  beforeAll(async () => {
    // Setup MongoDB connection
    db = await getTestDatabase();
  });

  it('should get athlete performance metrics', async () => {
    const result = await getAthletePerformanceMetrics(
      db,
      'test-athlete',
      new Date('2026-01-01'),
      new Date('2026-03-01')
    );
    expect(result).toHaveProperty('avgHeartRate');
    expect(result).toHaveProperty('maxSpeed');
  });

  // ... weitere Tests
});
```

