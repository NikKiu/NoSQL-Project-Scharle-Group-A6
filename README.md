# NoSQL Sporttracking (A6)

Dieses Projekt implementiert ein Echtzeit-Sporttracking-System mit:

- `backend/sportapi`: NestJS API mit MongoDB
- `Frontend/a6`: React/Vite Frontend mit rollenbasierten Dashboards

## Rollen und Auth

Es gibt drei Rollen:

- `athlete` (Sportler)
- `trainer`
- `admin`

Die API unterstuetzt zwei Auth-Modi:

1. **Login/Register API** (`/api/auth/login`, `/api/auth/register`) -> liefert `auth.userId` + `auth.role`.
2. **Header-Auth (Legacy)** mit `x-user-id` und `x-role`.

## Kernfunktionen

- **Sportler-Dashboard**
  - Trainingshistorie laden
  - Neues Training starten (Sportart + Sensoren waehlen)
  - Live-Simulation mit laufender Datenuebertragung (`sensor-events`)
  - Aggregierte Live-KPIs (Avg HR, Max Speed, Distanz)
  - Pause, Fortsetzen, Beenden

- **Trainer-Dashboard**
  - Athletenliste
  - Sessions eines Athleten einsehen
  - Athletenvergleich via Analytics API

- **Admin-Dashboard**
  - Nutzerliste aus der DB
  - Nutzer anlegen
  - Sensortypen einsehen und erweitern

## MongoDB / NoSQL Validierung

Die Architektur passt zu einem NoSQL-Time-Series-Workload:

- hochfrequente, append-only Sensor-Events
- zeitbasierte Abfragen und Aggregationen
- heterogene Messwerte je Sensor/Sportart

### Umgesetzte technische Punkte

- **Indexstrategie** in `backend/sportapi/src/mongo.service.ts`
  - `sensor_events`: `athleteId+timestamp`, `sessionId+timestamp`, `sessionId+sensorType+timestamp`
  - `training_sessions`: `athleteId+startAt`
  - `users.email` und `users.userId` unique
  - `sensor_types.sensorType` unique

- **TTL/Retention (konfigurierbar)**
  - `SENSOR_EVENTS_RETENTION_SECONDS`
  - `AUDIT_LOG_RETENTION_SECONDS`

- **Optionale Time-Series Collection**
  - aktivierbar mit `USE_MONGODB_TIME_SERIES=true`
  - `sensor_events` kann als native Time-Series Collection erzeugt werden (nur fuer neue DBs)

- **Analytics in der DB**
  - Aggregation Pipelines fuer Historie, Session-Analysen, Vergleiche und Leaderboards

## Seed-Daten

`backend/sportapi/src/seed.ts` erstellt:

- Nutzer inkl. Passwort-Hash
- Athleten
- Training Sessions
- Sensor Events
- Audit Logs
- Sensor Types

Beispiel-Logins:

- `admin@sport.local / admin123`
- `trainer@sport.local / trainer123`
- `alex@sport.local / athlete123`

## Schnellstart

```powershell
cd backend/sportapi
npm install
npm run seed
npm run start
```

```powershell
cd Frontend/a6
npm install
npm run dev
```

Hinweis: Frontend erwartet standardmaessig API unter `/api`. Optional kann `VITE_API_BASE_URL` gesetzt werden.
