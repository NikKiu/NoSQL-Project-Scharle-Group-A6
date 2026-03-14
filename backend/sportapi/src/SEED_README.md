# 🌱 Seed-Daten für Aggregation Pipeline Tests

## Übersicht

Der erweiterte Seed erstellt **umfangreiche Testdaten** für alle 17 Aggregation Pipelines.

## 📊 Generierte Daten

### Users (7)
- **1 Administrator**: `admin-1`
- **1 Trainer**: `trainer-1`
- **5 Sportler**: `athlete-user-1` bis `athlete-user-5`

### Athletes (5)
Verschiedene Profile mit unterschiedlichen:
- **Trainingslevels**: anfaenger, fortgeschritten, profi
- **Sportarten**: running, cycling, swimming
- **Belastungszonen**: Für realistische HR-Zonen-Analyse

### Training Sessions (~70)
- **Multiple Sportarten**: running, cycling, swimming
- **Zeitraum**: Letzte 3 Monate
- **Status**: finished + 1 aktive Session für Live-Tests
- **Mit/Ohne Notizen**: ~40% haben Trainingsnotizen

### Sensor Events (~14.000-20.000)
- **Realistische Daten**: Warmup, Hauptphase, Cooldown
- **Intervall**: Alle 5 Sekunden
- **Metriken**: Herzfrequenz, Geschwindigkeit, Distanz
- **Verschiedene Sensoren**: heart-rate, gps, power

### Audit Logs (50)
- **Verschiedene Actions**: CREATE_SESSION, UPDATE_ATHLETE, etc.
- **Zeitraum**: Letzte 30 Tage
- **Alle User**: Admin, Trainer, Athletes

## 🚀 Seed ausführen

```bash
cd backend/sportapi
npm run seed
```

### Erwartete Ausgabe
```
🌱 Starting comprehensive seed...
📝 Creating users...
🏃 Creating athletes...
📅 Creating training sessions...
📊 Creating sensor events (this may take a while)...
📊 Inserting ~15000 sensor events...
  Progress: 15000/15000 events
📝 Creating audit logs...

✅ Seed completed successfully!

📊 Data Summary:
   - Users: 7
   - Athletes: 5
   - Training Sessions: ~70
   - Sensor Events: ~15000
   - Audit Logs: 50
```

## 👤 Test User Credentials

### Admin
```
x-user-id: admin-1
x-role: admin
```

### Trainer
```
x-user-id: trainer-1
x-role: trainer
```

### Athletes
```
x-user-id: athlete-user-1  (Alex Meyer - fortgeschritten, running/cycling)
x-user-id: athlete-user-2  (Sarah Schmidt - profi, running/swimming)
x-user-id: athlete-user-3  (Max Müller - anfaenger, cycling/swimming)
x-user-id: athlete-user-4  (Lisa Wagner - fortgeschritten, running/cycling)
x-user-id: athlete-user-5  (Tom Fischer - fortgeschritten, running)
x-role: athlete
```

## 🧪 Test-Szenarien

### 1. Performance-Metriken
```bash
curl -H "x-user-id: athlete-user-1" -H "x-role: athlete" \
  "http://localhost:3000/analytics/athletes/athlete-1/performance-metrics?from=2026-01-01&to=2026-03-10"
```

### 2. Sportler vergleichen
```bash
curl -X POST \
  -H "x-user-id: trainer-1" -H "x-role: trainer" \
  -H "Content-Type: application/json" \
  -d '{"athleteIds":["athlete-1","athlete-2","athlete-4"],"sport":"running"}' \
  "http://localhost:3000/analytics/compare-athletes"
```

### 3. Live-Übersicht (aktive Session!)
```bash
curl -X POST \
  -H "x-user-id: trainer-1" -H "x-role: trainer" \
  -H "Content-Type: application/json" \
  -d '{"athleteIds":["athlete-1"],"lastMinutes":15}' \
  "http://localhost:3000/analytics/live-overview"
```

### 4. Leaderboard
```bash
curl -H "x-user-id: trainer-1" -H "x-role: trainer" \
  "http://localhost:3000/analytics/leaderboard?sport=running&metric=speed&limit=5"
```

### 5. Trainingshistorie (erweitert)
```bash
curl -H "x-user-id: athlete-user-2" -H "x-role: athlete" \
  "http://localhost:3000/analytics/athletes/athlete-2/history-enhanced?limit=10"
```

### 6. Session Details
```bash
curl -H "x-user-id: athlete-user-1" -H "x-role: athlete" \
  "http://localhost:3000/analytics/sessions/session-athlete-1-running-1/detailed"
```

### 7. HR-Zonen Analyse
```bash
# Nur für athlete-1 und athlete-2 (haben loadZones)
curl -H "x-user-id: athlete-user-1" -H "x-role: athlete" \
  "http://localhost:3000/analytics/sessions/session-athlete-1-running-1/hr-zones"
```

### 8. Sport-Statistiken
```bash
curl -H "x-user-id: athlete-user-1" -H "x-role: athlete" \
  "http://localhost:3000/analytics/athletes/athlete-1/sport-stats"
```

### 9. Fortschritt tracken
```bash
curl -H "x-user-id: athlete-user-1" -H "x-role: athlete" \
  "http://localhost:3000/analytics/athletes/athlete-1/progress?sport=running&metric=speed&intervalDays=7"
```

### 10. Sessions mit Notizen
```bash
curl -H "x-user-id: trainer-1" -H "x-role: trainer" \
  "http://localhost:3000/analytics/sessions-with-notes?athleteId=athlete-1"
```

### 11. Training-Level-Vergleich
```bash
curl -H "x-user-id: trainer-1" -H "x-role: trainer" \
  "http://localhost:3000/analytics/compare-training-levels?sport=running"
```

### 12. Sessions vergleichen
```bash
curl -X POST \
  -H "x-user-id: athlete-user-1" -H "x-role: athlete" \
  -H "Content-Type: application/json" \
  -d '{"sessionIds":["session-athlete-1-running-1","session-athlete-1-running-2","session-athlete-1-running-3"]}' \
  "http://localhost:3000/analytics/compare-sessions"
```

## 🛡️ Admin-Endpunkte

### 13. System-Metriken
```bash
curl -H "x-user-id: admin-1" -H "x-role: admin" \
  "http://localhost:3000/admin/system-metrics?from=2026-01-01T00:00:00Z&to=2026-03-10T23:59:59Z&intervalMinutes=60"
```

### 14. Schreib-Performance
```bash
curl -H "x-user-id: admin-1" -H "x-role: admin" \
  "http://localhost:3000/admin/write-performance?from=2026-03-09T00:00:00Z&to=2026-03-10T23:59:59Z&groupByMinutes=5"
```

### 15. Sensortypen-Statistiken
```bash
curl -H "x-user-id: admin-1" -H "x-role: admin" \
  "http://localhost:3000/admin/sensor-types"
```

### 16. Datenvolumen pro Sportart
```bash
curl -H "x-user-id: admin-1" -H "x-role: admin" \
  "http://localhost:3000/admin/data-volume-by-sport"
```

### 17. Audit-Logs
```bash
curl -H "x-user-id: admin-1" -H "x-role: admin" \
  "http://localhost:3000/admin/audit-logs?from=2026-02-01&to=2026-03-10"
```

## 📝 Datenprofil

### Athlete-1 (Alex Meyer)
- **Sessions**: 13 (8x running, 5x cycling)
- **Zeitraum**: Letzte 8 Wochen
- **Besonderheit**: Hat loadZones konfiguriert, 1 aktive Session
- **Ideal für**: HR-Zonen, Performance-Tracking, Live-Overview

### Athlete-2 (Sarah Schmidt)
- **Sessions**: 18 (12x running, 6x swimming)
- **Zeitraum**: Letzte 12 Wochen
- **Level**: Profi
- **Besonderheit**: Meiste Sessions, hat loadZones
- **Ideal für**: Leaderboards, Vergleiche, Fortschritt

### Athlete-3 (Max Müller)
- **Sessions**: 7 (4x cycling, 3x swimming)
- **Zeitraum**: Letzte 4 Wochen
- **Level**: Anfänger
- **Ideal für**: Training-Level-Vergleiche

### Athlete-4 (Lisa Wagner)
- **Sessions**: 17 (10x running, 7x cycling)
- **Zeitraum**: Letzte 10 Wochen
- **Level**: Fortgeschritten
- **Ideal für**: Multi-Sport-Analysen

### Athlete-5 (Tom Fischer)
- **Sessions**: 15 (nur running)
- **Zeitraum**: Letzte 15 Wochen
- **Level**: Fortgeschritten
- **Besonderheit**: Spezialisiert auf eine Sportart
- **Ideal für**: Sport-spezifische Statistiken

## 🎯 Welche Pipeline testet was?

| Pipeline-Funktion | Test-Szenario | Beispiel-IDs |
|-------------------|---------------|--------------|
| `getAthletePerformanceMetrics` | Szenario 1 | athlete-1 |
| `getTrainingHistory` | Szenario 5 | athlete-2 |
| `compareAthletes` | Szenario 2 | athlete-1,2,4 |
| `getSportStatistics` | Szenario 8 | athlete-1 |
| `getSystemMetrics` | Szenario 13 | - |
| `getSessionComparison` | Szenario 12 | sessions von athlete-1 |
| `getHeartRateZoneAnalysis` | Szenario 7 | athlete-1 sessions |
| `getDataVolumePerSport` | Szenario 16 | - |
| `getProgressOverTime` | Szenario 9 | athlete-1 |
| `getLiveTrainingOverview` | Szenario 3 | athlete-1 (aktiv!) |
| `getAuditLogSummary` | Szenario 17 | - |
| `getSensorTypeUsageStats` | Szenario 15 | - |
| `compareTrainingLevels` | Szenario 11 | running |
| `getSessionsWithNotes` | Szenario 10 | athlete-1 |
| `getWritePerformanceMetrics` | Szenario 14 | - |
| `getDetailedSessionAnalysis` | Szenario 6 | session-athlete-1-running-1 |
| `getSportLeaderboard` | Szenario 4 | running |

## 🔄 Seed erneut ausführen

Der Seed verwendet `upsert`, sodass er mehrfach ausgeführt werden kann:
- **Erste Ausführung**: Erstellt alle Daten
- **Weitere Ausführungen**: Aktualisiert bestehende Daten

```bash
# Alles neu erstellen
npm run seed
```

## ⚠️ Hinweise

### Performance
- Seed dauert **30-60 Sekunden** je nach System
- Erstellt **~15.000 Sensor Events**
- Verwendet Batches von 1000 Events

### MongoDB
- Stellen Sie sicher, dass MongoDB läuft
- Default-Connection: `mongodb://localhost:27017`
- Database: Siehe `mongo.service.ts`

### Indizes
Nach dem Seed sollten Sie Indizes erstellen:
```javascript
db.sensor_events.createIndex({ athleteId: 1, timestamp: 1 });
db.sensor_events.createIndex({ sessionId: 1 });
db.training_sessions.createIndex({ athleteId: 1, startAt: -1 });
db.athletes.createIndex({ athleteId: 1 });
```

## 🐛 Troubleshooting

### "Duplicate key error"
Normal bei erneutem Seed - wird ignoriert

### "Connection refused"
MongoDB läuft nicht - starten Sie MongoDB:
```bash
cd backend/database
docker-compose up -d
```

### "Out of memory"
Zu viele Events auf einmal - reduzieren Sie die Event-Anzahl im Seed

## ✅ Erfolgreiche Ausführung

Nach erfolgreichem Seed sollten Sie sehen:
- ✅ Alle Collections erstellt
- ✅ ~15.000 Events eingefügt
- ✅ Testszenarien angezeigt
- ✅ "Database connection closed"

Jetzt können Sie alle 17 Aggregation Pipelines testen! 🎉

