import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CreateGenreDto, CreatePersonDto, SearchPeopleQueryDto } from './dto/lookup.dto';
import { AgeRatingDto, FormatDto, GenreDto, LanguageDto, PersonDto } from './dto/movie-response.dto';
import { LookupsService } from './lookups.service';

@ApiTags('Catalog lookups')
@Public()
@Controller()
export class LookupsController {
  constructor(private readonly lookups: LookupsService) {}

  @Get('genres')
  @ApiOperation({ summary: 'List genres' })
  @ApiOkResponse({ type: [GenreDto] })
  genres(): Promise<GenreDto[]> {
    return this.lookups.listGenres();
  }

  @Get('languages')
  @ApiOperation({ summary: 'List languages' })
  @ApiOkResponse({ type: [LanguageDto] })
  languages(): Promise<LanguageDto[]> {
    return this.lookups.listLanguages();
  }

  @Get('formats')
  @ApiOperation({ summary: 'List screening formats (2D, 3D, IMAX, 4DX, ...)' })
  @ApiOkResponse({ type: [FormatDto] })
  formats(): Promise<FormatDto[]> {
    return this.lookups.listFormats();
  }

  @Get('age-ratings')
  @ApiOperation({ summary: 'List age classifications' })
  @ApiOkResponse({ type: [AgeRatingDto] })
  ageRatings(): Promise<AgeRatingDto[]> {
    return this.lookups.listAgeRatings();
  }
}

@ApiTags('Admin / Catalog lookups')
@ApiBearerAuth()
@Roles(Role.SUPER_ADMIN, Role.CONTENT_MANAGER)
@Controller('admin')
export class AdminLookupsController {
  constructor(private readonly lookups: LookupsService) {}

  @Post('genres')
  @ApiOperation({ summary: 'Create a genre' })
  @ApiCreatedResponse({ type: GenreDto })
  createGenre(@Body() dto: CreateGenreDto): Promise<GenreDto> {
    return this.lookups.createGenre(dto);
  }

  @Post('people')
  @ApiOperation({ summary: 'Create a director / cast / crew person' })
  @ApiCreatedResponse({ type: PersonDto })
  createPerson(@Body() dto: CreatePersonDto): Promise<PersonDto> {
    return this.lookups.createPerson(dto);
  }

  @Get('people')
  @ApiOperation({ summary: 'Search people by name' })
  @ApiOkResponse({ type: [PersonDto] })
  people(@Query() query: SearchPeopleQueryDto): Promise<PersonDto[]> {
    return this.lookups.searchPeople(query);
  }
}
