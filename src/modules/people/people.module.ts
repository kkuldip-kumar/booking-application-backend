import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from '../movies/entities/movie.entity';
import { AdminPeopleController } from './admin-people.controller';
import { CreditsService } from './credits.service';
import { MovieCredit } from './entities/movie-credit.entity';
import { Person } from './entities/person.entity';
import { PeopleController } from './people.controller';
import { PeopleService } from './people.service';

@Module({
  imports: [TypeOrmModule.forFeature([Person, MovieCredit, Movie])],
  controllers: [PeopleController, AdminPeopleController],
  providers: [PeopleService, CreditsService],
  exports: [PeopleService, CreditsService],
})
export class PeopleModule {}
