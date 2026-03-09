import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AthletesModule } from '../athletes/athletes.module';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [AthletesModule, SessionsModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService]
})
export class AnalyticsModule {}
