import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminCinemasController } from './admin-cinemas.controller';
import { CinemasController } from './cinemas.controller';
import { CinemasService } from './cinemas.service';
import { CinemaImage } from './entities/cinema-image.entity';
import { Cinema } from './entities/cinema.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cinema, CinemaImage])],
  controllers: [CinemasController, AdminCinemasController],
  providers: [CinemasService],
  exports: [CinemasService],
})
export class CinemasModule {}
