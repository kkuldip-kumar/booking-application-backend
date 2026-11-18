import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { MonitoringService } from './monitoring.service';
import { HealthController } from './health.controller';

@Module({ imports: [TerminusModule], controllers: [HealthController], providers: [MonitoringService] })
export class MonitoringModule {}