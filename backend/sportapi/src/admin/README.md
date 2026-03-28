# Admin API

## Scope
- Globaler Prefix: `/api`
- Modul-Base-Path: `/admin`
- Auth: Bearer Token erforderlich (Ausnahme: `GET /api/admin/sensor-catalog` ist öffentlich)
- Rolle: für alle anderen Endpunkte `admin`; Prüfung erfolgt im Service

## Endpunkte
- `GET /api/admin/system-metrics` - Systemmetriken abrufen (`from`, `to` optional)
- `GET /api/admin/write-performance` - Schreibperformance abrufen (`from`, `to` optional)
- `GET /api/admin/audit-logs` - Audit-Logs abrufen (`limit`, `from`, `to`, Filter optional)
- `GET /api/admin/sensor-types` - Sensor-Statistiken abrufen
- `GET /api/admin/data-volume-by-sport` - Datenvolumen je Sportart abrufen
- `GET /api/admin/users` - Nutzerliste abrufen
- `GET /api/admin/sensor-catalog` - Sensor-Katalog abrufen (öffentlich)
- `GET /api/admin/trainer-assignments` - Trainer-Sportler-Zuordnungen abrufen
- `POST /api/admin/users` - Nutzer anlegen
- `PATCH /api/admin/users/:userId/role` - Rolle eines Nutzers aktualisieren
- `POST /api/admin/sensor-types` - Sensortyp anlegen oder aktualisieren
- `PATCH /api/admin/trainers/:trainerId/athletes` - Zuordnung Trainer <-> Sportler aktualisieren

## Hinweise zu Payloads
- `POST /users`: typischerweise `email`, `password`, `role`, optionale Profildaten
- `PATCH /users/:userId/role`: erwartet `role`
- `POST /sensor-types`: erwartet Sensor-Metadaten (z. B. `type`, `label`, Generator/Config); `displayName` muss eindeutig sein (case-insensitive)
- `PATCH /trainers/:trainerId/athletes`: erwartet Zieloperation und/oder Sportlerliste
