import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUrl, Length, MaxLength } from 'class-validator';
import { trimString } from '../../../common/utils/transformers';

export class CreateGenreDto {
  @Transform(trimString)
  @IsString()
  @Length(1, 60)
  name!: string;
}

export class CreatePersonDto {
  @Transform(trimString)
  @IsString()
  @Length(1, 200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  biography?: string;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(500)
  profileImageUrl?: string;
}

export class SearchPeopleQueryDto {
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @Length(1, 100)
  q?: string;
}
