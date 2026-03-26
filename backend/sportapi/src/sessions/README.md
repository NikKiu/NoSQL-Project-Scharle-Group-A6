# Sessions API

## Scope
- Globaler Prefix: `/api`
- Modul-Routen: root-basiert (`/sessions` und `/athletes/:athleteId/sessions`)
- Auth: Bearer Token erforderlich
- Zugriff: serverseitig an Session-/Athletenrechte gebunden (eigene Daten, zugewiesene Trainerdaten, Admin)

## Endpunkte
- `POST /api/sessions` - Trainingssession starten/anlegen
- `GET /api/sessions/:sessionId` - Session-Details abrufen
- `GET /api/athletes/:athleteId/sessions` - Sessions eines Sportlers abrufen (Query optional)
- `PATCH /api/sessions/:sessionId/finish` - Session beenden
- `PATCH /api/sessions/:sessionId/notes` - Trainer-/Analyse-Notizen zur Session speichern

## Hinweise zu Payloads
- `POST /sessions`: erwartet mindestens `athleteId`, `sport` und Startkontext
- `PATCH /sessions/:sessionId/finish`: erwartet Enddaten (z. B. `endAt`, optionale Summary)
- `PATCH /sessions/:sessionId/notes`: erwartet Notiztext bzw. strukturierte Notizdaten

