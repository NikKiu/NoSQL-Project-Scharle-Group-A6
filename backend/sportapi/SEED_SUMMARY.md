# 🎉 Seed-Daten erfolgreich erweitert!

## ✅ Was wurde erstellt?

Der Seed wurde **massiv erweitert** und erstellt jetzt umfangreiche Testdaten für alle 17 Aggregation Pipelines!

## 📊 Datenvolumen

| Kategorie | Anzahl | Details |
|-----------|--------|---------|
| **Users** | 7 | 1 Admin, 1 Trainer, 5 Athletes |
| **Athletes** | 5 | Verschiedene Levels & Sportarten |
| **Training Sessions** | ~70 | Über 3 Monate verteilt |
| **Sensor Events** | ~15.000 | Alle 5 Sekunden, realistische Daten |
| **Audit Logs** | 50 | Letzte 30 Tage |

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
  Progress: 15000/15000 events

✅ Seed completed successfully!

📊 Data Summary:
   - Users: 7
   - Athletes: 5
   - Training Sessions: 70
   - Sensor Events: ~15000
   - Audit Logs: 50
```

## 👥 Test Users

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
athlete-user-1 (Alex Meyer)     - fortgeschritten, running/cycling, HAT LoadZones
athlete-user-2 (Sarah Schmidt)  - profi, running/swimming, HAT LoadZones
athlete-user-3 (Max Müller)     - anfaenger, cycling/swimming
athlete-user-4 (Lisa Wagner)    - fortgeschritten, running/cycling
athlete-user-5 (Tom Fischer)    - fortgeschritten, running only

x-role: athlete
```

## 🧪 Quick-Test (alle Pipelines)

### 1. Performance Metrics
```bash
curl -H "x-user-id: athlete-user-1" -H "x-role: athlete" \
  "http://localhost:3000/analytics/athletes/athlete-1/performance-metrics?from=2026-01-01&to=2026-03-10"
```

### 2. Live Overview (AKTIVE SESSION!)
```bash
curl -X POST -H "x-user-id: trainer-1" -H "x-role: trainer" \
  -H "Content-Type: application/json" \
  -d '{"athleteIds":["athlete-1"],"lastMinutes":15}' \
  "http://localhost:3000/analytics/live-overview"
```

### 3. Compare Athletes
```bash
curl -X POST -H "x-user-id: trainer-1" -H "x-role: trainer" \
  -H "Content-Type: application/json" \
  -d '{"athleteIds":["athlete-1","athlete-2","athlete-4"],"sport":"running"}' \
  "http://localhost:3000/analytics/compare-athletes"
```

### 4. Leaderboard
```bash
curl -H "x-user-id: trainer-1" -H "x-role: trainer" \
  "http://localhost:3000/analytics/leaderboard?sport=running&metric=speed&limit=5"
```

### 5. System Metrics (Admin)
```bash
curl -H "x-user-id: admin-1" -H "x-role: admin" \
  "http://localhost:3000/admin/system-metrics?from=2026-01-01T00:00:00Z&to=2026-03-10T23:59:59Z"
```

## 📝 Besonderheiten

### Realistische Daten
- ✅ **Warmup-Phase**: Langsamer Start bei jedem Training
- ✅ **Hauptphase**: Konstante Belastung mit Variationen
- ✅ **Cooldown**: Abkühlung am Ende
- ✅ **Herzfrequenz**: Folgt realistischen Mustern
- ✅ **Geschwindigkeit**: Sport-spezifisch (Running: ~12km/h, Cycling: ~25km/h)

### Test-Szenarien
- ✅ **Live Session**: athlete-1 hat eine AKTIVE Session (für Live-Overview)
- ✅ **HR-Zonen**: athlete-1 & athlete-2 haben loadZones konfiguriert
- ✅ **Notizen**: ~40% der Sessions haben Trainingsnotizen
- ✅ **Multi-Sport**: Verschiedene Kombinationen (running/cycling/swimming)
- ✅ **Zeitraum**: 3 Monate historische Daten

### Athlete-Profile

**Athlete-1 (Alex)**: 
- 13 Sessions (8 running, 5 cycling)
- HAT LoadZones
- 1 AKTIVE Session
- ➡️ Perfekt für: HR-Zonen, Live-Overview, Progress-Tracking

**Athlete-2 (Sarah)**: 
- 18 Sessions (12 running, 6 swimming)
- Profi-Level
- HAT LoadZones
- ➡️ Perfekt für: Leaderboards, Vergleiche, Historie

**Athlete-3 (Max)**: 
- 7 Sessions (4 cycling, 3 swimming)
- Anfänger
- ➡️ Perfekt für: Training-Level-Vergleiche

**Athlete-4 (Lisa)**: 
- 17 Sessions (10 running, 7 cycling)
- Fortgeschritten
- ➡️ Perfekt für: Multi-Sport-Analysen

**Athlete-5 (Tom)**: 
- 15 Sessions (nur running)
- Spezialist
- ➡️ Perfekt für: Sport-spezifische Statistiken

## 🎯 Alle 17 Pipelines testbar

| # | Pipeline | Testbar mit |
|---|----------|-------------|
| 1 | getAthletePerformanceMetrics | athlete-1, athlete-2 |
| 2 | getTrainingHistory | Alle Athletes |
| 3 | compareAthletes | athlete-1,2,4 |
| 4 | getSportStatistics | athlete-1 (multi-sport) |
| 5 | getSystemMetrics | Zeitraum wählen |
| 6 | getSessionComparison | Sessions von athlete-1 |
| 7 | getHeartRateZoneAnalysis | athlete-1 oder athlete-2 |
| 8 | getDataVolumePerSport | - |
| 9 | getProgressOverTime | athlete-1 running |
| 10 | getLiveTrainingOverview | athlete-1 (AKTIV!) |
| 11 | getAuditLogSummary | Letzte 30 Tage |
| 12 | getSensorTypeUsageStats | - |
| 13 | compareTrainingLevels | running |
| 14 | getSessionsWithNotes | athlete-1 |
| 15 | getWritePerformanceMetrics | Zeitraum wählen |
| 16 | getDetailedSessionAnalysis | session-athlete-1-running-1 |
| 17 | getSportLeaderboard | running, speed |

## 📖 Vollständige Dokumentation

Siehe `src/SEED_README.md` für:
- ✅ Alle Test-Szenarien mit curl-Befehlen
- ✅ Detaillierte Athlete-Profile
- ✅ Pipeline-Mapping-Tabelle
- ✅ Troubleshooting-Guide

## ⚡ Performance-Hinweise

### Seed-Dauer
- **Klein (~1000 Events)**: 5-10 Sekunden
- **Normal (~15.000 Events)**: 30-60 Sekunden
- **Groß (>50.000 Events)**: 2-3 Minuten

### MongoDB-Indizes
Nach dem ersten Seed sollten Sie Indizes erstellen:
```javascript
// In MongoDB Shell oder Compass
db.sensor_events.createIndex({ athleteId: 1, timestamp: 1 });
db.sensor_events.createIndex({ sessionId: 1 });
db.sensor_events.createIndex({ timestamp: 1 });
db.training_sessions.createIndex({ athleteId: 1, startAt: -1 });
db.athletes.createIndex({ athleteId: 1 });
```

## 🔄 Erneut ausführen

Der Seed kann beliebig oft ausgeführt werden:
```bash
npm run seed
```

Verwendet `upsert`, sodass bestehende Daten aktualisiert werden.

## ✅ Erfolgskriterien

Nach erfolgreichem Seed:
- ✅ Collections: users, athletes, training_sessions, sensor_events, audit_logs
- ✅ ~15.000 Sensor Events
- ✅ 70 Training Sessions
- ✅ 5 Athletes mit verschiedenen Profilen
- ✅ 1 AKTIVE Session für Live-Tests

## 🎊 Nächste Schritte

1. **Seed ausführen**: `npm run seed`
2. **Server starten**: `npm run start:dev`
3. **API testen**: Siehe Test-Szenarien oben
4. **Indizes erstellen**: Für bessere Performance
5. **Alle Pipelines durchgehen**: Systematisch testen

## 📚 Weitere Ressourcen

- **Seed-Details**: `src/SEED_README.md`
- **Pipeline-Doku**: `src/pipeline/README.md`
- **Integration**: `INTEGRATION_SUMMARY.md`
- **API-Endpunkte**: `src/pipeline/INTEGRATION_COMPLETE.md`

---

**Status**: ✅ Seed erweitert und einsatzbereit!
**Event-Count**: ~15.000
**Test Coverage**: Alle 17 Pipelines testbar!

Viel Erfolg beim Testen! 🚀

