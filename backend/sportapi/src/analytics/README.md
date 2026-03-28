# Analytics API

## Scope
- Globaler Prefix: `/api`
- Modul-Base-Path: `/analytics`
- Auth: Bearer Token erforderlich
- Rollen: Sportler, Trainer, Admin je nach Ressourcenzugriff
- Ressourcenzugriff wird serverseitig über Athlet-/Session-Rechte geprüft (eigene Daten, zugewiesene Trainerdaten, Admin)

## Endpunkte
- `GET /api/analytics/athletes/:athleteId/average-heart-rate` - Durchschnittspuls im Zeitraum (`from`, `to`)
- `GET /api/analytics/sessions/:sessionId/summary` - Session-Zusammenfassung
- `GET /api/analytics/athletes/:athleteId/history` - Session-Historie (`from`, `to` optional)
- `POST /api/analytics/athletes/:athleteId/load-zones/calculate` - Belastungszonen berechnen (`maxHeartRate`, `persist`)
- `GET /api/analytics/athletes/:athleteId/performance-metrics` - Performance-Metriken (`from`, `to` optional)
- `GET /api/analytics/athletes/:athleteId/all-time-stats` - Aggregierte All-Time-Werte
- `GET /api/analytics/athletes/:athleteId/avg-per-session` - Mittelwerte pro Session (`limit`, `sport` optional)
- `GET /api/analytics/athletes/:athleteId/sport-stats` - Kennzahlen je Sportart (`from`, `to` optional)
- `GET /api/analytics/athletes/:athleteId/progress` - Fortschritt über Zeit (`sport`, `metric`, `intervalDays`)
- `GET /api/analytics/athletes/:athleteId/history-enhanced` - Erweiterte Historie (`limit` optional)
- `GET /api/analytics/sessions/:sessionId/detailed` - Detaillierte Session-Analyse
- `GET /api/analytics/sessions/:sessionId/hr-zones` - Herzfrequenzzonen pro Session
- `POST /api/analytics/compare-athletes` - Mehrere Sportler vergleichen (`athleteIds`, `sport`, optional `from`, `to`)
- `POST /api/analytics/compare-sessions` - Mehrere Sessions vergleichen (`sessionIds`), nur wenn alle Sessions abgeschlossen sind (`status=finished`) und denselben `sport` haben
- `POST /api/analytics/live-overview` - Live-Übersicht (`athleteIds`, optional `lastMinutes`)
- `GET /api/analytics/leaderboard` - Rangliste (`sport`, `metric`, optional `limit`, `from`, `to`)
- `GET /api/analytics/compare-training-levels` - Vergleich nach Trainingslevel (`sport`, optional `from`, `to`)
- `GET /api/analytics/sessions-with-notes` - Sessions mit Notizen (`athleteId`, `from`, `to` optional)
