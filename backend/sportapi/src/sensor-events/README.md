# Sensor Events API

## Scope
- Globaler Prefix: `/api`
- Modul-Routen: root-basiert (`/sensor-events` und `/athletes/:athleteId/sensor-events/...`)
- Auth: Bearer Token erforderlich

## Endpunkte
- `POST /api/sensor-events` - Einzelnes Sensor-Event speichern
- `POST /api/sensor-events/batch` - Mehrere Sensor-Events in einem Request speichern
- `POST /api/sensor-events/simulate` - Sensor-Events serverseitig simulieren und speichern
- `GET /api/athletes/:athleteId/sensor-events/recent` - Letzte Events eines Sportlers abrufen (`limit` optional)

## Hinweise zu Payloads
- `POST /sensor-events`: erwartet Eventdaten inkl. `athleteId`, `sessionId`, `timestamp`, Sensorfeldern
- `POST /sensor-events/batch`: erwartet Liste von Events, i. d. R. unter `events`
- `POST /sensor-events/simulate`: erwartet Simulationsparameter (z. B. `sport`, Sensorauswahl, Anzahl/Intervall)

