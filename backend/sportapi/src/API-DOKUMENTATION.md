# API Dokumentation

Diese Datei ist der zentrale Einstiegspunkt für die Backend-API-Dokumentation unter `backend/sportapi/src`.

## Rahmen
- Globaler Prefix: `/api`
- API-Module sind pro Ordner dokumentiert
- Geschützte Endpunkte erwarten `Authorization: Bearer <token>`
- Öffentliche Ausnahmen: `GET /api/health`, `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/admin/sensor-catalog`
- Auth- und Rollenprüfung sind je Modul in `Scope` beschrieben

## Modul Übersicht
- Admin: `backend/sportapi/src/admin/README.md`
- Analytics: `backend/sportapi/src/analytics/README.md`
- Athletes: `backend/sportapi/src/athletes/README.md`
- Auth: `backend/sportapi/src/auth/README.md`
- Health: `backend/sportapi/src/health/README.md`
- Sensor Events: `backend/sportapi/src/sensor-events/README.md`
- Sessions: `backend/sportapi/src/sessions/README.md`


