# Backend Getting Started

Diese Anleitung zeigt dir genau, **in welchem Ordner** du welche Befehle ausführen musst.

## Projektstruktur

- `backend/database`  
  Enthält `docker-compose.yml` für MongoDB.
- `backend/sportapi`  
  NestJS-Backend (API).

## Pakete installieren (in `backend`):

```bash
npm install
```
## 1) MongoDB mit Docker starten

In den Ordner `backend/database` wechseln und dort ausführen:

```bash
docker compose up -d
```

Status prüfen (ebenfalls in `backend/database`):

```bash
docker compose -f ps
```

MongoDB stoppen (in `backend/database`):

```bash
docker compose -f down
```

## 2) API starten

In den Ordner `backend/sportapi` wechseln und dort ausführen:

```bash
npm run start:dev
```

API erreichbar unter:

- `http://localhost:3000/api`
- Healthcheck: `GET http://localhost:3000/api/health`

## 3) Seed-Daten laden (optional, empfohlen)

Im Ordner `backend/sportapi` ausführen:

```bash
npm run seed
```

Danach kannst du mit diesen Headern testen:

- Admin: `x-user-id: admin-1`, `x-role: admin`
- Trainer: `x-user-id: trainer-1`, `x-role: trainer`
- Athlete: `x-user-id: athlete-user-1`, `x-role: athlete`

## 4) Compass verbinden (optional)

In MongoDB Compass verbinden mit:

- `mongodb://localhost:27017`
- Datenbankname: `sport_performance`
