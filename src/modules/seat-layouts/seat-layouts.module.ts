import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScreensModule } from '../screens/screens.module';
import { SeatLayout } from './entities/seat-layout.entity';
import { SeatType } from './entities/seat-type.entity';
import { Seat } from './entities/seat.entity';
import { SeatLayoutsController } from './seat-layouts.controller';
import { SeatLayoutsService } from './seat-layouts.service';

@Module({
  imports: [TypeOrmModule.forFeature([SeatLayout, Seat, SeatType]), ScreensModule],
  controllers: [SeatLayoutsController],
  providers: [SeatLayoutsService],
  exports: [SeatLayoutsService],
})
export class SeatLayoutsModule {}
