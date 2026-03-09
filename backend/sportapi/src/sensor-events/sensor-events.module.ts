import { Module } from '@nestjs/common';
import { SensorEventsController } from './sensor-events.controller';
import { SensorEventsService } from './sensor-events.service';
import { SessionsModule } from '../sessions/sessions.module';
import { AthletesModule } from '../athletes/athletes.module';

@Module({
  imports: [SessionsModule, AthletesModule],
  controllers: [SensorEventsController],
  providers: [SensorEventsService],
  exports: [SensorEventsService]
})
export class SensorEventsModule {}
