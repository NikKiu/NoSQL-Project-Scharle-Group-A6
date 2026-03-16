import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { MongoService } from '../mongo.service';
import { SessionsService } from '../sessions/sessions.service';
import { AthletesService } from '../athletes/athletes.service';
import { RequestUser } from '../common/auth/auth.types';
import { createId } from '../common/utils/id';
import { ensureString, parseDate, parseLimit, parseOptionalNumber } from '../common/utils/parse';
import { SensorEventDocument } from './sensor-events.types';
import { TrainingSessionDocument } from '../sessions/sessions.types';

interface SensorTypeConfig {
  sensorType: string;
  generatorType?: 'heart-rate' | 'gps' | 'power' | 'custom' | null;
  generatorConfig?: {
    metricKey?: string;
    base?: number;
    amplitude?: number;
    noise?: number;
    min?: number;
    max?: number;
    frequencyDivisor?: number;
  } | null;
}

@Injectable()
export class SensorEventsService {
  constructor(
    private readonly mongoService: MongoService,
    private readonly sessionsService: SessionsService,
    private readonly athletesService: AthletesService
  ) {}

  private collection() {
    return this.mongoService.getDb().collection<SensorEventDocument>('sensor_events');
  }

  private clamp(value: number, min?: number, max?: number): number {
    if (Number.isFinite(min) && value < (min as number)) return min as number;
    if (Number.isFinite(max) && value > (max as number)) return max as number;
    return value;
  }

  private createWaveValue(
    phase: number,
    base: number,
    amplitude: number,
    noise: number,
    frequencyDivisor: number,
    min?: number,
    max?: number
  ): number {
    const raw = base + Math.sin(phase / Math.max(1, frequencyDivisor)) * amplitude + (Math.random() - 0.5) * noise;
    return this.clamp(raw, min, max);
  }

  private async getLastGpsPoint(sessionId: string): Promise<{ lat: number; lon: number } | null> {
    const lastGps = await this.collection()
      .find({ sessionId, sensorType: 'gps' }, { projection: { _id: 0, lat: 1, lon: 1, metrics: 1 } })
      .sort({ timestamp: -1 })
      .limit(1)
      .next();

    if (!lastGps) return null;
    const lat = Number(lastGps.lat ?? (lastGps.metrics as any)?.lat);
    const lon = Number(lastGps.lon ?? (lastGps.metrics as any)?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { lat, lon };
  }

  private async buildSimulatedEvents(
    session: TrainingSessionDocument,
    timestamp: Date
  ): Promise<SensorEventDocument[]> {
    const db = this.mongoService.getDb();
    const sensorTypes = Array.isArray(session.sensorTypes) && session.sensorTypes.length > 0 ? session.sensorTypes : ['heart-rate', 'gps'];

    const sensorConfigs = await db
      .collection<SensorTypeConfig>('sensor_types')
      .find({ sensorType: { $in: sensorTypes } }, { projection: { _id: 0 } })
      .toArray();
    const configByType = new Map(sensorConfigs.map((cfg) => [cfg.sensorType, cfg]));

    const elapsedSeconds = Math.max(0, (timestamp.getTime() - new Date(session.startAt).getTime()) / 1000);
    const phase = elapsedSeconds / 5;
    const warmup = Math.min(elapsedSeconds / (12 * 60), 1);
    const cooldown = Math.max((elapsedSeconds - 45 * 60) / (12 * 60), 0);

    const sportProfile = session.sport === 'cycling'
      ? { hr: 138, speed: 27, power: 240 }
      : session.sport === 'swimming'
        ? { hr: 130, speed: 4, power: 155 }
        : { hr: 145, speed: 12, power: 185 };

    const heartRate = Math.round(
      this.createWaveValue(
        phase,
        sportProfile.hr + warmup * 22 - cooldown * 16,
        9,
        6,
        11,
        85,
        205
      )
    );

    const speed = Number(
      Math.max(
        0.6,
        this.createWaveValue(
          phase,
          sportProfile.speed * (0.7 + warmup * 0.35) * (1 - cooldown * 0.35),
          session.sport === 'swimming' ? 0.6 : 1.8,
          session.sport === 'swimming' ? 0.35 : 0.8,
          13,
          0.4,
          session.sport === 'swimming' ? 8 : 60
        )
      ).toFixed(2)
    );

    const distanceDelta = Number(((speed * 2) / 3.6).toFixed(2));
    const powerW = Math.round(this.createWaveValue(phase, sportProfile.power + warmup * 40 - cooldown * 25, 22, 18, 10, 70, 700));

    const lastGps = await this.getLastGpsPoint(session.sessionId);
    let lat = lastGps?.lat ?? 48.137154 + (Math.random() - 0.5) * 0.004;
    let lon = lastGps?.lon ?? 11.576124 + (Math.random() - 0.5) * 0.004;
    const heading = (phase / 7) % (2 * Math.PI);
    const northMeters = Math.cos(heading) * distanceDelta;
    const eastMeters = Math.sin(heading) * distanceDelta;
    const metersPerDegLat = 111320;
    const metersPerDegLon = Math.max(20000, 111320 * Math.cos((lat * Math.PI) / 180));
    lat += northMeters / metersPerDegLat;
    lon += eastMeters / metersPerDegLon;

    return sensorTypes.map((sensorType) => {
      const config = configByType.get(sensorType);
      const generatorType = config?.generatorType ?? (sensorType as any);
      const generatorConfig = config?.generatorConfig ?? {};
      const event: SensorEventDocument = {
        eventId: createId('event'),
        athleteId: session.athleteId,
        sessionId: session.sessionId,
        timestamp,
        sensorType,
        metrics: {},
        createdAt: new Date()
      };

      if (generatorType === 'heart-rate' || sensorType === 'heart-rate') {
        event.heartRate = heartRate;
        event.metrics = { heartRate };
        return event;
      }

      if (generatorType === 'gps' || sensorType === 'gps') {
        event.speed = speed;
        event.distanceDelta = distanceDelta;
        event.lat = Number(lat.toFixed(6));
        event.lon = Number(lon.toFixed(6));
        event.metrics = {
          speed: event.speed,
          distanceDelta: event.distanceDelta,
          lat: event.lat,
          lon: event.lon
        };
        return event;
      }

      if (generatorType === 'power' || sensorType === 'power') {
        event.powerW = powerW;
        event.metrics = { powerW };
        return event;
      }

      const metricKey = generatorConfig.metricKey?.toString().trim() || sensorType.replace(/[^a-zA-Z0-9]/g, '_');
      const customValue = Number(
        this.createWaveValue(
          phase,
          Number(generatorConfig.base ?? 50),
          Number(generatorConfig.amplitude ?? 12),
          Number(generatorConfig.noise ?? 6),
          Number(generatorConfig.frequencyDivisor ?? 10),
          Number.isFinite(Number(generatorConfig.min)) ? Number(generatorConfig.min) : undefined,
          Number.isFinite(Number(generatorConfig.max)) ? Number(generatorConfig.max) : undefined
        ).toFixed(2)
      );
      event.metrics = { [metricKey]: customValue };
      return event;
    });
  }

  private async normalizeEvent(body: any, user: RequestUser): Promise<SensorEventDocument> {
    const sessionId = ensureString(body.sessionId, 'sessionId');
    const session = await this.sessionsService.getById(sessionId, user);
    const athlete = await this.athletesService.getById(session.athleteId, user);

    if (user.role === 'athlete' && athlete.userId !== user.userId) {
      throw new ForbiddenException('Athletes can only write their own sensor data');
    }

    const timestamp = parseDate(body.timestamp, 'timestamp');
    const sensorType = ensureString(body.sensorType, 'sensorType');
    const metrics = body.metrics && typeof body.metrics === 'object' ? body.metrics : {};

    const heartRate = parseOptionalNumber(body.heartRate ?? metrics.heartRate, 'heartRate');
    const speed = parseOptionalNumber(body.speed ?? metrics.speed, 'speed');
    const distanceDelta = parseOptionalNumber(body.distanceDelta ?? metrics.distanceDelta, 'distanceDelta');
    const lat = parseOptionalNumber(body.lat ?? metrics.lat, 'lat');
    const lon = parseOptionalNumber(body.lon ?? metrics.lon, 'lon');
    const powerW = parseOptionalNumber(body.powerW ?? metrics.powerW ?? metrics.power, 'powerW');

    return {
      eventId: body.eventId?.toString().trim() || createId('event'),
      athleteId: session.athleteId,
      sessionId,
      timestamp,
      sensorType,
      metrics,
      heartRate,
      speed,
      distanceDelta,
      lat,
      lon,
      powerW,
      createdAt: new Date()
    };
  }

  async create(body: any, user: RequestUser) {
    const event = await this.normalizeEvent(body, user);
    try {
      await this.collection().insertOne(event as any);
      return event;
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new BadRequestException('eventId already exists');
      }
      throw error;
    }
  }

  async createBatch(body: any, user: RequestUser) {
    if (!Array.isArray(body.events) || body.events.length === 0) {
      throw new BadRequestException('events must be a non-empty array');
    }

    if (body.events.length > 5000) {
      throw new BadRequestException('Max 5000 events per request');
    }

    const events = await Promise.all(body.events.map((event: any) => this.normalizeEvent(event, user)));
    await this.collection().insertMany(events as any[], { ordered: false });

    return {
      insertedCount: events.length,
      firstEventAt: events[0]?.timestamp,
      lastEventAt: events[events.length - 1]?.timestamp
    };
  }

  public async simulateAndCreate(body: any, user: RequestUser) {
    const sessionId = ensureString(body.sessionId, 'sessionId');
    const timestamp = body.timestamp ? parseDate(body.timestamp, 'timestamp') : new Date();
    const session = await this.sessionsService.getById(sessionId, user);

    if (session.status !== 'active') {
      throw new BadRequestException('Simulation ist nur für aktive Sessions erlaubt');
    }

    const events = await this.buildSimulatedEvents(session, timestamp);
    await this.collection().insertMany(events as any[], { ordered: true });

    const heartRateEvent = events.find((event) => event.sensorType === 'heart-rate');
    const gpsEvent = events.find((event) => event.sensorType === 'gps');
    const powerEvent = events.find((event) => event.sensorType === 'power');

    return {
      insertedCount: events.length,
      timestamp: timestamp.toISOString(),
      events,
      sample: {
        heartRate: heartRateEvent?.heartRate,
        speed: gpsEvent?.speed,
        distanceDelta: gpsEvent?.distanceDelta,
        lat: gpsEvent?.lat,
        lon: gpsEvent?.lon,
        powerW: powerEvent?.powerW
      }
    };
  }

  async recentForAthlete(athleteId: string, user: RequestUser, query: any) {
    await this.athletesService.getById(athleteId, user);

    const seconds = Number(query.seconds || 600);
    if (!Number.isFinite(seconds) || seconds <= 0) {
      throw new BadRequestException('seconds must be a positive number');
    }

    const since = new Date(Date.now() - seconds * 1000);
    const limit = parseLimit(query.limit, 500, 5000);

    return this.collection()
      .find({ athleteId, timestamp: { $gte: since } })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }
}
