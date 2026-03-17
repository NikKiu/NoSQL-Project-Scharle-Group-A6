# Echtzeit-Sporttracking-System — Getting Started

Dieses Projekt besteht aus drei Teilen, die zusammen das vollständige System bilden:

| Teil        | Pfad               | Technologie                  |
|-------------|--------------------|------------------------------|
| Datenbank   | `backend/database` | MongoDB 7 via Docker         |
| Backend API | `backend/sportapi` | NestJS (Node.js)             |
| Frontend    | `Frontend/a6`      | React 19 + Vite + TypeScript |

---

## Voraussetzungen

| Tool                                                              | Version | Zweck                   |
|-------------------------------------------------------------------|---------|-------------------------|
| [Node.js](https://nodejs.org)                                     | 20 LTS+ | Backend & Frontend      |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | aktuell | MongoDB lokal betreiben |

> **Windows / PowerShell:** Falls `npm` durch die Execution Policy gesperrt ist, ersetze `npm` überall durch `npm.cmd`.

---

## Schritt 1 — MongoDB starten

Im Ordner `backend/database`:

```powershell
cd backend/database
docker compose up -d
```

Status prüfen:

```powershell
docker compose ps
```

MongoDB ist erreichbar unter: `mongodb://localhost:27017`  
Datenbankname: `sport_performance`

Zum Stoppen:

```powershell
docker compose down
```

> **Daten löschen** (vollständiger Reset):
> ```powershell
> docker compose down -v
> ```

---

## Schritt 2 — Backend installieren & starten

### 2a) Abhängigkeiten installieren

Im Ordner `backend`:

```powershell
cd backend
npm install
```

### 2b) API starten

Im Ordner `backend/sportapi`:
```powershell
cd backend/sportapi
npm run start:dev
```

> `start:dev` führt beim ersten Start automatisch `npm run seed` aus und legt Seed-Daten in der DB an.

Die API ist dann erreichbar unter:

- Basis-URL: `http://localhost:3000/api`
- Healthcheck: `GET http://localhost:3000/api/health`

### 2c) Nur Seed-Daten laden (ohne API-Start)

```powershell
npm run seed
```

---

## Schritt 3 — Frontend installieren & starten

Im Ordner `Frontend/a6`:

```powershell
cd Frontend/a6
npm install
npm run dev
```

Das Frontend ist erreichbar unter: `http://localhost:5173`

> Das Frontend proxied automatisch alle `/api`-Anfragen an `http://localhost:3000` (konfiguriert in `vite.config.ts`).  
> Es ist **keine** separate Proxy-Konfiguration notwendig.

---

## Startsequenz (Kurzform)

```powershell
# Terminal 1 — MongoDB
cd backend/database
docker compose up -d

# Terminal 2 — Backend
cd backend
npm install

# Terminal 3 — API starten (inkl. Seed)
cd backend/sportapi
npm run start:dev

# Terminal 4 — Frontend
cd Frontend/a6
npm install
npm run dev
```

---

## Test-Logins

Nach dem Seed-Lauf stehen folgende Benutzer sofort zur Verfügung:

| Rolle    | E-Mail                | Passwort     | Bereich                                             |
|----------|-----------------------|--------------|-----------------------------------------------------|
| Admin    | `admin@sport.local`   | `admin123`   | Nutzerverwaltung, Sensoren, Monitoring, Zuordnungen |
| Trainer  | `trainer@sport.local` | `trainer123` | Athletenliste, Sessions, Vergleich                  |
| Sportler | `alex@sport.local`    | `athlete123` | Training, Historie, Profil                          |
| Sportler | `sarah@sport.local`   | `athlete123` | Training, Historie, Profil                          |
| Sportler | `max@sport.local`     | `athlete123` | Training, Historie, Profil                          |
| Sportler | `lisa@sport.local`    | `athlete123` | Training, Historie, Profil                          |
| Sportler | `tom@sport.local`     | `athlete123` | Training, Historie, Profil                          |

---

## Projektstruktur

```
NoSQL-Project-Scharle-Group-A6/
├── backend/
│   ├── database/
│   │   └── docker-compose.yml        ← MongoDB
│   └── sportapi/
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── mongo.service.ts      ← Indizes, TTL, Time-Series
│       │   ├── seed.ts               ← Seed-Daten
│       │   ├── admin/                ← Admin-Endpunkte
│       │   ├── analytics/            ← Aggregation Pipelines
│       │   ├── athletes/             ← Athleten-CRUD
│       │   ├── auth/                 ← Login / Register
│       │   ├── pipeline/
│       │   │   └── aggregatedData.ts ← 15+ Aggregation-Funktionen
│       │   ├── sensor-events/        ← Sensor-Daten (Einzel + Batch)
│       │   └── sessions/             ← Trainingseinheiten
│       └── package.json
├── Frontend/
│   └── a6/
│       ├── src/
│       │   ├── pages/
│       │   │   ├── athlete/          ← Sportler-Bereich
│       │   │   ├── trainer/          ← Trainer-Bereich
│       │   │   └── admin/            ← Admin-Bereich
│       │   ├── services/             ← Typisierte API-Aufrufe je Modul
│       │   ├── routes/
│       │   │   ├── router.tsx        ← React Router Konfiguration
│       │   │   └── loaders.ts        ← Daten-Loader je Route
│       │   └── components/ui/        ← Wiederverwendbare UI-Komponenten
│       └── vite.config.ts            ← Proxy-Konfiguration
├── Dokumentation der Umsetzung.md   ← Technische Projektdokumentation
└── README.md                        ← Diese Datei
```

---

## API-Übersicht

### Authentifizierung

| Methode | Pfad                 | Beschreibung       |
|---------|----------------------|--------------------|
| `POST`  | `/api/auth/register` | Registrierung      |
| `POST`  | `/api/auth/login`    | Login              |
| `GET`   | `/api/auth/me`       | Eigene Nutzerdaten |

### Athleten

| Methode  | Pfad                                     | Beschreibung            |
|----------|------------------------------------------|-------------------------|
| `GET`    | `/api/athletes`                          | Alle Athleten           |
| `POST`   | `/api/athletes`                          | Neues Athletenprofil    |
| `GET`    | `/api/athletes/:id`                      | Profil abrufen          |
| `PATCH`  | `/api/athletes/:id`                      | Profil aktualisieren    |
| `DELETE` | `/api/athletes/:id`                      | Profil löschen          |
| `GET`    | `/api/athletes/:id/sessions`             | Sessions eines Athleten |
| `GET`    | `/api/athletes/:id/sensor-events/recent` | Letzte Sensor-Events    |

### Sessions

| Methode | Pfad                       | Beschreibung                          |
|---------|----------------------------|---------------------------------------|
| `POST`  | `/api/sessions`            | Training starten                      |
| `GET`   | `/api/sessions/:id`        | Session abrufen                       |
| `PATCH` | `/api/sessions/:id/finish` | Training beenden                      |
| `PATCH` | `/api/sessions/:id`        | Session aktualisieren (z. B. Notizen) |

### Sensor-Events

| Methode | Pfad                       | Beschreibung                    |
|---------|----------------------------|---------------------------------|
| `POST`  | `/api/sensor-events`       | Einzelner Messpunkt             |
| `POST`  | `/api/sensor-events/batch` | Batch-Ingest (bis 5.000 Events) |

### Analytics

| Methode | Pfad                                              | Beschreibung                             |
|---------|---------------------------------------------------|------------------------------------------|
| `GET`   | `/api/analytics/athletes/:id/all-time-stats`      | Gesamtstatistik                          |
| `GET`   | `/api/analytics/athletes/:id/history-enhanced`    | Trainingshistorie                        |
| `GET`   | `/api/analytics/athletes/:id/avg-per-session`     | Ø-Werte je Session                       |
| `GET`   | `/api/analytics/athletes/:id/sport-stats`         | Statistik nach Sportart                  |
| `GET`   | `/api/analytics/athletes/:id/performance-metrics` | Leistungsmetriken                        |
| `GET`   | `/api/analytics/sessions/:id/summary`             | Session-Zusammenfassung                  |
| `GET`   | `/api/analytics/sessions/:id/detailed`            | Detailanalyse (Zeitreihe, GPS, HR-Zonen) |
| `GET`   | `/api/analytics/sessions/:id/hr-zones`            | Herzfrequenz-Zonen                       |
| `POST`  | `/api/analytics/compare-athletes`                 | Athletenvergleich                        |
| `POST`  | `/api/analytics/live-overview`                    | Echtzeit-Übersicht                       |
| `GET`   | `/api/analytics/leaderboard`                      | Bestenliste                              |

### Admin

| Methode | Pfad                               | Beschreibung                    |
|---------|------------------------------------|---------------------------------|
| `GET`   | `/api/admin/users`                 | Alle Nutzer                     |
| `POST`  | `/api/admin/users`                 | Nutzer anlegen                  |
| `GET`   | `/api/admin/sensor-catalog`        | Sensor-Katalog                  |
| `POST`  | `/api/admin/sensor-types`          | Sensortyp anlegen/aktualisieren |
| `GET`   | `/api/admin/system-metrics`        | Systemmetriken                  |
| `GET`   | `/api/admin/write-performance`     | Schreibleistung                 |
| `GET`   | `/api/admin/audit-logs`            | Audit-Logs                      |
| `GET`   | `/api/admin/data-volume-by-sport`  | Datenvolumen nach Sportart      |
| `GET`   | `/api/admin/trainer-assignments`   | Trainer-Sportler-Zuordnungen    |
| `PATCH` | `/api/admin/trainers/:id/athletes` | Zuordnung bearbeiten            |

---

## MongoDB Compass (optional)

Für direkte DB-Inspektion:

- Verbindungsstring: `mongodb://localhost:27017`
- Datenbank: `sport_performance`
- Collections: `users`, `athletes`, `training_sessions`, `sensor_events`, `sensor_types`, `audit_logs`

---

## Umgebungsvariablen (Backend)

Die folgenden Variablen können in `backend/sportapi/.env` gesetzt werden (alle optional, Defaults sind entwicklungstauglich):

| Variable                          | Default                     | Beschreibung                                                |
|-----------------------------------|-----------------------------|-------------------------------------------------------------|
| `MONGODB_URI`                     | `mongodb://127.0.0.1:27017` | MongoDB-Verbindungsstring                                   |
| `MONGODB_DB_NAME`                 | `sport_performance`         | Datenbankname                                               |
| `USE_MONGODB_TIME_SERIES`         | `false`                     | Native Time-Series-Collection aktivieren (nur bei neuer DB) |
| `SENSOR_EVENTS_RETENTION_SECONDS` | `0` (kein TTL)              | Automatisches Löschen alter Sensor-Events                   |
| `AUDIT_LOG_RETENTION_SECONDS`     | `15552000` (180 Tage)       | TTL für Audit-Logs                                          |
| `AUTH_PASSWORD_PEPPER`            | `dev-pepper`                | Pepper für Passwort-Hashing (SHA-256)                       |

---

## Troubleshooting

**MongoDB startet nicht:**
```powershell
docker compose down -v
docker compose up -d
```

**Backend: Port 3000 bereits belegt:**
Prozess auf Port 3000 finden und beenden


**Frontend: API-Fehler 404 / CORS:**
- Sicherstellen, dass das Backend läuft (`http://localhost:3000/api/health`)
- Sicherstellen, dass das Frontend via `npm run dev` läuft (Proxy aktiv), nicht via `npm run preview`

**Seed schlägt fehl (Index-Konflikt):**
- Passiert, wenn die DB bereits Daten aus einer früheren Version enthält
- Lösung: `docker compose down -v && docker compose up -d`, dann erneut `npm run seed`

**Time-Series-Collection Fehler beim Neustart:**
- `USE_MONGODB_TIME_SERIES=true` funktioniert nur, wenn die Collection `sensor_events` noch **nicht** existiert
- Bei bestehender Standard-Collection einfach auf `false` lassen — die Aggregation Pipelines funktionieren in beiden Fällen identisch
