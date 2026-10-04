import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min, ValidateNested } from 'class-validator';
import { CreditType } from '../../../common/enums/cinema.enums';
import { MovieCredit } from '../entities/movie-credit.entity';

export const MAX_CREDITS_PER_MOVIE = 200;

export class AddCreditDto {
  @IsUUID('4') personId!: string;
  @IsEnum(CreditType) creditType!: CreditType;
  @IsOptional() @IsString() @Length(1, 150) characterName?: string;
  @IsOptional() @IsInt() @Min(0) @Max(1000) displayOrder?: number;
}

export class UpdateCreditDto {
  @IsOptional() @IsString() @Length(1, 150) characterName?: string;
  @IsOptional() @IsInt() @Min(0) @Max(1000) displayOrder?: number;
}

export class ReplaceCreditsDto {
  @IsArray() @ArrayMaxSize(MAX_CREDITS_PER_MOVIE) @ValidateNested({ each: true }) @Type(() => AddCreditDto)
  credits!: AddCreditDto[];
}

export class CreditResponseDto {
  id!: string;
  movieId!: string;
  person!: { id: string; name: string; slug: string; profileImageUrl: string | null };
  creditType!: CreditType;
  characterName!: string | null;
  displayOrder!: number;

  static from(credit: MovieCredit): CreditResponseDto {
    return {
      id: credit.id, movieId: credit.movieId,
      person: { id: credit.person.id, name: credit.person.name, slug: credit.person.slug, profileImageUrl: credit.person.profileImageUrl },
      creditType: credit.creditType, characterName: credit.characterName, displayOrder: credit.displayOrder,
    };
  }
}
