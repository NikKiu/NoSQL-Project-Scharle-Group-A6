# Auth API

## Scope
- Globaler Prefix: `/api`
- Modul-Base-Path: `/auth`
- Auth-Verfahren: signierter Bearer-Token (`Authorization: Bearer <token>`)

## Endpunkte
- `POST /api/auth/register` - Neuen Nutzer registrieren (öffentlich)
- `POST /api/auth/login` - Login und Token ausstellen (öffentlich)
- `GET /api/auth/me` - Aktuellen Nutzer aus Token auflösen (Bearer Token erforderlich)

## Hinweise zu Payloads
- `POST /register`: typischerweise `email`, `password`, `role`, optionale Stammdaten
- `POST /login`: typischerweise `email`, `password`
- Erfolgreiche Antworten enthalten `auth.token`, der bei allen geschützten Endpunkten als Bearer-Token gesendet werden muss
- Für stabile Token-Validierung über Server-Neustarts sollte `AUTH_TOKEN_SECRET` gesetzt werden

