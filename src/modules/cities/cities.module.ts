// src/modules/cities/cities.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AdminCitiesController } from './admin-cities.controller';
import { CitiesController } from './cities.controller';
import { CitiesService } from './cities.service';
import { City } from './entities/city.entity';

@Module({
  imports: [TypeOrmModule.forFeature([City]), AuditLogsModule],
  controllers: [CitiesController, AdminCitiesController],
  providers: [CitiesService],
  exports: [CitiesService],
})
export class CitiesModule {}