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

    await Promise.all([
      this.db.collection('athletes').createIndex({ athleteId: 1 }, { unique: true }),
      this.db.collection('athletes').createIndex({ userId: 1 }, { unique: true }),
      this.db.collection('training_sessions').createIndex({ sessionId: 1 }, { unique: true }),
      this.db.collection('training_sessions').createIndex({ athleteId: 1, startAt: -1 }),
      this.db.collection('sensor_events').createIndex({ eventId: 1 }, { unique: true }),
      this.db.collection('sensor_events').createIndex({ athleteId: 1, timestamp: -1 }),
      this.db.collection('sensor_events').createIndex({ sessionId: 1, timestamp: -1 }),
      this.db.collection('sensor_events').createIndex({ sessionId: 1, sensorType: 1, timestamp: -1 })
    ]);
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
