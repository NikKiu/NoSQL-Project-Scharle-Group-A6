# 📊 Aggregation Pipelines – Postman-Testanleitung

Diese Anleitung erklärt, wie du alle Aggregations-Endpunkte mit den Testdaten aus dem Seed testen kannst.

---

## ⚙️ Voraussetzungen

1. **MongoDB läuft** (Docker: `cd backend/database && docker-compose up -d`)
2. **Backend läuft**: `cd backend/sportapi && npm run start:dev`  
   → Der Seed wird automatisch beim Start ausgeführt.
3. **Postman** ist geöffnet.

---

## 🔑 Authentifizierungs-Header

Alle Requests benötigen diese zwei Header:

| Header      | Wert             | Rolle         |
|-------------|------------------|---------------|
| `x-user-id` | `admin-1`        | Administrator |
| `x-role`    | `admin`          |               |
| `x-user-id` | `trainer-1`      | Trainer       |
| `x-role`    | `trainer`        |               |
| `x-user-id` | `athlete-user-1` | Alex Meyer    |
| `x-role`    | `athlete`        |               |
| `x-user-id` | `athlete-user-2` | Sarah Schmidt |
| `x-role`    | `athlete`        |               |

> **Tipp für Postman:** Lege eine Collection-Variable `baseUrl = http://localhost:3000/api` an, dann kannst du `{{baseUrl}}/analytics/...` verwenden.

---

## 👤 Verfügbare Testdaten

### Athleten (mit athleteId)
| athleteId  | Name          | Sportarten             | Level           | loadZones? |
|------------|---------------|------------------------|-----------------|------------|
| athlete-1  | Alex Meyer    | running, cycling       | fortgeschritten | ✅         |
| athlete-2  | Sarah Schmidt | running, swimming      | profi           | ✅         |
| athlete-3  | Max Müller    | cycling, swimming      | anfaenger       | ✅         |
| athlete-4  | Lisa Wagner   | running, cycling       | fortgeschritten | ✅         |
| athlete-5  | Tom Fischer   | running                | fortgeschritten | ✅         |

### Sessions (Auswahl)
| sessionId                      | Sportler  | Sport    |
|-------------------------------|-----------|----------|
| session-athlete-1-running-1   | athlete-1 | running  |
| session-athlete-1-running-2   | athlete-1 | running  |
| session-athlete-1-cycling-1   | athlete-1 | cycling  |
| session-athlete-2-running-1   | athlete-2 | running  |
| session-athlete-2-swimming-1  | athlete-2 | swimming |
| session-live-1                | athlete-1 | running  | ← aktive Session

---

## 🚀 Endpunkte – Schritt für Schritt

---

### 1️⃣ All-Time Stats (einfachster Einstieg)

**Was:** Gesamtstatistik eines Sportlers über alle Trainingseinheiten – kein Datum nötig.  
**Anforderung:** F10, NF4, US 7

```
GET http://localhost:3000/api/analytics/athletes/athlete-1/all-time-stats
```
**Headers:**
```
x-user-id: athlete-user-1
x-role: athlete
```

**Erwartete Antwort:**
```json
{
  "athleteId": "athlete-1",
  "avgHeartRate": 148.2,
  "minHeartRate": 110,
  "maxHeartRate": 185,
  "avgSpeed": 14.3,
  "maxSpeed": 18.9,
  "totalDistanceM": 241350.5,
  "totalDistanceKm": 241.35,
  "totalEvents": 12480,
  "sessionCount": 13
}
```

> **Tipp:** Mit Admin- oder Trainer-Header kann man auf beliebige athleteIds zugreifen.  
> Mit `x-role: athlete` nur auf die eigene athleteId.

---

### 2️⃣ Ø-Kennzahlen pro Session

**Was:** Durchschnittswerte (Herzfrequenz, Speed, Distanz) für jede Trainingseinheit einzeln.  
**Anforderung:** NF4, NF9, US 7, US 16 (Trainer)

```
GET http://localhost:3000/api/analytics/athletes/athlete-1/avg-per-session
GET http://localhost:3000/api/analytics/athletes/athlete-1/avg-per-session?sport=running&limit=5
GET http://localhost:3000/api/analytics/athletes/athlete-2/avg-per-session?sport=swimming
```

**Erwartete Antwort (ein Element):**
```json
{
  "sessionId": "session-athlete-1-running-1",
  "sport": "running",
  "startAt": "2026-01-17T07:30:00.000Z",
  "endAt":   "2026-01-17T08:45:00.000Z",
  "avgHeartRate":    147.8,
  "maxHeartRate":    183,
  "minHeartRate":    118,
  "avgSpeed":         12.4,
  "maxSpeed":         15.1,
  "totalDistanceM":  16200.0,
  "totalDistanceKm":  16.2,
  "eventCount":       780,
  "durationMinutes":  75.0
}
```

---

### 3️⃣ Performance-Metriken (mit optionalem Zeitraum)

**Was:** Aggregation aller Metriken, optional auf Zeitraum eingeschränkt.  
**Anforderung:** F10, NF4, US 6 & 7

```
# Ohne Datum – alle Daten
GET http://localhost:3000/api/analytics/athletes/athlete-2/performance-metrics

# Mit Datumsbereich
GET http://localhost:3000/api/analytics/athletes/athlete-2/performance-metrics?from=2025-11-01&to=2026-03-14
```

---

### 4️⃣ Sportart-Statistiken

**Was:** Aggregierte Kennzahlen aufgeteilt nach Sportart (z. B. Laufen vs. Radfahren).  
**Anforderung:** F10, NF4, US 5

```
GET http://localhost:3000/api/analytics/athletes/athlete-1/sport-stats
GET http://localhost:3000/api/analytics/athletes/athlete-2/sport-stats
```

**Erwartete Antwort:**
```json
[
  {
    "sport": "running",
    "sessionCount": 8,
    "totalEvents": 6240,
    "avgHeartRate": 148.3,
    "maxHeartRate": 185,
    "avgSpeed": 12.1,
    "maxSpeed": 15.8,
    "totalDistanceM": 136500.0,
    "totalDistanceKm": 136.5
  },
  {
    "sport": "cycling",
    "sessionCount": 5,
    ...
  }
]
```

---

### 5️⃣ Trainingshistorie (letzte N Sessions)

**Was:** Alle Sessions eines Sportlers mit Durchschnittswerten, neuste zuerst.  
**Anforderung:** F10, NF4, US 7, US 16

```
GET http://localhost:3000/api/analytics/athletes/athlete-2/history-enhanced?limit=10
GET http://localhost:3000/api/analytics/athletes/athlete-5/history-enhanced?limit=15
```

---

### 6️⃣ Session-Detailanalyse

**Was:** Tiefgehende Analyse einer einzelnen Session inkl. Zeitreihe (Minuten-Intervalle).  
**Anforderung:** F10, NF9, US 3, US 7

```
GET http://localhost:3000/api/analytics/sessions/session-athlete-1-running-1/detailed
GET http://localhost:3000/api/analytics/sessions/session-athlete-2-swimming-1/detailed
```

**Antwort enthält:**
- `summary`: Gesamtstatistik der Session
- `timeSeriesData`: Durchschnittswerte pro Minute
- `bySensorType`: Aufschlüsselung nach Sensortyp (heart-rate / gps / power)

---

### 7️⃣ Herzfrequenz-Zonen-Analyse

**Was:** Zeigt in welcher Belastungszone (Z1–Z5) sich der Sportler wie viel Zeit befunden hat.  
**Anforderung:** F10, US 7  
**Alle 5 Athleten haben jetzt loadZones konfiguriert.**

```
GET http://localhost:3000/api/analytics/sessions/session-athlete-1-running-1/hr-zones
GET http://localhost:3000/api/analytics/sessions/session-athlete-2-running-1/hr-zones
GET http://localhost:3000/api/analytics/sessions/session-athlete-4-running-1/hr-zones
GET http://localhost:3000/api/analytics/sessions/session-athlete-5-running-1/hr-zones
GET http://localhost:3000/api/analytics/sessions/session-athlete-3-cycling-1/hr-zones
```

**Erwartete Antwort:**
```json
[
  {
    "lowerBoundary": 0,
    "zone": "Ruhe (< Z1)",
    "hrRange": "< 95 bpm",
    "sampleCount": 45,
    "avgHeartRate": 82,
    "minHeartRate": 70,
    "maxHeartRate": 94
  },
  {
    "lowerBoundary": 95,
    "zone": "Z1 - Regeneration",
    "hrRange": "95–114 bpm",
    "sampleCount": 120,
    "avgHeartRate": 106
  },
  {
    "lowerBoundary": 114,
    "zone": "Z2 - Grundlagenausdauer",
    "hrRange": "114–133 bpm",
    "sampleCount": 210,
    "avgHeartRate": 122
  },
  ...
]
```


---

### 8️⃣ Fortschrittsverfolgung (Progress über Zeit)

**Was:** Entwicklung einer Metrik (speed / heartRate / distance) über Zeitintervalle.  
**Anforderung:** F10, US 6 & 7

```
# Speed-Entwicklung wöchentlich (Laufen)
GET http://localhost:3000/api/analytics/athletes/athlete-1/progress?sport=running&metric=speed&intervalDays=7

# Herzfrequenz-Entwicklung wöchentlich
GET http://localhost:3000/api/analytics/athletes/athlete-1/progress?sport=running&metric=heartRate&intervalDays=7

# Distanz-Entwicklung (2-Wochen-Blöcke)
GET http://localhost:3000/api/analytics/athletes/athlete-5/progress?sport=running&metric=distance&intervalDays=14
```

---

### 9️⃣ Durchschnittlicher Herzfrequenz-Wert (einfach)

**Was:** Einfache Durchschnittspuls-Abfrage über einen Zeitraum.  
**Anforderung:** F10, NF4

```
GET http://localhost:3000/api/analytics/athletes/athlete-1/average-heart-rate?from=2025-11-01&to=2026-03-14
```

---

### 🔟 Sportler vergleichen (Trainer-Sicht)

**Was:** Vergleich mehrerer Sportler anhand ihrer Durchschnittswerte.  
**Anforderung:** F17, F22, NF10, US 13, US 19  
**Benötigt:** `x-role: trainer` oder `x-role: admin`

```
POST http://localhost:3000/api/analytics/compare-athletes
```
**Body:**
```json
{
  "athleteIds": ["athlete-1", "athlete-2", "athlete-4"],
  "sport": "running"
}
```

Ohne Sport-Filter (alle Sportarten):
```json
{
  "athleteIds": ["athlete-1", "athlete-2", "athlete-3", "athlete-4", "athlete-5"]
}
```

---

### 1️⃣1️⃣ Sessions vergleichen

**Was:** Direkte Gegenüberstellung mehrerer Trainingseinheiten.  
**Anforderung:** F10, F17, US 17

```
POST http://localhost:3000/api/analytics/compare-sessions
```
**Body:**
```json
{
  "sessionIds": [
    "session-athlete-1-running-1",
    "session-athlete-1-running-2",
    "session-athlete-1-running-3"
  ]
}
```

---

### 1️⃣2️⃣ Leaderboard

**Was:** Ranking aller Sportler nach einer Metrik in einer Sportart.  
**Anforderung:** F10, NF10, US 19  
**Benötigt:** `x-role: trainer` oder `x-role: admin`

```
# Top-5 nach Höchstgeschwindigkeit (Laufen)
GET http://localhost:3000/api/analytics/leaderboard?sport=running&metric=speed&limit=5

# Top-5 nach Gesamtdistanz (Radfahren)
GET http://localhost:3000/api/analytics/leaderboard?sport=cycling&metric=distance&limit=5

# Top-5 nach Herzfrequenz (Swimming)
GET http://localhost:3000/api/analytics/leaderboard?sport=swimming&metric=heartRate&limit=5
```

---

### 1️⃣3️⃣ Trainingslevels vergleichen

**Was:** Aggregierte Metriken gruppiert nach Trainingslevel (anfaenger / fortgeschritten / profi).  
**Anforderung:** F10, US 19

```
GET http://localhost:3000/api/analytics/compare-training-levels?sport=running
GET http://localhost:3000/api/analytics/compare-training-levels?sport=cycling
```

---

### 1️⃣4️⃣ Live-Übersicht (Echtzeit)

**Was:** Aktuelle Werte aktiver Sessions der letzten N Minuten.  
**Anforderung:** F17, F18, NF2, US 14  
**Hinweis:** `session-live-1` (athlete-1) ist eine aktive Session mit Events aus den letzten ~10 Minuten.

```
POST http://localhost:3000/api/analytics/live-overview
```
**Body:**
```json
{
  "athleteIds": ["athlete-1"],
  "lastMinutes": 15
}
```

---

### 1️⃣5️⃣ Sessions mit Notizen

**Was:** Alle Sessions mit Trainer-Notizen.  
**Anforderung:** F21, US 15

```
GET http://localhost:3000/api/analytics/sessions-with-notes?athleteId=athlete-1
GET http://localhost:3000/api/analytics/sessions-with-notes
```

---

## 🔧 Admin-Endpunkte

> Alle benötigen: `x-user-id: admin-1` und `x-role: admin`  
> Mit anderen Rollen → `403 Forbidden`

### Alle Nutzer anzeigen (F12, US 10)
```
GET http://localhost:3000/api/admin/users
GET http://localhost:3000/api/admin/users?role=trainer
GET http://localhost:3000/api/admin/users?role=athlete
```

### System-Metriken (Schreibrate, Latenz)
```
GET http://localhost:3000/api/admin/system-metrics?from=2025-11-01T00:00:00Z&to=2026-03-14T23:59:59Z
```

### Schreibleistungs-Analyse
```
GET http://localhost:3000/api/admin/write-performance?from=2025-11-01T00:00:00Z&to=2026-03-14T23:59:59Z
```

### Datenvolumen pro Sportart
```
GET http://localhost:3000/api/admin/data-volume-by-sport
```

### Sensor-Typen Übersicht
```
GET http://localhost:3000/api/admin/sensor-types
```

### Audit-Logs
```
GET http://localhost:3000/api/admin/audit-logs?from=2026-01-01&to=2026-03-14
```


---

## 📋 Empfohlene Testreihenfolge in Postman

1. `GET /api/analytics/athletes/athlete-1/all-time-stats` → Grundtest ohne Parameter
2. `GET /api/analytics/athletes/athlete-1/avg-per-session?sport=running` → Pro-Session-Werte
3. `GET /api/analytics/athletes/athlete-1/sport-stats` → Sportart-Vergleich
4. `GET /api/analytics/sessions/session-athlete-1-running-1/detailed` → Session-Detail
5. `GET /api/analytics/sessions/session-athlete-1-running-1/hr-zones` → Belastungszonen
6. `POST /api/analytics/compare-athletes` → Sportler vergleichen
7. `GET /api/analytics/leaderboard?sport=running&metric=speed` → Ranking
8. `GET /api/analytics/athletes/athlete-1/progress?sport=running&metric=speed&intervalDays=7` → Fortschritt

---

## ❌ Häufige Fehlerquellen

| Fehler | Ursache | Lösung |
|--------|---------|--------|
| `400 Missing headers` | Header fehlen | `x-user-id` und `x-role` in Postman setzen |
| `403 Forbidden` | Sportler fragt anderen Sportler ab / kein Admin | Admin- oder Trainer-Header verwenden |
| `403 Forbidden` (Admin-Endpoints) | Kein Admin-Header | `x-role: admin` + `x-user-id: admin-1` |
| `400 Bad Request: Invalid from` | Ungültiges Datumsformat | ISO-Format: `2026-01-01` oder `2026-03-14T00:00:00Z` |
| `400 to must be after from` | `to` liegt vor `from` | Datumreihenfolge prüfen |
| `404 Session not found` | falsche sessionId | Session-IDs aus der Tabelle oben verwenden |
| `404 Athlete not found` | falsche athleteId | athleteIds: `athlete-1` bis `athlete-5` |
| Leere Antwort `[]` | Datumsbereich passt nicht | Bereich prüfen: Daten reichen bis Nov 2025 zurück |
| `live-overview` leer | Events zu alt (> `lastMinutes`) | Server neu starten (Seed erstellt frische Events) |

---

## 🗂 Beschreibung der Pipeline-Funktionen

| Funktion | Endpunkt | Methode | Collection | Schlüsseloperatoren | Beschreibung |
|----------|----------|---------|------------|---------------------|--------------|
| `getAthleteAllTimeStats` | `/api/analytics/athletes/:id/all-time-stats` | GET | sensor_events | `$group`, `$project` | Gesamt-Ø ohne Datumsfilter |
| `getAverageMetricsPerSession` | `/api/analytics/athletes/:id/avg-per-session` | GET | sensor_events | `$group`, `$lookup`, `$unwind` | Ø pro Session; Query: `sport?`, `limit?` |
| `getAthletePerformanceMetrics` | `/api/analytics/athletes/:id/performance-metrics` | GET | sensor_events | `$match`, `$group` | Ø mit optionalem Zeitraum; Query: `from?`, `to?` |
| `getSportStatistics` | `/api/analytics/athletes/:id/sport-stats` | GET | training_sessions | `$lookup`, `$unwind`, `$group` | Ø pro Sportart; Query: `from?`, `to?` |
| `getTrainingHistory` | `/api/analytics/athletes/:id/history-enhanced` | GET | training_sessions | `$lookup`, `$addFields` | Alle Sessions mit Metriken; Query: `limit?` |
| `averageHeartRate` | `/api/analytics/athletes/:id/average-heart-rate` | GET | sensor_events | `$match`, `$group` | Einfacher Ø-Puls; Query: `from`, `to` (Pflicht) |
| `sessionSummary` | `/api/analytics/sessions/:id/summary` | GET | sensor_events | `$match`, `$group` | Session-Kurzfassung |
| `getDetailedSessionAnalysis` | `/api/analytics/sessions/:id/detailed` | GET | sensor_events | `$facet`, `$group` | Zeitreihe + Sensortypen pro Session |
| `getHeartRateZoneAnalysis` | `/api/analytics/sessions/:id/hr-zones` | GET | sensor_events | `$bucket`, `$switch` | Zeit in Z1–Z5 (loadZones erforderlich) |
| `getProgressOverTime` | `/api/analytics/athletes/:id/progress` | GET | training_sessions | `$lookup`, `$unwind`, `$group` | Metrik-Entwicklung; Query: `sport`, `metric`, `intervalDays?` |
| `compareAthletes` | `/api/analytics/compare-athletes` | POST | sensor_events | `$lookup`, `$group`, `$sort` | Sportler vergleichen; Body: `athleteIds[]`, `sport?` |
| `getSessionComparison` | `/api/analytics/compare-sessions` | POST | sensor_events | `$lookup`, `$unwind` | Sessions direkt vergleichen; Body: `sessionIds[]` |
| `getLiveTrainingOverview` | `/api/analytics/live-overview` | POST | sensor_events | `$match(timestamp≥now-N)`, `$group` | Echtzeit-Übersicht; Body: `athleteIds[]`, `lastMinutes?` |
| `getSportLeaderboard` | `/api/analytics/leaderboard` | GET | training_sessions | `$lookup`, `$unwind`, `$group` | Ranking; Query: `sport`, `metric`, `limit?`, `from?`, `to?` |
| `compareTrainingLevels` | `/api/analytics/compare-training-levels` | GET | training_sessions | `$lookup`, `$unwind`, `$group` | Level-Vergleich; Query: `sport`, `from?`, `to?` |
| `getSessionsWithNotes` | `/api/analytics/sessions-with-notes` | GET | training_sessions | `$match`, `$lookup` | Sessions mit Notizen; Query: `athleteId?`, `from?`, `to?` |
| `calculateLoadZones` | `/api/analytics/athletes/:id/load-zones/calculate` | POST | athletes | — | Belastungszonen berechnen; Body: `maxHeartRate`, `persist?` |
| `getAthleteHistory` | `/api/analytics/athletes/:id/history` | GET | training_sessions | `$find`, `$sort` | Einfache Sessionliste; Query: `from?`, `to?` |
| `getSystemMetrics` | `/api/admin/system-metrics` | GET | sensor_events | `$group(interval)`, `$project` | Schreibrate/Latenz; Query: `from`, `to`, `intervalMinutes?` |
| `getWritePerformanceMetrics` | `/api/admin/write-performance` | GET | sensor_events | `$group`, `$project` | Schreib-Performance; Query: `from`, `to`, `groupByMinutes?` |
| `getSensorTypeUsageStats` | `/api/admin/sensor-types` | GET | sensor_events | `$group`, `$project` | Sensortypen-Übersicht; Query: `from?`, `to?` |
| `getDataVolumePerSport` | `/api/admin/data-volume-by-sport` | GET | training_sessions | `$lookup`, `$group` | Datenvolumen; Query: `from?`, `to?` |
| `getAuditLogSummary` | `/api/admin/audit-logs` | GET | audit_logs | `$match`, `$group`, `$lookup` | Audit-Logs; Query: `from`, `to`, `action?` |
| — | `/api/admin/users` | GET | users | `$find` | Alle Nutzer; Query: `role?` |

