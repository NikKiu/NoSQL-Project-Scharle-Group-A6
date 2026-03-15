import { Module } from '@nestjs/common';
import { MongoModule } from './mongo.module';
import { HealthModule } from './health/health.module';
import { AthletesModule } from './athletes/athletes.module';
import { SessionsModule } from './sessions/sessions.module';
import { SensorEventsModule } from './sensor-events/sensor-events.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [MongoModule, HealthModule, AthletesModule, SessionsModule, SensorEventsModule, AnalyticsModule, AdminModule, AuthModule]
})
export class AppModule {}
