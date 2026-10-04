import { PartialType } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUrl, Length, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { CreditType } from '../../../common/enums/cinema.enums';
import { Person } from '../entities/person.entity';

export class CreatePersonDto {
  @IsString() @Length(2, 150) name!: string;
  @IsOptional() @IsString() @MaxLength(5000) biography?: string;
  @IsOptional() @IsUrl({ protocols: ['https'], require_protocol: true }) @MaxLength(500) profileImageUrl?: string;
  @IsOptional() @IsDateString({ strict: true }) birthDate?: string;
}

export class UpdatePersonDto extends PartialType(CreatePersonDto) {}

export class QueryPeopleDto extends PaginationQueryDto {
  @IsOptional() @IsString() @Length(1, 100) q?: string;
}

export class FilmographyItemDto {
  movieId!: string;
  title!: string;
  creditType!: CreditType;
  characterName!: string | null;
}

export class PersonResponseDto {
  id!: string;
  name!: string;
  slug!: string;
  biography!: string | null;
  profileImageUrl!: string | null;
  birthDate!: string | null;
  isActive!: boolean;
  filmography?: FilmographyItemDto[];

  static from(person: Person, filmography?: FilmographyItemDto[]): PersonResponseDto {
    return {
      id: person.id, name: person.name, slug: person.slug, biography: person.biography,
      profileImageUrl: person.profileImageUrl, birthDate: person.birthDate, isActive: person.isActive, filmography,
    };
  }
}
