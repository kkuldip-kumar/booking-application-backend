// src/modules/cities/dto/city-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { City } from '../entities/city.entity';

export class CityResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() state!: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() cinemaCount!: number;

  static from(city: City): CityResponseDto {
    const dto = new CityResponseDto();
    dto.id = city.id;
    dto.name = city.name;
    dto.slug = city.slug;
    dto.state = city.state;
    dto.isActive = city.isActive;
    dto.cinemaCount = city.cinemaCount ?? 0;
    return dto;
  }
}