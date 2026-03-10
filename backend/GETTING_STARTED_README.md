# Backend Getting Started

Diese Anleitung zeigt dir genau, in welchem Ordner du welche Befehle ausfuehren musst.

## Voraussetzungen

- Node.js 20+ (LTS empfohlen)
- Docker Desktop (fuer lokale MongoDB via `docker compose`)

Wichtig zu NestJS:
- Ein globales NestJS CLI (`npm i -g @nestjs/cli`) ist **nicht** erforderlich.
- Das Projekt bringt `@nestjs/cli` bereits lokal in `backend/sportapi` mit.

Windows-Hinweis:
- Wenn PowerShell `npm` blockiert (Execution Policy), nutze `npm.cmd` statt `npm`.

## Projektstruktur

- `backend/database`
  - enthaelt `docker-compose.yml` fuer MongoDB
- `backend/sportapi`
  - NestJS Backend API

## 1) Dependencies installieren

Im Ordner `backend`:

```bash
npm install
```

Im Ordner `backend/sportapi`:

```bash
npm install
```

## 2) MongoDB mit Docker starten

Im Ordner `backend/database`:

```bash
docker compose up -d
```

Status pruefen:

```bash
docker compose ps
```

MongoDB stoppen:

```bash
docker compose down
```

## 3) API starten

Im Ordner `backend/sportapi`:

```bash
npm run start:dev
```

Wenn `npm` in PowerShell gesperrt ist:

```bash
npm.cmd run start:dev
```

API erreichbar unter:

- `http://localhost:3000/api`
- Healthcheck: `GET http://localhost:3000/api/health`

### Auth-Header fuer alle fachlichen Endpunkte

Alle Endpunkte (ausser Health) erwarten:

- `x-user-id`
- `x-role` (`admin`, `trainer`, `athlete`)

## 4) Seed-Daten laden (optional)

Im Ordner `backend/sportapi`:

```bash
npm run seed
```

Wenn `npm` in PowerShell gesperrt ist:

```bash
npm.cmd run seed
```

Danach kannst du mit diesen Headern testen:

- Admin: `x-user-id: admin-1`, `x-role: admin`
- Trainer: `x-user-id: trainer-1`, `x-role: trainer`
- Athlete: `x-user-id: athlete-user-1`, `x-role: athlete`

## 5) MongoDB Compass (optional)

Verbindungsstring:

- `mongodb://localhost:27017`

Datenbankname:

- `sport_performance`

## API Uebersicht

### Athletes

- `POST /api/athletes` (Profil anlegen)
- `GET /api/athletes` (Profile listen)
- `GET /api/athletes/:athleteId` (Profil abrufen)
- `PATCH /api/athletes/:athleteId` (Profil aktualisieren)
- `DELETE /api/athletes/:athleteId` (Profil loeschen)

### Sessions

- `POST /api/sessions` (Trainingseinheit anlegen)
- `GET /api/sessions/:sessionId` (Trainingseinheit abrufen)
- `GET /api/athletes/:athleteId/sessions` (Trainingshistorie / Sessions)
- `PATCH /api/sessions/:sessionId/finish` (Trainingseinheit abschliessen)

### Sensor Events

- `POST /api/sensor-events` (ein Sensordatenpunkt)
- `POST /api/sensor-events/batch` (Bulk-Ingest fuer hohe Schreiblast)
- `GET /api/athletes/:athleteId/sensor-events/recent?seconds=600`

### Analytics

- `GET /api/analytics/athletes/:athleteId/average-heart-rate?from=...&to=...`
- `GET /api/analytics/sessions/:sessionId/summary`
- `GET /api/analytics/athletes/:athleteId/history?from=...&to=...`
- `POST /api/analytics/athletes/:athleteId/load-zones/calculate`
