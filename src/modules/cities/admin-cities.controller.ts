// src/modules/cities/admin-cities.controller.ts
import {
  Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { Paginated } from '../../common/utils/paginate';
import { CitiesService } from './cities.service';
import { CityResponseDto } from './dto/city-response.dto';
import { CreateCityDto } from './dto/create-city.dto';
import { AdminQueryCitiesDto } from './dto/query-cities.dto';
import { UpdateCityDto } from './dto/update-city.dto';

@ApiTags('admin-cities')
@Roles(Role.ADMIN)
@Controller('admin/cities')
export class AdminCitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  @ApiOperation({ summary: 'List all cities incl. inactive' })
  @ApiOkResponse({ type: CityResponseDto, isArray: true })
  async list(@Query() query: AdminQueryCitiesDto): Promise<Paginated<CityResponseDto>> {
    const page = await this.citiesService.findAll(query, true);
    return { ...page, items: page.items.map(CityResponseDto.from) };
  }

  @Post()
  @ApiOperation({ summary: 'Create city' })
  @ApiOkResponse({ type: CityResponseDto })
  async create(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateCityDto,
  ): Promise<CityResponseDto> {
    return CityResponseDto.from(await this.citiesService.create(user.id, dto));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update city' })
  @ApiOkResponse({ type: CityResponseDto })
  async update(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCityDto,
  ): Promise<CityResponseDto> {
    return CityResponseDto.from(await this.citiesService.update(user.id, id, dto));
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete city (only when it has no cinemas)' })
  async remove(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.citiesService.remove(user.id, id);
  }
}