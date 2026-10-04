import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreditType } from '../../common/enums/credit-type.enum';
import { LanguageType } from '../../common/enums/language-type.enum';
import { assertNotArchived, lockMovieOrFail } from './domain/movie-persistence';
import { loadAllOrFail } from './domain/reference-loader';
import { CreditItemDto, SetCreditsDto, SetLanguagesDto } from './dto/movie-relations.dto';
import { AdminMovieDetailDto } from './dto/movie-response.dto';
import { Language } from './entities/language.entity';
import { MovieCredit } from './entities/movie-credit.entity';
import { MovieLanguage } from './entities/movie-language.entity';
import { Person } from './entities/person.entity';
import { MovieAuditService } from './movie-audit.service';
import { MoviesService } from './movies.service';

@Injectable()
export class MovieRelationsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly audit: MovieAuditService,
    private readonly movies: MoviesService,
  ) {}

  // Full replace keeps the API idempotent: the admin UI always submits the whole cast & crew list.
  async setCredits(actorId: string, movieId: string, dto: SetCreditsDto): Promise<AdminMovieDetailDto> {
    this.assertValidCredits(dto.credits);
    await this.dataSource.transaction(async (manager) => {
      assertNotArchived(await lockMovieOrFail(manager, movieId));
      await loadAllOrFail(manager, Person, dto.credits.map((c) => c.personId), 'people');
      await manager.delete(MovieCredit, { movieId });
      if (dto.credits.length === 0) return;
      await manager.insert(
        MovieCredit,
        dto.credits.map((credit) => ({
          movieId,
          personId: credit.personId,
          creditType: credit.creditType,
          characterName: credit.characterName ?? null,
          displayOrder: credit.displayOrder,
        })),
      );
    });
    await this.audit.record({
      actorId, action: 'movie.credits_replaced', movieId, metadata: { count: dto.credits.length },
    });
    return this.movies.getAdmin(movieId);
  }

  async setLanguages(actorId: string, movieId: string, dto: SetLanguagesDto): Promise<AdminMovieDetailDto> {
    await this.dataSource.transaction(async (manager) => {
      assertNotArchived(await lockMovieOrFail(manager, movieId));
      const all = [...dto.audioLanguageIds, ...dto.subtitleLanguageIds];
      await loadAllOrFail(manager, Language, all, 'languages');
      await manager.delete(MovieLanguage, { movieId });
      const rows = [
        ...dto.audioLanguageIds.map((languageId) => ({ movieId, languageId, languageType: LanguageType.AUDIO })),
        ...dto.subtitleLanguageIds.map((languageId) => ({ movieId, languageId, languageType: LanguageType.SUBTITLE })),
      ];
      if (rows.length > 0) await manager.insert(MovieLanguage, rows);
    });
    await this.audit.record({
      actorId, action: 'movie.languages_replaced', movieId,
      metadata: { audio: dto.audioLanguageIds.length, subtitles: dto.subtitleLanguageIds.length },
    });
    return this.movies.getAdmin(movieId);
  }

  private assertValidCredits(credits: readonly CreditItemDto[]): void {
    const seen = new Set<string>();
    for (const credit of credits) {
      const key = `${credit.personId}:${credit.creditType}`;
      if (seen.has(key)) throw new BadRequestException('Duplicate person/credit type pair');
      seen.add(key);
      if (credit.characterName !== undefined && credit.creditType !== CreditType.CAST) {
        throw new BadRequestException('characterName is only allowed for CAST credits');
      }
    }
  }
}
