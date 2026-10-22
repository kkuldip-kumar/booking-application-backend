import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from '../movies/entities/movie.entity';
import { ScreensModule } from '../screens/screens.module';
import { SeatLayoutsModule } from '../seat-layouts/seat-layouts.module';
import { AdminShowtimesController } from './admin-showtimes.controller';
import { ShowtimePricing } from './entities/showtime-pricing.entity';
import { ShowtimeSeat } from './entities/showtime-seat.entity';
import { Showtime } from './entities/showtime.entity';
import { ShowtimeOrderLookupService } from './showtime-order-lookup.service';
import { ShowtimeOperationsService } from './showtime-operations.service';
import { ShowtimeQueryService } from './showtime-query.service';
import { ShowtimeSchedulingService } from './showtime-scheduling.service';
import { ShowtimeSeatsService } from './showtime-seats.service';
import { ShowtimesController } from './showtimes.controller';
import { ShowtimesService } from './showtimes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Showtime, ShowtimePricing, ShowtimeSeat, Movie]), ScreensModule, SeatLayoutsModule],
  controllers: [ShowtimesController, AdminShowtimesController],
  providers: [ShowtimesService, ShowtimeOperationsService, ShowtimeQueryService, ShowtimeSchedulingService, ShowtimeSeatsService, ShowtimeOrderLookupService],
  exports: [ShowtimeSeatsService, ShowtimeQueryService, ShowtimeOrderLookupService],
})
export class ShowtimesModule {}
