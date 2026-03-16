import { Db, Document } from 'mongodb';

/**
 * Aggregation Pipelines für Sport-Performance Tracking System
 * Basierend auf den Anforderungen F10, NF4, NF9, NF10
 */

/**
 * F10, NF4: Sportlerspezifische Auswertungen - Durchschnittspuls über einen definierten Zeitraum
 * US 6 & 7: Maximalgeschwindigkeit sehen / Trainingshistorie
 * fromDate / toDate optional – ohne Angabe werden alle Events berücksichtigt.
 */
export async function getAthletePerformanceMetrics(
  db: Db,
  athleteId: string,
  fromDate?: Date,
  toDate?: Date
) {
  const matchStage: any = { athleteId };
  if (fromDate || toDate) {
    matchStage.timestamp = {};
    if (fromDate) matchStage.timestamp.$gte = fromDate;
    if (toDate)   matchStage.timestamp.$lte = toDate;
  }

  const pipeline: Document[] = [
    { $match: matchStage },
    {
      $group: {
        _id: '$athleteId',
        // $avg / $min / $max ignorieren automatisch null-Werte in MongoDB
        avgHeartRate:  { $avg: '$heartRate' },
        minHeartRate:  { $min: '$heartRate' },
        maxHeartRate:  { $max: '$heartRate' },
        avgSpeed:      { $avg: '$speed' },
        maxSpeed:      { $max: '$speed' },
        totalDistance: { $sum: { $ifNull: ['$distanceDelta', 0] } },
        totalEvents:   { $sum: 1 },
        sessionCount:  { $addToSet: '$sessionId' },
        firstEvent:    { $min: '$timestamp' },
        lastEvent:     { $max: '$timestamp' }
      }
    },
    {
      $project: {
        _id: 0,
        athleteId:      '$_id',
        avgHeartRate:   { $round: ['$avgHeartRate',  1] },
        minHeartRate:   1,
        maxHeartRate:   1,
        avgSpeed:       { $round: ['$avgSpeed',      2] },
        maxSpeed:       { $round: ['$maxSpeed',      2] },
        totalDistanceM: { $round: ['$totalDistance', 2] },
        totalDistanceKm:{ $round: [{ $divide: ['$totalDistance', 1000] }, 3] },
        totalEvents:    1,
        sessionCount:   { $size: '$sessionCount' },
        firstEvent:     1,
        lastEvent:      1,
        durationSeconds: {
          $cond: {
            if:   { $and: ['$firstEvent', '$lastEvent'] },
            then: { $divide: [{ $subtract: ['$lastEvent', '$firstEvent'] }, 1000] },
            else: null
          }
        },
        dateRange: {
          from: { $ifNull: ['$firstEvent', null] },
          to:   { $ifNull: ['$lastEvent',  null] }
        }
      }
    }
  ];

  const results = await db.collection('sensor_events').aggregate(pipeline).toArray();
  return results[0] ?? {
    athleteId,
    message: 'Keine Sensordaten im angegebenen Zeitraum gefunden',
    totalEvents: 0
  };
}

/**
 * NF4: All-Time Gesamtstatistik eines Sportlers – kein Datumsbereich nötig.
 * Ideal für einen schnellen Überblick in Postman.
 * US 7: Trainingshistorie einsehen
 */
export async function getAthleteAllTimeStats(db: Db, athleteId: string) {
  const pipeline: Document[] = [
    { $match: { athleteId } },
    {
      $group: {
        _id: '$athleteId',
        avgHeartRate:  { $avg: '$heartRate' },
        minHeartRate:  { $min: '$heartRate' },
        maxHeartRate:  { $max: '$heartRate' },
        avgSpeed:      { $avg: '$speed' },
        maxSpeed:      { $max: '$speed' },
        totalDistance: { $sum: { $ifNull: ['$distanceDelta', 0] } },
        totalEvents:   { $sum: 1 },
        sessions:      { $addToSet: '$sessionId' },
        firstEvent:    { $min: '$timestamp' },
        lastEvent:     { $max: '$timestamp' }
      }
    },
    {
      $project: {
        _id: 0,
        athleteId:       '$_id',
        avgHeartRate:    { $round: ['$avgHeartRate',  1] },
        minHeartRate:    1,
        maxHeartRate:    1,
        avgSpeed:        { $round: ['$avgSpeed',      2] },
        maxSpeed:        { $round: ['$maxSpeed',      2] },
        totalDistanceM:  { $round: ['$totalDistance', 2] },
        totalDistanceKm: { $round: [{ $divide: ['$totalDistance', 1000] }, 3] },
        totalEvents:     1,
        sessionCount:    { $size: '$sessions' },
        firstEvent:      1,
        lastEvent:       1
      }
    }
  ];

  const [result] = await db.collection('sensor_events').aggregate(pipeline).toArray();
  return result ?? {
    athleteId,
    message: 'Noch keine Sensordaten vorhanden',
    totalEvents: 0
  };
}

/**
 * NF4, NF9: Durchschnittswerte pro Session – zeigt Entwicklung über die Trainingseinheiten.
 * US 7: Trainingshistorie einsehen
 */
export async function getAverageMetricsPerSession(
  db: Db,
  athleteId: string,
  sport?: string,
  limit: number = 20
) {
  const matchStage: any = { athleteId };

  const pipeline: Document[] = [
    { $match: matchStage },
    {
      $group: {
        _id: '$sessionId',
        avgHeartRate:  { $avg: '$heartRate' },
        maxHeartRate:  { $max: '$heartRate' },
        minHeartRate:  { $min: '$heartRate' },
        avgSpeed:      { $avg: '$speed' },
        maxSpeed:      { $max: '$speed' },
        totalDistance: { $sum: { $ifNull: ['$distanceDelta', 0] } },
        eventCount:    { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'training_sessions',
        localField: '_id',
        foreignField: 'sessionId',
        as: 'session'
      }
    },
    { $unwind: '$session' },
    // Optional: nach Sportart filtern
    ...(sport ? [{ $match: { 'session.sport': sport } } as Document] : []),
    {
      $project: {
        _id: 0,
        sessionId:       '$_id',
        sport:           '$session.sport',
        startAt:         '$session.startAt',
        endAt:           '$session.endAt',
        avgHeartRate:    { $round: ['$avgHeartRate',  1] },
        maxHeartRate:    1,
        minHeartRate:    1,
        avgSpeed:        { $round: ['$avgSpeed',      2] },
        maxSpeed:        { $round: ['$maxSpeed',      2] },
        totalDistanceM:  { $round: ['$totalDistance', 2] },
        totalDistanceKm: { $round: [{ $divide: ['$totalDistance', 1000] }, 3] },
        eventCount:      1,
        durationMinutes: {
          $cond: {
            if: { $and: ['$session.startAt', '$session.endAt'] },
            then: {
              $round: [{
                $divide: [
                  { $subtract: ['$session.endAt', '$session.startAt'] },
                  60000
                ]
              }, 1]
            },
            else: null
          }
        }
      }
    },
    { $sort: { startAt: -1 } },
    { $limit: limit }
  ];

  return db.collection('sensor_events').aggregate(pipeline).toArray();
}

/**
 * F10, NF4: Trainingshistorie mit Durchschnittskennzahlen pro Session
 * US 7: Trainingshistorie einsehen können (Durchschnittspuls, Geschwindigkeit, etc.)
 * US 16: Trainer - Einsicht in historische Trainingsdaten
 */
export async function getTrainingHistory(
  db: Db,
  athleteId: string,
  limit: number = 50
) {
  const pipeline: Document[] = [
    {
      $match: { athleteId }
    },
    {
      $sort: { startAt: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'sensor_events',
        localField: 'sessionId',
        foreignField: 'sessionId',
        as: 'events'
      }
    },
    {
      $addFields: {
        eventCount: { $size: '$events' },
        avgHeartRate: { $avg: '$events.heartRate' },
        maxHeartRate: { $max: '$events.heartRate' },
        avgSpeed: { $avg: '$events.speed' },
        maxSpeed: { $max: '$events.speed' },
        totalDistance: {
          $sum: {
            $map: {
              input: '$events',
              as: 'event',
              in: { $ifNull: ['$$event.distanceDelta', 0] }
            }
          }
        }
      }
    },
    {
      $project: {
        events: 0,
        _id: 0
      }
    }
  ];

  return db.collection('training_sessions').aggregate(pipeline).toArray();
}

/**
 * F17, F22, NF10: Vergleiche zwischen Sportlern anhand frei wählbarer Metriken
 * US 13: Trainer - Zugriff auf durchschnittliche Leistungsdaten
 * US 19: Trainer - Vergleiche zwischen Sportlern durchführen
 */
export async function compareAthletes(
  db: Db,
  athleteIds: string[],
  sport?: string,
  fromDate?: Date,
  toDate?: Date
) {
  const matchStage: any = {
    athleteId: { $in: athleteIds }
  };

  if (fromDate || toDate) {
    matchStage.timestamp = {};
    if (fromDate) matchStage.timestamp.$gte = fromDate;
    if (toDate) matchStage.timestamp.$lte = toDate;
  }

  const pipeline: Document[] = [
    {
      $match: matchStage
    },
    {
      $lookup: {
        from: 'training_sessions',
        localField: 'sessionId',
        foreignField: 'sessionId',
        as: 'session'
      }
    },
    {
      $unwind: { path: '$session', preserveNullAndEmptyArrays: true }
    }
  ];

  if (sport) {
    pipeline.push({
      $match: { 'session.sport': sport }
    });
  }

  pipeline.push(
    {
      $group: {
        _id: '$athleteId',
        avgHeartRate: { $avg: '$heartRate' },
        maxHeartRate: { $max: '$heartRate' },
        avgSpeed: { $avg: '$speed' },
        maxSpeed: { $max: '$speed' },
        totalDistance: { $sum: { $ifNull: ['$distanceDelta', 0] } },
        totalEvents: { $sum: 1 },
        sessionCount: { $addToSet: '$sessionId' }
      }
    },
    {
      $lookup: {
        from: 'athletes',
        localField: '_id',
        foreignField: 'athleteId',
        as: 'athlete'
      }
    },
    {
      $unwind: { path: '$athlete', preserveNullAndEmptyArrays: true }
    },
    {
      $project: {
        _id: 0,
        athleteId: '$_id',
        athleteName: {
          $concat: ['$athlete.firstName', ' ', '$athlete.lastName']
        },
        trainingLevel: '$athlete.trainingLevel',
        avgHeartRate: { $round: ['$avgHeartRate', 2] },
        maxHeartRate: 1,
        avgSpeed: { $round: ['$avgSpeed', 2] },
        maxSpeed: { $round: ['$maxSpeed', 2] },
        totalDistance: { $round: ['$totalDistance', 2] },
        totalEvents: 1,
        sessionCount: { $size: '$sessionCount' }
      }
    },
    {
      $sort: { avgSpeed: -1 }
    }
  );

  return db.collection('sensor_events').aggregate(pipeline).toArray();
}

/**
 * F10, NF4: Sportartspezifische Auswertungen – korrekte Aggregation via $unwind.
 * US 5: Unterschiedliche Sportarten verwalten und dokumentieren.
 * Früher: Mean-of-Means-Problem durch verschachtelte $avg im $group → jetzt behoben.
 */
export async function getSportStatistics(
  db: Db,
  athleteId: string,
  fromDate?: Date,
  toDate?: Date
) {
  const matchSession: any = { athleteId };
  if (fromDate || toDate) {
    matchSession.startAt = {};
    if (fromDate) matchSession.startAt.$gte = fromDate;
    if (toDate)   matchSession.startAt.$lte = toDate;
  }

  const pipeline: Document[] = [
    // 1. Sessions des Sportlers (mit optionalem Datum-Filter)
    { $match: matchSession },
    // 2. Zugehörige Sensor-Events einbinden
    {
      $lookup: {
        from: 'sensor_events',
        localField: 'sessionId',
        foreignField: 'sessionId',
        as: 'events'
      }
    },
    // 3. Events entfalten → ein Dokument pro Event (korrekte Basis für Aggregation)
    { $unwind: { path: '$events', preserveNullAndEmptyArrays: false } },
    // 4. Korrekte Aggregation pro Sportart über alle einzelnen Events
    {
      $group: {
        _id: '$sport',
        sessionIds:    { $addToSet: '$sessionId' },
        totalEvents:   { $sum: 1 },
        avgHeartRate:  { $avg: '$events.heartRate' },
        maxHeartRate:  { $max: '$events.heartRate' },
        avgSpeed:      { $avg: '$events.speed' },
        maxSpeed:      { $max: '$events.speed' },
        totalDistance: { $sum: { $ifNull: ['$events.distanceDelta', 0] } }
      }
    },
    {
      $project: {
        _id: 0,
        sport:           '$_id',
        sessionCount:    { $size: '$sessionIds' },
        totalEvents:     1,
        avgHeartRate:    { $round: ['$avgHeartRate',  1] },
        maxHeartRate:    1,
        avgSpeed:        { $round: ['$avgSpeed',      2] },
        maxSpeed:        { $round: ['$maxSpeed',      2] },
        totalDistanceM:  { $round: ['$totalDistance', 2] },
        totalDistanceKm: { $round: [{ $divide: ['$totalDistance', 1000] }, 3] }
      }
    },
    { $sort: { sessionCount: -1 } }
  ];

  return db.collection('training_sessions').aggregate(pipeline).toArray();
}

/**
 * F14, F16: Administrator - Überwachung der Daten-Pipelines (Schreibrate, Latenz)
 * US 8: Administrator - Schreibrate & Latenz überwachen
 * NF1, NF3: Hohe Schreiblast verarbeiten und Time-Series optimieren
 */
export async function getSystemMetrics(
  db: Db,
  fromDate: Date,
  toDate: Date,
  intervalMinutes: number = 5
) {
  const pipeline: Document[] = [
    {
      $match: {
        createdAt: { $gte: fromDate, $lte: toDate }
      }
    },
    {
      $group: {
        _id: {
          interval: {
            $toDate: {
              $subtract: [
                { $toLong: '$createdAt' },
                { $mod: [{ $toLong: '$createdAt' }, intervalMinutes * 60 * 1000] }
              ]
            }
          },
          sensorType: '$sensorType'
        },
        eventCount: { $sum: 1 },
        athletes: { $addToSet: '$athleteId' },
        avgLatency: {
          $avg: {
            $subtract: ['$createdAt', '$timestamp']
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        interval: '$_id.interval',
        sensorType: '$_id.sensorType',
        eventCount: 1,
        athleteCount: { $size: '$athletes' },
        avgLatencyMs: { $round: ['$avgLatency', 0] },
        eventsPerSecond: {
          $divide: ['$eventCount', intervalMinutes * 60]
        }
      }
    },
    {
      $sort: { interval: 1, sensorType: 1 }
    }
  ];

  return db.collection('sensor_events').aggregate(pipeline).toArray();
}

/**
 * F10, F17: Trainer - Durchschnittliche Leistungsdaten über mehrere Sessions
 * US 17: Trainer - Leistungswerte über mehrere Trainingseinheiten vergleichen
 */
export async function getSessionComparison(
  db: Db,
  sessionIds: string[]
) {
  const pipeline: Document[] = [
    {
      $match: {
        sessionId: { $in: sessionIds }
      }
    },
    {
      $group: {
        _id: '$sessionId',
        avgHeartRate: { $avg: '$heartRate' },
        maxHeartRate: { $max: '$heartRate' },
        minHeartRate: { $min: '$heartRate' },
        avgSpeed: { $avg: '$speed' },
        maxSpeed: { $max: '$speed' },
        totalDistance: { $sum: { $ifNull: ['$distanceDelta', 0] } },
        eventCount: { $sum: 1 },
        firstEvent: { $min: '$timestamp' },
        lastEvent: { $max: '$timestamp' },
        sensorTypes: { $addToSet: '$sensorType' }
      }
    },
    {
      $lookup: {
        from: 'training_sessions',
        localField: '_id',
        foreignField: 'sessionId',
        as: 'session'
      }
    },
    {
      $unwind: '$session'
    },
    {
      $lookup: {
        from: 'athletes',
        localField: 'session.athleteId',
        foreignField: 'athleteId',
        as: 'athlete'
      }
    },
    {
      $unwind: '$athlete'
    },
    {
      $project: {
        _id: 0,
        sessionId: '$_id',
        athleteId: '$session.athleteId',
        athleteName: {
          $concat: ['$athlete.firstName', ' ', '$athlete.lastName']
        },
        sport: '$session.sport',
        startAt: '$session.startAt',
        endAt: '$session.endAt',
        status: '$session.status',
        avgHeartRate: { $round: ['$avgHeartRate', 2] },
        maxHeartRate: 1,
        minHeartRate: 1,
        avgSpeed: { $round: ['$avgSpeed', 2] },
        maxSpeed: { $round: ['$maxSpeed', 2] },
        totalDistance: { $round: ['$totalDistance', 2] },
        eventCount: 1,
        durationSeconds: {
          $divide: [{ $subtract: ['$lastEvent', '$firstEvent'] }, 1000]
        },
        sensorTypes: 1
      }
    },
    {
      $sort: { startAt: -1 }
    }
  ];

  return db.collection('sensor_events').aggregate(pipeline).toArray();
}

/**
 * F10: Herzfrequenz-Zonen Analyse (Belastungszonen)
 * Zeigt Anzahl der Messwerte in jeder Herzfrequenz-Zone.
 * Fix: $bucket._id = UNTERE Grenze → Zone-Labels waren um eine Zone verschoben.
 */
export async function getHeartRateZoneAnalysis(
  db: Db,
  sessionId: string,
  zones: { z1: { min: number; max: number }; z2: any; z3: any; z4: any; z5: any }
) {
  // Grenzen: Ruhe | Z1 | Z2 | Z3 | Z4 | Z5 | Über Max
  // _id des jeweiligen Buckets ist die UNTERE Grenze
  const boundaries = [
    0,
    zones.z1.min,  // _id: z1.min  → Z1 - Regeneration
    zones.z1.max,  // _id: z1.max  → Z2 - Grundlagenausdauer (= z2.min)
    zones.z2.max,  // _id: z2.max  → Z3 - Tempolauf         (= z3.min)
    zones.z3.max,  // _id: z3.max  → Z4 - Schwelle           (= z4.min)
    zones.z4.max,  // _id: z4.max  → Z5 - VO2max             (= z5.min)
    zones.z5.max,  // _id: z5.max  → Über Maximum
    999
  ];

  const pipeline: Document[] = [
    {
      $match: {
        sessionId,
        heartRate: { $type: 'number' }
      }
    },
    {
      $bucket: {
        groupBy: '$heartRate',
        boundaries,
        default: 'other',
        output: {
          count:         { $sum: 1 },
          avgHeartRate:  { $avg: '$heartRate' },
          minHeartRate:  { $min: '$heartRate' },
          maxHeartRate:  { $max: '$heartRate' }
        }
      }
    },
    {
      $project: {
        _id: 0,
        lowerBoundary: '$_id',
        zone: {
          $switch: {
            branches: [
              { case: { $eq: ['$_id', 0]              }, then: 'Ruhe (< Z1)' },
              { case: { $eq: ['$_id', zones.z1.min]   }, then: 'Z1 - Regeneration' },
              { case: { $eq: ['$_id', zones.z1.max]   }, then: 'Z2 - Grundlagenausdauer' },
              { case: { $eq: ['$_id', zones.z2.max]   }, then: 'Z3 - Tempolauf' },
              { case: { $eq: ['$_id', zones.z3.max]   }, then: 'Z4 - Schwelle / Threshold' },
              { case: { $eq: ['$_id', zones.z4.max]   }, then: 'Z5 - VO2max / Spitzenintensität' },
              { case: { $eq: ['$_id', zones.z5.max]   }, then: 'Über Maximum' }
            ],
            default: 'Unbekannt'
          }
        },
        hrRange: {
          $switch: {
            branches: [
              { case: { $eq: ['$_id', 0]            }, then: `< ${zones.z1.min} bpm` },
              { case: { $eq: ['$_id', zones.z1.min] }, then: `${zones.z1.min}–${zones.z1.max} bpm` },
              { case: { $eq: ['$_id', zones.z1.max] }, then: `${zones.z2.min ?? zones.z1.max}–${zones.z2.max} bpm` },
              { case: { $eq: ['$_id', zones.z2.max] }, then: `${zones.z3.min ?? zones.z2.max}–${zones.z3.max} bpm` },
              { case: { $eq: ['$_id', zones.z3.max] }, then: `${zones.z4.min ?? zones.z3.max}–${zones.z4.max} bpm` },
              { case: { $eq: ['$_id', zones.z4.max] }, then: `${zones.z5.min ?? zones.z4.max}–${zones.z5.max} bpm` },
              { case: { $eq: ['$_id', zones.z5.max] }, then: `> ${zones.z5.max} bpm` }
            ],
            default: 'Unbekannt'
          }
        },
        sampleCount:  '$count',
        avgHeartRate: { $round: ['$avgHeartRate', 0] },
        minHeartRate: 1,
        maxHeartRate: 1
      }
    },
    // Nur Buckets mit tatsächlichen Messwerten ausgeben
    { $match: { sampleCount: { $gt: 0 } } },
    { $sort: { lowerBoundary: 1 } }
  ];

  return db.collection('sensor_events').aggregate(pipeline).toArray();
}

/**
 * F16: Administrator - Datenvolumen pro Sportart analysieren
 * US 12: Administrator - Vordefinierte Analyseabfragen ausführen
 */
export async function getDataVolumePerSport(
  db: Db,
  fromDate?: Date,
  toDate?: Date
) {
  const matchStage: any = {};

  if (fromDate || toDate) {
    matchStage.startAt = {};
    if (fromDate) matchStage.startAt.$gte = fromDate;
    if (toDate) matchStage.startAt.$lte = toDate;
  }

  const pipeline: Document[] = [
    ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
    {
      $lookup: {
        from: 'sensor_events',
        localField: 'sessionId',
        foreignField: 'sessionId',
        as: 'events'
      }
    },
    {
      $group: {
        _id: '$sport',
        sessionCount: { $sum: 1 },
        totalEvents: { $sum: { $size: '$events' } },
        uniqueAthletes: { $addToSet: '$athleteId' },
        avgEventsPerSession: { $avg: { $size: '$events' } }
      }
    },
    {
      $project: {
        _id: 0,
        sport: '$_id',
        sessionCount: 1,
        totalEvents: 1,
        uniqueAthleteCount: { $size: '$uniqueAthletes' },
        avgEventsPerSession: { $round: ['$avgEventsPerSession', 0] }
      }
    },
    {
      $sort: { totalEvents: -1 }
    }
  ];

  return db.collection('training_sessions').aggregate(pipeline).toArray();
}

/**
 * F10: Fortschrittsverfolgung - Vergleich von Metriken über Zeit
 * US 6 & 7: Leistungsentwicklung verfolgen
 */
export async function getProgressOverTime(
  db: Db,
  athleteId: string,
  sport: string,
  metric: 'speed' | 'heartRate' | 'distance',
  intervalDays: number = 7
) {
  const pipeline: Document[] = [
    {
      $match: { athleteId, sport }
    },
    {
      $lookup: {
        from: 'sensor_events',
        localField: 'sessionId',
        foreignField: 'sessionId',
        as: 'events'
      }
    },
    {
      $unwind: '$events'
    },
    {
      $group: {
        _id: {
          interval: {
            $toDate: {
              $subtract: [
                { $toLong: '$startAt' },
                {
                  $mod: [
                    { $toLong: '$startAt' },
                    intervalDays * 24 * 60 * 60 * 1000
                  ]
                }
              ]
            }
          }
        },
        avgValue: {
          ...(metric === 'distance'
            ? { $sum: { $ifNull: ['$events.distanceDelta', 0] } }
            : {
                $avg:
                  metric === 'speed'
                    ? '$events.speed'
                    : '$events.heartRate'
              })
        },
        maxValue: {
          ...(metric === 'distance'
            ? { $sum: { $ifNull: ['$events.distanceDelta', 0] } }
            : {
                $max:
                  metric === 'speed'
                    ? '$events.speed'
                    : '$events.heartRate'
              })
        },
        sessionCount: { $addToSet: '$sessionId' },
        totalEvents: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        interval: '$_id.interval',
        metric,
        avgValue: { $round: ['$avgValue', 2] },
        maxValue: { $round: ['$maxValue', 2] },
        sessionCount: { $size: '$sessionCount' },
        totalEvents: 1
      }
    },
    {
      $sort: { interval: 1 }
    }
  ];

  return db.collection('training_sessions').aggregate(pipeline).toArray();
}

/**
 * F17, NF10: Trainer - Echtzeit-Leistungsübersicht mehrerer Sportler
 * US 14: Echtzeitdaten während des Trainings sehen
 * NF2: Echtzeit-/Nahe-Echtzeit-Abfragen
 */
export async function getLiveTrainingOverview(
  db: Db,
  athleteIds: string[],
  lastMinutes: number = 5
) {
  const since = new Date(Date.now() - lastMinutes * 60 * 1000);

  const pipeline: Document[] = [
    {
      $match: {
        athleteId: { $in: athleteIds },
        timestamp: { $gte: since }
      }
    },
    {
      $sort: { timestamp: -1 }
    },
    {
      $group: {
        _id: '$athleteId',
        latestHeartRate: { $first: '$heartRate' },
        latestSpeed: { $first: '$speed' },
        latestTimestamp: { $first: '$timestamp' },
        avgHeartRate: { $avg: '$heartRate' },
        maxHeartRate: { $max: '$heartRate' },
        avgSpeed: { $avg: '$speed' },
        maxSpeed: { $max: '$speed' },
        totalDistance: { $sum: { $ifNull: ['$distanceDelta', 0] } },
        eventCount: { $sum: 1 },
        sessionId: { $first: '$sessionId' }
      }
    },
    {
      $lookup: {
        from: 'athletes',
        localField: '_id',
        foreignField: 'athleteId',
        as: 'athlete'
      }
    },
    {
      $unwind: '$athlete'
    },
    {
      $lookup: {
        from: 'training_sessions',
        localField: 'sessionId',
        foreignField: 'sessionId',
        as: 'session'
      }
    },
    {
      $unwind: { path: '$session', preserveNullAndEmptyArrays: true }
    },
    {
      $project: {
        _id: 0,
        athleteId: '$_id',
        athleteName: {
          $concat: ['$athlete.firstName', ' ', '$athlete.lastName']
        },
        sport: '$session.sport',
        sessionId: 1,
        sessionStatus: '$session.status',
        latestHeartRate: { $round: ['$latestHeartRate', 0] },
        latestSpeed: { $round: ['$latestSpeed', 2] },
        latestTimestamp: 1,
        avgHeartRate: { $round: ['$avgHeartRate', 0] },
        maxHeartRate: 1,
        avgSpeed: { $round: ['$avgSpeed', 2] },
        maxSpeed: { $round: ['$maxSpeed', 2] },
        totalDistance: { $round: ['$totalDistance', 2] },
        eventCount: 1,
        dataAge: {
          $divide: [
            { $subtract: [new Date(), '$latestTimestamp'] },
            1000
          ]
        }
      }
    },
    {
      $sort: { latestTimestamp: -1 }
    }
  ];

  return db.collection('sensor_events').aggregate(pipeline).toArray();
}

/**
 * F15, F23: Administrator - Audit-Logs und rollenbasierte Zugriffskontrolle
 * US 11: Audit-Logs einsehen
 * NF7: Zugriff auf eigene Daten
 */
export async function getAuditLogSummary(
  db: Db,
  fromDate: Date,
  toDate: Date,
  action?: string
) {
  const matchStage: any = {
    timestamp: { $gte: fromDate, $lte: toDate }
  };

  if (action) {
    matchStage.action = action;
  }

  const pipeline: Document[] = [
    {
      $match: matchStage
    },
    {
      $group: {
        _id: {
          action: '$action',
          userId: '$userId',
          date: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          }
        },
        count: { $sum: 1 },
        firstOccurrence: { $min: '$timestamp' },
        lastOccurrence: { $max: '$timestamp' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id.userId',
        foreignField: 'userId',
        as: 'user'
      }
    },
    {
      $unwind: { path: '$user', preserveNullAndEmptyArrays: true }
    },
    {
      $project: {
        _id: 0,
        action: '$_id.action',
        userId: '$_id.userId',
        userName: '$user.name',
        userRole: '$user.role',
        date: '$_id.date',
        count: 1,
        firstOccurrence: 1,
        lastOccurrence: 1
      }
    },
    {
      $sort: { date: -1, action: 1 }
    }
  ];

  return db.collection('audit_logs').aggregate(pipeline).toArray();
}

/**
 * F13, F16: Administrator - Sensortypen- und Sportarten-Übersicht
 * US 9: Neue Sensortypen oder Sportarten hinzufügen
 * US 12: Vordefinierte Analyseabfragen ausführen
 */
export async function getSensorTypeUsageStats(
  db: Db,
  fromDate?: Date,
  toDate?: Date
) {
  const matchStage: any = {};

  if (fromDate || toDate) {
    matchStage.timestamp = {};
    if (fromDate) matchStage.timestamp.$gte = fromDate;
    if (toDate) matchStage.timestamp.$lte = toDate;
  }

  const pipeline: Document[] = [
    ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
    {
      $group: {
        _id: '$sensorType',
        totalEvents: { $sum: 1 },
        uniqueAthletes: { $addToSet: '$athleteId' },
        uniqueSessions: { $addToSet: '$sessionId' },
        avgEventsPerAthlete: { $avg: 1 },
        firstUsed: { $min: '$createdAt' },
        lastUsed: { $max: '$createdAt' }
      }
    },
    {
      $project: {
        _id: 0,
        sensorType: '$_id',
        totalEvents: 1,
        uniqueAthleteCount: { $size: '$uniqueAthletes' },
        uniqueSessionCount: { $size: '$uniqueSessions' },
        avgEventsPerSession: {
          $round: [
            { $divide: ['$totalEvents', { $size: '$uniqueSessions' }] },
            0
          ]
        },
        firstUsed: 1,
        lastUsed: 1
      }
    },
    {
      $sort: { totalEvents: -1 }
    }
  ];

  return db.collection('sensor_events').aggregate(pipeline).toArray();
}

/**
 * F10: Leistungsvergleich zwischen verschiedenen Trainingslevels
 * US 19: Vergleiche zwischen Sportlern durchführen
 */
export async function compareTrainingLevels(
  db: Db,
  sport: string,
  fromDate?: Date,
  toDate?: Date
) {
  const matchStage: any = { sport };

  if (fromDate || toDate) {
    matchStage.startAt = {};
    if (fromDate) matchStage.startAt.$gte = fromDate;
    if (toDate) matchStage.startAt.$lte = toDate;
  }

  const pipeline: Document[] = [
    {
      $match: matchStage
    },
    {
      $lookup: {
        from: 'athletes',
        localField: 'athleteId',
        foreignField: 'athleteId',
        as: 'athlete'
      }
    },
    {
      $unwind: '$athlete'
    },
    {
      $lookup: {
        from: 'sensor_events',
        localField: 'sessionId',
        foreignField: 'sessionId',
        as: 'events'
      }
    },
    {
      $unwind: { path: '$events', preserveNullAndEmptyArrays: false }
    },
    {
      $group: {
        _id: '$athlete.trainingLevel',
        athleteCount: { $addToSet: '$athleteId' },
        sessionCount: { $addToSet: '$sessionId' },
        avgHeartRate: { $avg: '$events.heartRate' },
        avgSpeed: { $avg: '$events.speed' },
        maxSpeed: { $max: '$events.speed' },
        totalDistance: { $sum: { $ifNull: ['$events.distanceDelta', 0] } },
        totalEvents: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        trainingLevel: '$_id',
        athleteCount: { $size: '$athleteCount' },
        sessionCount: { $size: '$sessionCount' },
        avgHeartRate: { $round: ['$avgHeartRate', 0] },
        avgSpeed: { $round: ['$avgSpeed', 2] },
        maxSpeed: { $round: ['$maxSpeed', 2] },
        totalDistance: { $round: ['$totalDistance', 2] },
        avgDistancePerSession: {
          $round: [
            { $divide: ['$totalDistance', { $size: '$sessionCount' }] },
            2
          ]
        },
        totalEvents: 1
      }
    },
    {
      $sort: { trainingLevel: 1 }
    }
  ];

  return db.collection('training_sessions').aggregate(pipeline).toArray();
}

/**
 * F21: Trainer - Trainingsnotizen mit Kontext
 * US 15: Notizen speichern und durchsuchen
 */
export async function getSessionsWithNotes(
  db: Db,
  athleteId?: string,
  fromDate?: Date,
  toDate?: Date
) {
  const matchStage: any = {
    notes: { $exists: true, $nin: [null, ''] }
  };

  if (athleteId) {
    matchStage.athleteId = athleteId;
  }

  if (fromDate || toDate) {
    matchStage.startAt = {};
    if (fromDate) matchStage.startAt.$gte = fromDate;
    if (toDate) matchStage.startAt.$lte = toDate;
  }

  const pipeline: Document[] = [
    {
      $match: matchStage
    },
    {
      $lookup: {
        from: 'athletes',
        localField: 'athleteId',
        foreignField: 'athleteId',
        as: 'athlete'
      }
    },
    {
      $unwind: '$athlete'
    },
    {
      $lookup: {
        from: 'sensor_events',
        localField: 'sessionId',
        foreignField: 'sessionId',
        as: 'events'
      }
    },
    {
      $project: {
        _id: 0,
        sessionId: 1,
        athleteId: 1,
        athleteName: {
          $concat: ['$athlete.firstName', ' ', '$athlete.lastName']
        },
        sport: 1,
        startAt: 1,
        endAt: 1,
        notes: 1,
        eventCount: { $size: '$events' },
        avgHeartRate: {
          $round: [{ $avg: '$events.heartRate' }, 0]
        },
        maxSpeed: {
          $round: [{ $max: '$events.speed' }, 2]
        }
      }
    },
    {
      $sort: { startAt: -1 }
    }
  ];

  return db.collection('training_sessions').aggregate(pipeline).toArray();
}

/**
 * NF1, NF3: Performance-Monitoring - Schreiblast-Analyse
 * US 8: Schreibrate & Latenz überwachen
 * F14: Überwachung der Daten-Pipelines
 */
export async function getWritePerformanceMetrics(
  db: Db,
  fromDate: Date,
  toDate: Date,
  groupByMinutes: number = 1
) {
  const pipeline: Document[] = [
    {
      $match: {
        createdAt: { $gte: fromDate, $lte: toDate }
      }
    },
    {
      $group: {
        _id: {
          interval: {
            $toDate: {
              $subtract: [
                { $toLong: '$createdAt' },
                { $mod: [{ $toLong: '$createdAt' }, groupByMinutes * 60 * 1000] }
              ]
            }
          },
          athleteId: '$athleteId'
        },
        eventCount: { $sum: 1 },
        avgLatencyMs: {
          $avg: { $subtract: ['$createdAt', '$timestamp'] }
        },
        maxLatencyMs: {
          $max: { $subtract: ['$createdAt', '$timestamp'] }
        }
      }
    },
    {
      $group: {
        _id: '$_id.interval',
        totalEvents: { $sum: '$eventCount' },
        activeAthletes: { $sum: 1 },
        avgLatencyMs: { $avg: '$avgLatencyMs' },
        maxLatencyMs: { $max: '$maxLatencyMs' },
        eventsPerAthlete: { $avg: '$eventCount' }
      }
    },
    {
      $project: {
        _id: 0,
        interval: '$_id',
        totalEvents: 1,
        activeAthletes: 1,
        eventsPerSecond: {
          $round: [{ $divide: ['$totalEvents', groupByMinutes * 60] }, 2]
        },
        avgLatencyMs: { $round: ['$avgLatencyMs', 0] },
        maxLatencyMs: { $round: ['$maxLatencyMs', 0] },
        eventsPerAthlete: { $round: ['$eventsPerAthlete', 0] }
      }
    },
    {
      $sort: { interval: 1 }
    }
  ];

  return db.collection('sensor_events').aggregate(pipeline).toArray();
}

/**
 * F10, NF9: Detaillierte Session-Analyse mit allen Metriken
 * US 3, US 7: Sensordaten in Echtzeit und Trainingshistorie
 * Konsistente Darstellung aller verfügbaren Trainingsmetriken
 */
export async function getDetailedSessionAnalysis(
  db: Db,
  sessionId: string
) {
  const pipeline: Document[] = [
    {
      $match: { sessionId }
    },
    {
      $facet: {
        // Grundlegende Statistiken
        summary: [
          {
            $group: {
              _id: null,
              totalEvents: { $sum: 1 },
              avgHeartRate: { $avg: '$heartRate' },
              minHeartRate: { $min: '$heartRate' },
              maxHeartRate: { $max: '$heartRate' },
              avgSpeed: { $avg: '$speed' },
              maxSpeed: { $max: '$speed' },
              totalDistance: { $sum: { $ifNull: ['$distanceDelta', 0] } },
              firstEvent: { $min: '$timestamp' },
              lastEvent: { $max: '$timestamp' },
              sensorTypes: { $addToSet: '$sensorType' }
            }
          }
        ],
        // Zeitbasierte Analyse (Minuten-Intervalle)
        timeSeriesData: [
          {
            $group: {
              _id: {
                $toDate: {
                  $subtract: [
                    { $toLong: '$timestamp' },
                    { $mod: [{ $toLong: '$timestamp' }, 60000] }
                  ]
                }
              },
              avgHeartRate: { $avg: '$heartRate' },
              avgSpeed: { $avg: '$speed' },
              distanceCovered: { $sum: { $ifNull: ['$distanceDelta', 0] } },
              eventCount: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } },
          { $limit: 500 }
        ],
        // Sensor-spezifische Statistiken
        bySensorType: [
          {
            $addFields: {
              hrValue: { $ifNull: ['$heartRate', '$metrics.heartRate'] },
              speedValue: { $ifNull: ['$speed', '$metrics.speed'] },
              distanceValue: { $ifNull: ['$distanceDelta', '$metrics.distanceDelta'] },
              powerValue: { $ifNull: ['$powerW', { $ifNull: ['$metrics.powerW', '$metrics.power'] }] },
              latValue: { $ifNull: ['$lat', '$metrics.lat'] },
              lonValue: { $ifNull: ['$lon', '$metrics.lon'] }
            }
          },
          {
            $group: {
              _id: '$sensorType',
              eventCount: { $sum: 1 },
              avgHeartRate: { $avg: '$hrValue' },
              minHeartRate: { $min: '$hrValue' },
              maxHeartRate: { $max: '$hrValue' },
              avgSpeed: { $avg: '$speedValue' },
              maxSpeed: { $max: '$speedValue' },
              totalDistance: { $sum: { $ifNull: ['$distanceValue', 0] } },
              avgPowerW: { $avg: '$powerValue' },
              maxPowerW: { $max: '$powerValue' },
              gpsPointCount: {
                $sum: {
                  $cond: [
                    { $and: [{ $ne: ['$latValue', null] }, { $ne: ['$lonValue', null] }] },
                    1,
                    0
                  ]
                }
              }
            }
          },
          {
            $project: {
              _id: 1,
              eventCount: 1,
              metrics: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ['$_id', 'heart-rate'] },
                      then: {
                        avgHeartRate: { $round: ['$avgHeartRate', 1] },
                        minHeartRate: '$minHeartRate',
                        maxHeartRate: '$maxHeartRate'
                      }
                    },
                    {
                      case: { $eq: ['$_id', 'gps'] },
                      then: {
                        avgSpeed: { $round: ['$avgSpeed', 2] },
                        maxSpeed: { $round: ['$maxSpeed', 2] },
                        totalDistanceM: { $round: ['$totalDistance', 2] },
                        gpsPointCount: '$gpsPointCount'
                      }
                    },
                    {
                      case: { $eq: ['$_id', 'power'] },
                      then: {
                        avgPowerW: { $round: ['$avgPowerW', 1] },
                        maxPowerW: '$maxPowerW'
                      }
                    }
                  ],
                  default: {
                    avgHeartRate: { $round: ['$avgHeartRate', 1] },
                    avgSpeed: { $round: ['$avgSpeed', 2] },
                    totalDistanceM: { $round: ['$totalDistance', 2] },
                    avgPowerW: { $round: ['$avgPowerW', 1] }
                  }
                }
              }
            }
          },
          {
            $sort: { _id: 1 }
          }
        ],
        gpsTrack: [
          {
            $addFields: {
              latValue: { $ifNull: ['$lat', '$metrics.lat'] },
              lonValue: { $ifNull: ['$lon', '$metrics.lon'] },
              speedValue: { $ifNull: ['$speed', '$metrics.speed'] },
              distanceValue: { $ifNull: ['$distanceDelta', '$metrics.distanceDelta'] }
            }
          },
          {
            $match: {
              sensorType: 'gps',
              latValue: { $ne: null },
              lonValue: { $ne: null }
            }
          },
          { $sort: { timestamp: 1 } },
          {
            $project: {
              _id: 0,
              timestamp: 1,
              lat: '$latValue',
              lon: '$lonValue',
              speed: '$speedValue',
              distanceDelta: '$distanceValue'
            }
          },
          { $limit: 5000 }
        ]
      }
    }
  ];

  const [result] = await db.collection('sensor_events').aggregate(pipeline).toArray();

  // Session-Informationen hinzufügen
  const session = await db.collection('training_sessions').findOne({ sessionId });
  const athlete = session ? await db.collection('athletes').findOne({ athleteId: session.athleteId }) : null;

  return {
    sessionId,
    session,
    athlete: athlete ? {
      athleteId: athlete.athleteId,
      name: `${athlete.firstName} ${athlete.lastName}`,
      trainingLevel: athlete.trainingLevel
    } : null,
    summary: result?.summary[0] || {},
    timeSeriesData: result?.timeSeriesData || [],
    bySensorType: result?.bySensorType || [],
    gpsTrack: result?.gpsTrack || []
  };
}

/**
 * F10: Leistungsranking für eine Sportart
 * US 19: Vergleiche zwischen Sportlern durchführen
 * NF10: Vergleiche übersichtlich ermöglichen
 */
export async function getSportLeaderboard(
  db: Db,
  sport: string,
  metric: 'speed' | 'heartRate' | 'distance' = 'speed',
  fromDate?: Date,
  toDate?: Date,
  limit: number = 10
) {
  const matchStage: any = { sport };

  if (fromDate || toDate) {
    matchStage.startAt = {};
    if (fromDate) matchStage.startAt.$gte = fromDate;
    if (toDate) matchStage.startAt.$lte = toDate;
  }

  const metricField = metric === 'distance' ? 'distanceDelta' : metric;
  const aggregateOp = metric === 'distance' ? '$sum' : '$max';

  const pipeline: Document[] = [
    {
      $match: matchStage
    },
    {
      $lookup: {
        from: 'sensor_events',
        localField: 'sessionId',
        foreignField: 'sessionId',
        as: 'events'
      }
    },
    {
      $unwind: { path: '$events', preserveNullAndEmptyArrays: false }
    },
    {
      $group: {
        _id: '$athleteId',
        bestValue:
          aggregateOp === '$sum'
            ? { $sum: { $ifNull: [`$events.${metricField}`, 0] } }
            : { $max: `$events.${metricField}` },
        sessionCount: { $addToSet: '$sessionId' },
        totalEvents: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'athletes',
        localField: '_id',
        foreignField: 'athleteId',
        as: 'athlete'
      }
    },
    {
      $unwind: '$athlete'
    },
    {
      $project: {
        _id: 0,
        athleteId: '$_id',
        athleteName: {
          $concat: ['$athlete.firstName', ' ', '$athlete.lastName']
        },
        trainingLevel: '$athlete.trainingLevel',
        bestValue: { $round: ['$bestValue', 2] },
        sessionCount: { $size: '$sessionCount' },
        totalEvents: 1
      }
    },
    {
      $sort: { bestValue: -1 }
    },
    {
      $limit: limit
    }
  ];

  return db.collection('training_sessions').aggregate(pipeline).toArray();
}

