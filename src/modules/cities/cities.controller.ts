// src/modules/cities/cities.controller.ts
import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Paginated } from '../../common/utils/paginate';
import { CitiesService } from './cities.service';
import { CityResponseDto } from './dto/city-response.dto';
import { QueryCitiesDto } from './dto/query-cities.dto';

@ApiTags('cities')
@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List active cities' })
  @ApiOkResponse({ type: CityResponseDto, isArray: true })
  async list(@Query() query: QueryCitiesDto): Promise<Paginated<CityResponseDto>> {
    const page = await this.citiesService.findAll(query, false);
    return { ...page, items: page.items.map(CityResponseDto.from) };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get an active city' })
  @ApiOkResponse({ type: CityResponseDto })
  async get(@Param('id', ParseUUIDPipe) id: string): Promise<CityResponseDto> {
    return CityResponseDto.from(await this.citiesService.findOne(id, false));
  }
}