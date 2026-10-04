import { IsEnum, IsInt, IsOptional, IsUrl, Length, Max, Min } from 'class-validator';
import { CinemaImageType } from '../../../common/enums/cinema.enums';
import { CinemaImage } from '../entities/cinema-image.entity';

export class AddCinemaImageDto {
  // Stored only, never fetched server-side (VAPT API7).
  @IsUrl({ protocols: ['https'], require_protocol: true }) @Length(10, 500) url!: string;
  @IsOptional() @IsEnum(CinemaImageType) type?: CinemaImageType;
  @IsOptional() @IsInt() @Min(0) @Max(1000) sortOrder?: number;
}

export class CinemaImageResponseDto {
  id!: string;
  url!: string;
  type!: CinemaImageType;
  sortOrder!: number;

  static from(image: CinemaImage): CinemaImageResponseDto {
    return { id: image.id, url: image.url, type: image.type, sortOrder: image.sortOrder };
  }
}
