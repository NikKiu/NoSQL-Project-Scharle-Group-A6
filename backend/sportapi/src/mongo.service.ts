import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  private client: MongoClient;
  private db: Db;

  async onModuleInit() {
    await this.connectToMongo();
  }

  async onModuleDestroy() {
    await this.close();
  }

  private resolveDbName(uriFromEnv?: string): string {
    if (process.env.MONGODB_DB_NAME) return process.env.MONGODB_DB_NAME;
    if (!uriFromEnv) return 'sport_performance';

    try {
      const parsed = new URL(uriFromEnv);
      const dbName = parsed.pathname?.replace(/^\//, '');
      return dbName || 'sport_performance';
    } catch {
      return 'sport_performance';
    }
  }

  private async connectToMongo() {
    if (this.db) return;

    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
    const dbName = this.resolveDbName(process.env.MONGODB_URI);

    this.client = new MongoClient(uri);
    await this.client.connect();
    this.db = this.client.db(dbName);

    await this.ensureRequiredTimeSeriesCollection();

    const sensorRetentionSeconds = Number(process.env.SENSOR_EVENTS_RETENTION_SECONDS || 0);
    const auditLogRetentionSeconds = Number(process.env.AUDIT_LOG_RETENTION_SECONDS || 60 * 60 * 24 * 180);

    await Promise.all([
      this.db.collection('users').createIndex({ userId: 1 }, { unique: true }),
      this.db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true }),
      this.db.collection('athletes').createIndex({ athleteId: 1 }, { unique: true }),
      this.db.collection('athletes').createIndex({ userId: 1 }, { unique: true }),
      this.db.collection('training_sessions').createIndex({ sessionId: 1 }, { unique: true }),
      this.db.collection('training_sessions').createIndex({ athleteId: 1, startAt: -1 }),
      this.db.collection('sensor_events').createIndex({ eventId: 1 }),
      this.db.collection('sensor_events').createIndex({ athleteId: 1, timestamp: -1 }),
      this.db.collection('sensor_events').createIndex({ sessionId: 1, timestamp: -1 }),
      this.db.collection('sensor_events').createIndex({ sessionId: 1, sensorType: 1, timestamp: -1 }),
      this.db.collection('sensor_types').createIndex({ sensorType: 1 }, { unique: true })
    ]);

    await this.syncTtlIndex('sensor_events', sensorRetentionSeconds);
    await this.syncTtlIndex('audit_logs', auditLogRetentionSeconds);
  }

  private async syncTtlIndex(collectionName: string, expireAfterSeconds: number) {
    const existing = await this.db.listCollections({ name: collectionName }).toArray();
    if (existing.length === 0) {
      if (collectionName === 'sensor_events') {
        await this.ensureRequiredTimeSeriesCollection();
      } else {
        await this.db.createCollection(collectionName);
      }
    }

    const collection = this.db.collection(collectionName);
    const indexes = await collection.indexes();
    const timestampIndex = indexes.find((index) => index.name === 'timestamp_1');

    if (!timestampIndex) {
      if (expireAfterSeconds > 0) {
        await collection.createIndex({ timestamp: 1 }, { expireAfterSeconds });
      } else {
        await collection.createIndex({ timestamp: 1 });
      }
      return;
    }

    const currentTtl = typeof timestampIndex.expireAfterSeconds === 'number' ? timestampIndex.expireAfterSeconds : 0;
    const wantedTtl = expireAfterSeconds > 0 ? expireAfterSeconds : 0;

    if (currentTtl !== wantedTtl) {
      await collection.dropIndex('timestamp_1');
      if (wantedTtl > 0) {
        await collection.createIndex({ timestamp: 1 }, { expireAfterSeconds: wantedTtl });
      } else {
        await collection.createIndex({ timestamp: 1 });
      }
    }
  }

  private async ensureRequiredTimeSeriesCollection() {
    const existing = await this.db.listCollections({ name: 'sensor_events' }).toArray();
    if (existing.length === 0) {
      await this.db.createCollection('sensor_events', {
        timeseries: {
          timeField: 'timestamp',
          metaField: 'athleteId',
          granularity: 'seconds'
        }
      });
      return;
    }

    const options = (existing[0] as any)?.options ?? {};
    const timeseries = options?.timeseries;
    const valid =
      timeseries &&
      timeseries.timeField === 'timestamp' &&
      timeseries.metaField === 'athleteId';

    if (!valid) {
      throw new Error(
        'Collection "sensor_events" muss als MongoDB Time-Series-Collection konfiguriert sein (timeField=timestamp, metaField=athleteId). Bitte Migration durchführen.'
      );
    }
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('Mongo connection is not initialized yet');
    }
    return this.db;
  }

  async close() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }
}
