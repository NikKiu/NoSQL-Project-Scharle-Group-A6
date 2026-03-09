import { MongoService } from './mongo.service';

async function seed() {
  const mongoService = new MongoService();
  await mongoService.onModuleInit();
  const db = mongoService.getDb();

  const now = new Date();
  const start = new Date(now.getTime() - 30 * 60 * 1000);
  const users = [
    {
      userId: 'admin-1',
      role: 'admin',
      firstName: 'System',
      lastName: 'Admin',
      createdAt: now,
      updatedAt: now
    },
    {
      userId: 'trainer-1',
      role: 'trainer',
      firstName: 'Timo',
      lastName: 'Trainer',
      createdAt: now,
      updatedAt: now
    },
    {
      userId: 'athlete-user-1',
      role: 'athlete',
      firstName: 'Alex',
      lastName: 'Meyer',
      createdAt: now,
      updatedAt: now
    }
  ];

  const athlete = {
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
    createdAt: now,
    updatedAt: now
  };

  const session = {
    sessionId: 'session-1',
    athleteId: 'athlete-1',
    sport: 'running',
    status: 'finished',
    sensorTypes: ['heart-rate', 'gps'],
    startAt: start,
    endAt: now,
    notes: 'Seed session',
    createdAt: now,
    updatedAt: now
  };

  const sensorEvents = Array.from({ length: 180 }, (_, i) => {
    const timestamp = new Date(start.getTime() + i * 10 * 1000);
    const heartRate = 125 + Math.round(Math.sin(i / 10) * 18);
    const speed = 2.9 + Math.sin(i / 12) * 0.7;
    const distanceDelta = Math.max(0.1, speed * 10);

    return {
      eventId: `event-${i + 1}`,
      athleteId: 'athlete-1',
      sessionId: 'session-1',
      timestamp,
      sensorType: 'heart-rate',
      metrics: { heartRate, speed, distanceDelta },
      heartRate,
      speed,
      distanceDelta,
      createdAt: now
    };
  });

  await Promise.all(
    users.map((user) =>
      db.collection('users').updateOne(
        { userId: user.userId },
        { $set: user },
        { upsert: true }
      )
    )
  );

  await db.collection('athletes').updateOne(
    { athleteId: athlete.athleteId },
    { $set: athlete },
    { upsert: true }
  );

  await db.collection('training_sessions').updateOne(
    { sessionId: session.sessionId },
    { $set: session },
    { upsert: true }
  );

  await db.collection('sensor_events').deleteMany({ sessionId: session.sessionId });
  await db.collection('sensor_events').insertMany(sensorEvents);

  console.log('Seed completed.');
  console.log('Test users created in collection: users');
  console.log('Use these headers in Postman:');
  console.log('Admin   -> x-user-id: admin-1, x-role: admin');
  console.log('Trainer -> x-user-id: trainer-1, x-role: trainer');
  console.log('Athlete -> x-user-id: athlete-user-1, x-role: athlete');
  await mongoService.close();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
