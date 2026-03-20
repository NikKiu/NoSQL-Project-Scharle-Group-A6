# Auth API

## Scope
- Globaler Prefix: `/api`
- Modul-Base-Path: `/auth`

## Endpunkte
- `POST /api/auth/register` - Neuen Nutzer registrieren (öffentlich)
- `POST /api/auth/login` - Login und Token ausstellen (öffentlich)
- `GET /api/auth/me` - Aktuellen Nutzer aus Token auflösen (Bearer Token erforderlich)

## Hinweise zu Payloads
- `POST /register`: typischerweise `email`, `password`, `role`, optionale Stammdaten
- `POST /login`: typischerweise `email`, `password`

