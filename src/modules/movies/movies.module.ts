import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { AdminMoviesController } from './admin-movies.controller';
import { AgeRating } from './entities/age-rating.entity';
import { Format } from './entities/format.entity';
import { Genre } from './entities/genre.entity';
import { Language } from './entities/language.entity';
import { Movie } from './entities/movie.entity';
import { MovieAsset } from './entities/movie-asset.entity';
import { MovieCredit } from './entities/movie-credit.entity';
import { MovieLanguage } from './entities/movie-language.entity';
import { MovieStatusHistory } from './entities/movie-status-history.entity';
import { Person } from './entities/person.entity';
import { AdminLookupsController, LookupsController } from './lookups.controller';
import { LookupsService } from './lookups.service';
import { MovieAssetsService } from './movie-assets.service';
import { MovieAuditService } from './movie-audit.service';
import { MovieLifecycleService } from './movie-lifecycle.service';
import { MovieQueryService } from './movie-query.service';
import { MovieRelationsService } from './movie-relations.service';
import { MOVIE_SCHEDULE_QUEUE, MEDIA_STORAGE } from './movies.constants';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { MovieScheduleProcessor } from './schedule/movie-schedule.processor';
import { MovieScheduleRegistrar } from './schedule/movie-schedule.registrar';
import { MovieScheduleService } from './schedule/movie-schedule.service';
import { LocalMediaStorage } from './storage/local-media-storage';

@Module({
  imports: [
    AuditModule,
    BullModule.registerQueue({ name: MOVIE_SCHEDULE_QUEUE }),
    TypeOrmModule.forFeature([
      Movie, AgeRating, Genre, Format, Language, Person,
      MovieCredit, MovieLanguage, MovieAsset, MovieStatusHistory,
    ]),
  ],
  controllers: [MoviesController, AdminMoviesController, LookupsController, AdminLookupsController],
  providers: [
    MoviesService,
    MovieQueryService,
    MovieLifecycleService,
    MovieRelationsService,
    MovieAssetsService,
    MovieAuditService,
    LookupsService,
    MovieScheduleService,
    MovieScheduleProcessor,
    MovieScheduleRegistrar,
    { provide: MEDIA_STORAGE, useClass: LocalMediaStorage },
  ],
  exports: [MoviesService],
})
export class MoviesModule {}
