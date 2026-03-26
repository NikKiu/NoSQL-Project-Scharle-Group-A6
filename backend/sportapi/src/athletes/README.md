# Athletes API

## Scope
- Globaler Prefix: `/api`
- Modul-Base-Path: `/athletes`
- Auth: Bearer Token erforderlich
- Rollen: Zugriff wird serverseitig geprüft
  - `athlete`: nur eigenes Profil
  - `trainer`: nur zugewiesene Athleten (`trainerAthleteIds`)
  - `admin`: voller Zugriff

## Endpunkte
- `POST /api/athletes` - Sportler anlegen
- `GET /api/athletes` - Sportlerliste abrufen (Filter/Query optional)
- `GET /api/athletes/:athleteId` - Sportlerdetail abrufen
- `PATCH /api/athletes/:athleteId` - Sportler aktualisieren
- `DELETE /api/athletes/:athleteId` - Sportler löschen

