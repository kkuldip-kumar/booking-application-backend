import { Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayUnique, IsArray, IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min,
  ValidateNested,
} from 'class-validator';
import { CreditType } from '../../../common/enums/credit-type.enum';
import { MAX_CREDITS_PER_MOVIE, MAX_LANGUAGES_PER_LIST } from '../movies.constants';

export class CreditItemDto {
  @IsUUID('4')
  personId!: string;

  @IsEnum(CreditType)
  creditType!: CreditType;

  /** Only meaningful for CAST credits. */
  @IsOptional()
  @IsString()
  @Length(1, 150)
  characterName?: string;

  @IsInt()
  @Min(0)
  @Max(1000)
  displayOrder!: number;
}

export class SetCreditsDto {
  @IsArray()
  @ArrayMaxSize(MAX_CREDITS_PER_MOVIE)
  @ValidateNested({ each: true })
  @Type(() => CreditItemDto)
  credits!: CreditItemDto[];
}

export class SetLanguagesDto {
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(MAX_LANGUAGES_PER_LIST)
  @IsUUID('4', { each: true })
  audioLanguageIds!: string[];

  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(MAX_LANGUAGES_PER_LIST)
  @IsUUID('4', { each: true })
  subtitleLanguageIds!: string[];
}
