import { MongoService } from './mongo.service';
import { createHash } from 'crypto';

async function seed() {
  const mongoService = new MongoService();
  await mongoService.onModuleInit();
  const db = mongoService.getDb();

  console.log('🌱 Starting comprehensive seed...');

  const now = new Date();
  const hashPassword = (password: string) =>
    createHash('sha256').update(`${process.env.AUTH_PASSWORD_PEPPER || 'dev-pepper'}:${password}`).digest('hex');

  // ==================== USERS ====================
  const users = [
    {
      id: 'admin-1',
      userId: 'admin-1',
      email: 'admin@sport.local',
      role: 'admin',
      name: 'System Admin',
      passwordHash: hashPassword('admin123'),
      trainerAthleteIds: [],
      athleteId: null,
      firstName: 'System',
      lastName: 'Admin',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'trainer-1',
      userId: 'trainer-1',
      email: 'trainer@sport.local',
      role: 'trainer',
      name: 'Timo Trainer',
      passwordHash: hashPassword('trainer123'),
      trainerAthleteIds: ['athlete-1', 'athlete-2', 'athlete-3', 'athlete-4', 'athlete-5'],
      athleteId: null,
      firstName: 'Timo',
      lastName: 'Trainer',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'athlete-user-1',
      userId: 'athlete-user-1',
      email: 'alex@sport.local',
      role: 'athlete',
      name: 'Alex Meyer',
      passwordHash: hashPassword('athlete123'),
      trainerAthleteIds: [],
      athleteId: 'athlete-1',
      firstName: 'Alex',
      lastName: 'Meyer',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'athlete-user-2',
      userId: 'athlete-user-2',
      email: 'sarah@sport.local',
      role: 'athlete',
      name: 'Sarah Schmidt',
      passwordHash: hashPassword('athlete123'),
      trainerAthleteIds: [],
      athleteId: 'athlete-2',
      firstName: 'Sarah',
      lastName: 'Schmidt',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'athlete-user-3',
      userId: 'athlete-user-3',
      email: 'max@sport.local',
      role: 'athlete',
      name: 'Max Müller',
      passwordHash: hashPassword('athlete123'),
      trainerAthleteIds: [],
      athleteId: 'athlete-3',
      firstName: 'Max',
      lastName: 'Müller',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'athlete-user-4',
      userId: 'athlete-user-4',
      email: 'lisa@sport.local',
      role: 'athlete',
      name: 'Lisa Wagner',
      passwordHash: hashPassword('athlete123'),
      trainerAthleteIds: [],
      athleteId: 'athlete-4',
      firstName: 'Lisa',
      lastName: 'Wagner',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'athlete-user-5',
      userId: 'athlete-user-5',
      email: 'tom@sport.local',
      role: 'athlete',
      name: 'Tom Fischer',
      passwordHash: hashPassword('athlete123'),
      trainerAthleteIds: [],
      athleteId: 'athlete-5',
      firstName: 'Tom',
      lastName: 'Fischer',
      createdAt: now,
      updatedAt: now
    }
  ];

  console.log('📝 Creating users...');
  await Promise.all(
    users.map((user) =>
      db.collection('users').updateOne(
        { $or: [{ userId: user.userId }, { id: user.id }] },
        { $set: user },
        { upsert: true }
      )
    )
  );

  // ==================== ATHLETES ====================
  const athletes = [
    {
      id: 'athlete-1',
      athleteId: 'athlete-1',
      userId: 'athlete-user-1',
      firstName: 'Alex',
      lastName: 'Meyer',
      birthDate: new Date('1998-05-14'),
      gender: 'male',
      weightKg: 74,
      heightCm: 181,
      trainingLevel: 'fortgeschritten',
      sports: ['running', 'cycling'],
      loadZones: {
        z1: { min: 95, max: 114 },
        z2: { min: 114, max: 133 },
        z3: { min: 133, max: 152 },
        z4: { min: 152, max: 171 },
        z5: { min: 171, max: 190 }
      },
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'athlete-2',
      athleteId: 'athlete-2',
      userId: 'athlete-user-2',
      firstName: 'Sarah',
      lastName: 'Schmidt',
      birthDate: new Date('1995-08-22'),
      gender: 'female',
      weightKg: 62,
      heightCm: 168,
      trainingLevel: 'profi',
      sports: ['running', 'swimming'],
      loadZones: {
        z1: { min: 98, max: 117 },
        z2: { min: 117, max: 137 },
        z3: { min: 137, max: 156 },
        z4: { min: 156, max: 176 },
        z5: { min: 176, max: 195 }
      },
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'athlete-3',
      athleteId: 'athlete-3',
      userId: 'athlete-user-3',
      firstName: 'Max',
      lastName: 'Müller',
      birthDate: new Date('2000-03-10'),
      gender: 'male',
      weightKg: 82,
      heightCm: 186,
      trainingLevel: 'anfänger',
      sports: ['cycling', 'swimming'],
      loadZones: {
        z1: { min: 93, max: 112 },
        z2: { min: 112, max: 130 },
        z3: { min: 130, max: 149 },
        z4: { min: 149, max: 167 },
        z5: { min: 167, max: 186 }
      },
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'athlete-4',
      athleteId: 'athlete-4',
      userId: 'athlete-user-4',
      firstName: 'Lisa',
      lastName: 'Wagner',
      birthDate: new Date('1997-11-05'),
      gender: 'female',
      weightKg: 58,
      heightCm: 165,
      trainingLevel: 'fortgeschritten',
      sports: ['running', 'cycling'],
      loadZones: {
        z1: { min: 91, max: 109 },
        z2: { min: 109, max: 127 },
        z3: { min: 127, max: 146 },
        z4: { min: 146, max: 164 },
        z5: { min: 164, max: 182 }
      },
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'athlete-5',
      athleteId: 'athlete-5',
      userId: 'athlete-user-5',
      firstName: 'Tom',
      lastName: 'Fischer',
      birthDate: new Date('1999-07-18'),
      gender: 'male',
      weightKg: 78,
      heightCm: 179,
      trainingLevel: 'fortgeschritten',
      sports: ['running'],
      loadZones: {
        z1: { min: 94, max: 113 },
        z2: { min: 113, max: 132 },
        z3: { min: 132, max: 150 },
        z4: { min: 150, max: 169 },
        z5: { min: 169, max: 188 }
      },
      createdAt: now,
      updatedAt: now
    }
  ];

  console.log('🏃 Creating athletes...');
  await Promise.all(
    athletes.map((athlete) =>
      db.collection('athletes').updateOne(
        { $or: [{ athleteId: athlete.athleteId }, { id: athlete.id }] },
        { $set: athlete },
        { upsert: true }
      )
    )
  );

  // ==================== TRAINING SESSIONS ====================
  console.log('📅 Creating training sessions...');
  const sessions = [];
  const allSensorEvents = [];

  // Helper function to create sessions with realistic timestamps
  const createSessionsForAthlete = (athleteId: string, sport: string, count: number, daysAgo: number) => {
    const sessionsForAthlete = [];
    for (let i = 0; i < count; i++) {
      const sessionDate = new Date(now.getTime() - (daysAgo + i * 7) * 24 * 60 * 60 * 1000);
      const duration = 30 + Math.random() * 60; // 30-90 minutes
      const startAt = new Date(sessionDate.getTime() - duration * 60 * 1000);
      const endAt = sessionDate;

      const sessionId = `session-${athleteId}-${sport}-${i + 1}`;
      const hasNotes = Math.random() > 0.6;

      sessionsForAthlete.push({
        id: sessionId,
        sessionId,
        athleteId,
        sport,
        status: 'finished',
        sensorTypes: ['heart-rate', 'gps', 'power'],
        startAt,
        endAt,
        notes: hasNotes ? `Training ${i + 1} - ${sport}: Gute Performance, stetige Verbesserung` : undefined,
        createdAt: endAt,
        updatedAt: endAt
      });
    }
    return sessionsForAthlete;
  };

  // Create sessions for each athlete
  sessions.push(...createSessionsForAthlete('athlete-1', 'running', 8, 56));
  sessions.push(...createSessionsForAthlete('athlete-1', 'cycling', 5, 49));
  sessions.push(...createSessionsForAthlete('athlete-2', 'running', 12, 84));
  sessions.push(...createSessionsForAthlete('athlete-2', 'swimming', 6, 42));
  sessions.push(...createSessionsForAthlete('athlete-3', 'cycling', 4, 28));
  sessions.push(...createSessionsForAthlete('athlete-3', 'swimming', 3, 21));
  sessions.push(...createSessionsForAthlete('athlete-4', 'running', 10, 70));
  sessions.push(...createSessionsForAthlete('athlete-4', 'cycling', 7, 49));
  sessions.push(...createSessionsForAthlete('athlete-5', 'running', 15, 105));

  // Create one active session for testing live overview
  const liveSessionStart = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes ago
  sessions.push({
    id: 'session-live-1',
    sessionId: 'session-live-1',
    athleteId: 'athlete-1',
    sport: 'running',
    status: 'active',
    sensorTypes: ['heart-rate', 'gps'],
    startAt: liveSessionStart,
    notes: 'Live training session',
    createdAt: liveSessionStart,
    updatedAt: now
  });

  await Promise.all(
    sessions.map((session) =>
      db.collection('training_sessions').updateOne(
        { $or: [{ sessionId: session.sessionId }, { id: session.id }] },
        { $set: session },
        { upsert: true }
      )
    )
  );

  // ==================== SENSOR EVENTS ====================
  console.log('📊 Creating sensor events (this may take a while)...');

  // Helper to generate realistic sensor data
  const generateSensorEvents = (session: any, baseHeartRate: number, baseSpeed: number) => {
    const events = [];
    const duration = session.endAt ? (session.endAt.getTime() - session.startAt.getTime()) / 1000 : 600;
    const eventInterval = 5; // 5 seconds between events
    const eventCount = Math.floor(duration / eventInterval);

    for (let i = 0; i < eventCount; i++) {
      const timestamp = new Date(session.startAt.getTime() + i * eventInterval * 1000);

      // Create realistic variations
      const progress = i / eventCount;
      const warmup = Math.min(progress * 3, 1); // First 33% is warmup
      const cooldown = Math.max((progress - 0.85) * 6.67, 0); // Last 15% is cooldown

      const heartRate = Math.round(
        baseHeartRate +
        warmup * 30 -
        cooldown * 25 +
        Math.sin(i / 20) * 8 +
        (Math.random() - 0.5) * 4
      );

      const speed = Math.max(0.5,
        baseSpeed * warmup * (1 - cooldown * 0.5) +
        Math.sin(i / 15) * (baseSpeed * 0.2) +
        (Math.random() - 0.5) * 0.3
      );

      const distanceDelta = speed * eventInterval / 3.6; // Convert km/h to meters per interval

      events.push({
        id: `${session.sessionId}-event-${i}`,
        eventId: `${session.sessionId}-event-${i}`,
        athleteId: session.athleteId,
        sessionId: session.sessionId,
        timestamp,
        sensorType: ['heart-rate', 'gps', 'power'][i % 3],
        metrics: { heartRate, speed, distanceDelta },
        heartRate,
        speed: parseFloat(speed.toFixed(2)),
        distanceDelta: parseFloat(distanceDelta.toFixed(2)),
        createdAt: timestamp
      });
    }
    return events;
  };

  // Generate events for all sessions
  const sportBaseValues = {
    running: { hr: 140, speed: 12 },
    cycling: { hr: 135, speed: 25 },
    swimming: { hr: 130, speed: 4 }
  };

  let eventCount = 0;
  for (const session of sessions) {
    if (session.status === 'finished') {
      const base = sportBaseValues[session.sport] || { hr: 130, speed: 10 };
      const events = generateSensorEvents(session, base.hr, base.speed);
      allSensorEvents.push(...events);
      eventCount += events.length;
    }
  }

  // Generate live events for active session
  const liveSession = sessions.find(s => s.sessionId === 'session-live-1');
  if (liveSession) {
    const liveEvents = generateSensorEvents(liveSession, 145, 11);
    allSensorEvents.push(...liveEvents);
    eventCount += liveEvents.length;
  }

  console.log(`📊 Inserting ${eventCount} sensor events...`);
  // Alte Events löschen, um Duplikate bei erneutem Seeding zu vermeiden
  await db.collection('sensor_events').deleteMany({});
  console.log('  🗑️  Alte Sensor-Events gelöscht');

  // In Batches einfügen
  const batchSize = 1000;
  for (let i = 0; i < allSensorEvents.length; i += batchSize) {
    const batch = allSensorEvents.slice(i, i + batchSize);
    await db.collection('sensor_events').insertMany(batch, { ordered: false });
    process.stdout.write(`\r  Progress: ${Math.min(i + batchSize, allSensorEvents.length)}/${allSensorEvents.length} events`);
  }
  console.log('\n');

  // ==================== AUDIT LOGS ====================
  console.log('📝 Creating audit logs...');
  await db.collection('audit_logs').deleteMany({});
  const auditLogs = [];
  const actions = ['CREATE_SESSION', 'UPDATE_ATHLETE', 'DELETE_SESSION', 'VIEW_DATA', 'EXPORT_DATA'];

  for (let i = 0; i < 50; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const user = users[Math.floor(Math.random() * users.length)];

    auditLogs.push({
      id: `log-${i + 1}`,
      logId: `log-${i + 1}`,
      userId: user.userId,
      action: actions[Math.floor(Math.random() * actions.length)],
      timestamp,
      details: `Action performed by ${user.name}`,
      createdAt: timestamp
    });
  }


  await db.collection('audit_logs').insertMany(auditLogs);

  // ==================== SENSOR TYPES ====================
  await db.collection('sensor_types').deleteMany({});
  await db.collection('sensor_types').insertMany([
    {
      sensorType: 'heart-rate',
      displayName: 'Herzfrequenz',
      unit: 'bpm',
      description: 'Puls pro Minute',
      createdAt: now,
      updatedAt: now
    },
    {
      sensorType: 'gps',
      displayName: 'GPS',
      unit: 'coordinates',
      description: 'Positions- und Geschwindigkeitsdaten',
      createdAt: now,
      updatedAt: now
    },
    {
      sensorType: 'power',
      displayName: 'Leistung',
      unit: 'W',
      description: 'Leistungswerte in Watt',
      createdAt: now,
      updatedAt: now
    }
  ]);

  // ==================== SUMMARY ====================
  console.log('\n✅ Seed completed successfully!\n');
  console.log('📊 Data Summary:');
  console.log(`   - Users: ${users.length}`);
  console.log(`   - Athletes: ${athletes.length}`);
  console.log(`   - Training Sessions: ${sessions.length}`);
  console.log(`   - Sensor Events: ${eventCount}`);
  console.log(`   - Audit Logs: ${auditLogs.length}`);
  console.log('   - Sensor Types: 3');
  console.log('');

  console.log('👤 Test User Credentials (use these headers in Postman/curl):');
  console.log('   Login credentials:');
  console.log('      admin@sport.local / admin123');
  console.log('      trainer@sport.local / trainer123');
  console.log('      alex@sport.local / athlete123');
  console.log('      sarah@sport.local / athlete123');
  console.log('      max@sport.local / athlete123');
  console.log('      lisa@sport.local / athlete123');
  console.log('      tom@sport.local / athlete123');
  console.log('');

  console.log('Header auth (legacy mode):');
  console.log('   Admin:');
  console.log('      x-user-id: admin-1');
  console.log('      x-role: admin');
  console.log('   Trainer:');
  console.log('      x-user-id: trainer-1');
  console.log('      x-role: trainer');
  console.log('   Athletes:');
  console.log('      x-user-id: athlete-user-1 (Alex Meyer)');
  console.log('      x-user-id: athlete-user-2 (Sarah Schmidt)');
  console.log('      x-user-id: athlete-user-3 (Max Müller)');
  console.log('      x-user-id: athlete-user-4 (Lisa Wagner)');
  console.log('      x-user-id: athlete-user-5 (Tom Fischer)');
  console.log('      x-role: athlete');
  console.log('');

  console.log('🧪 Test Scenarios:');
  console.log('');
  console.log('── EINFACHSTE ENDPUNKTE (kein Datum nötig) ──');
  console.log('');
  console.log('1. All-Time Stats (gesamte Statistik ohne Datum):');
  console.log('   GET /api/analytics/athletes/athlete-1/all-time-stats');
  console.log('');
  console.log('2. Ø-Kennzahlen pro Session (Herzfrequenz, Speed, Distanz):');
  console.log('   GET /api/analytics/athletes/athlete-1/avg-per-session');
  console.log('   GET /api/analytics/athletes/athlete-1/avg-per-session?sport=running&limit=5');
  console.log('');
  console.log('3. Sportart-Statistiken (Running vs Cycling vs Swimming):');
  console.log('   GET /api/analytics/athletes/athlete-1/sport-stats');
  console.log('');
  console.log('── MIT DATUMSBEREICH ──');
  console.log('');
  console.log('4. Performance-Metriken (mit Zeitraum):');
  console.log('   GET /api/analytics/athletes/athlete-1/performance-metrics?from=2025-11-01&to=2026-03-14');
  console.log('');
  console.log('5. Fortschrittsverfolgung (wöchentlich):');
  console.log('   GET /api/analytics/athletes/athlete-1/progress?sport=running&metric=speed&intervalDays=7');
  console.log('   GET /api/analytics/athletes/athlete-1/progress?sport=running&metric=heartRate&intervalDays=7');
  console.log('');
  console.log('── SESSION-ANALYSE ──');
  console.log('');
  console.log('6. Trainingshistorie (letzte 10 Sessions):');
  console.log('   GET /api/analytics/athletes/athlete-2/history-enhanced?limit=10');
  console.log('');
  console.log('7. Session-Detailanalyse:');
  console.log('   GET /api/analytics/sessions/session-athlete-1-running-1/detailed');
  console.log('');
  console.log('8. Herzfrequenz-Zonen (nur für athlete-1 & athlete-2, da loadZones gesetzt):');
  console.log('   GET /api/analytics/sessions/session-athlete-1-running-1/hr-zones');
  console.log('');
  console.log('── VERGLEICHE ──');
  console.log('');
  console.log('9. Sportler-Vergleich (Trainer-Sicht):');
  console.log('   POST /api/analytics/compare-athletes');
  console.log('   Body: {"athleteIds":["athlete-1","athlete-2","athlete-4"],"sport":"running"}');
  console.log('');
  console.log('10. Sessions vergleichen:');
  console.log('    POST /api/analytics/compare-sessions');
  console.log('    Body: {"sessionIds":["session-athlete-1-running-1","session-athlete-1-running-2","session-athlete-1-running-3"]}');
  console.log('');
  console.log('11. Leaderboard (Top-Speed im Laufen):');
  console.log('    GET /api/analytics/leaderboard?sport=running&metric=speed&limit=5');
  console.log('    GET /api/analytics/leaderboard?sport=cycling&metric=distance&limit=5');
  console.log('');
  console.log('12. Trainingslevels vergleichen:');
  console.log('    GET /api/analytics/compare-training-levels?sport=running');
  console.log('');
  console.log('── ECHTZEIT / LIVE ──');
  console.log('');
  console.log('13. Live-Übersicht (aktive Session von athlete-1):');
  console.log('    POST /api/analytics/live-overview');
  console.log('    Body: {"athleteIds":["athlete-1"],"lastMinutes":15}');
  console.log('');
  console.log('── ADMIN-ENDPUNKTE ──');
  console.log('');
  console.log('14. System-Metriken:');
  console.log('    GET /api/admin/system-metrics?from=2025-11-01T00:00:00Z&to=2026-03-14T23:59:59Z');
  console.log('');
  console.log('15. Schreibleistung überwachen:');
  console.log('    GET /api/admin/write-performance?from=2025-11-01T00:00:00Z&to=2026-03-14T23:59:59Z');
  console.log('');
  console.log('16. Datenvolumen pro Sportart:');
  console.log('    GET /api/admin/data-volume-by-sport');
  console.log('');
  console.log('17. Sensor-Typen:');
  console.log('    GET /api/admin/sensor-types');
  console.log('');
  console.log('18. Audit-Logs:');
  console.log('    GET /api/admin/audit-logs?from=2026-02-01&to=2026-03-14');
  console.log('');

  await mongoService.close();
  console.log('🔒 Database connection closed.');
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
