import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { Paginated } from '../../common/utils/pagination.util';
import { CreditsService } from './credits.service';
import { AddCreditDto, CreditResponseDto, ReplaceCreditsDto, UpdateCreditDto } from './dto/credit.dto';
import { CreatePersonDto, PersonResponseDto, QueryPeopleDto, UpdatePersonDto } from './dto/person.dto';
import { PeopleService } from './people.service';

@ApiTags('Admin / Cast & Directors')
@Roles(Role.SUPER_ADMIN, Role.CONTENT_MANAGER)
@Controller('admin')
export class AdminPeopleController {
  constructor(private readonly peopleService: PeopleService, private readonly creditsService: CreditsService) {}

  @Post('people')
  @ApiOperation({ summary: 'Create a person (director, actor, crew)' })
  @ApiOkResponse({ type: PersonResponseDto })
  create(@Body() dto: CreatePersonDto): Promise<PersonResponseDto> {
    return this.peopleService.create(dto);
  }

  @Get('people')
  @ApiOperation({ summary: 'Search all people including inactive' })
  list(@Query() query: QueryPeopleDto): Promise<Paginated<PersonResponseDto>> {
    return this.peopleService.findAll(query, false);
  }

  @Get('people/:id')
  @ApiOperation({ summary: 'Get a person with filmography' })
  get(@Param('id', ParseUUIDPipe) id: string): Promise<PersonResponseDto> {
    return this.peopleService.findOneAdmin(id);
  }

  @Patch('people/:id')
  @ApiOperation({ summary: 'Update a person' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePersonDto): Promise<PersonResponseDto> {
    return this.peopleService.update(id, dto);
  }

  @Post('people/:id/deactivate')
  @ApiOperation({ summary: 'Hide a person from public listings' })
  deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<PersonResponseDto> {
    return this.peopleService.setActive(id, false);
  }

  @Post('people/:id/activate')
  @ApiOperation({ summary: 'Show a person in public listings' })
  activate(@Param('id', ParseUUIDPipe) id: string): Promise<PersonResponseDto> {
    return this.peopleService.setActive(id, true);
  }

  @Delete('people/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a person without credits' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.peopleService.remove(id);
  }

  @Get('movies/:movieId/credits')
  @ApiOperation({ summary: 'List credits of a movie (any status)' })
  listCredits(@Param('movieId', ParseUUIDPipe) movieId: string): Promise<CreditResponseDto[]> {
    return this.creditsService.listForMovie(movieId, false);
  }

  @Post('movies/:movieId/credits')
  @ApiOperation({ summary: 'Add one credit to a movie' })
  addCredit(@Param('movieId', ParseUUIDPipe) movieId: string, @Body() dto: AddCreditDto): Promise<CreditResponseDto> {
    return this.creditsService.add(movieId, dto);
  }

  @Put('movies/:movieId/credits')
  @ApiOperation({ summary: 'Replace all credits of a movie atomically' })
  replaceCredits(@Param('movieId', ParseUUIDPipe) movieId: string, @Body() dto: ReplaceCreditsDto): Promise<CreditResponseDto[]> {
    return this.creditsService.replaceForMovie(movieId, dto.credits);
  }

  @Patch('movies/:movieId/credits/:creditId')
  @ApiOperation({ summary: 'Update character name / order of a credit' })
  updateCredit(
    @Param('movieId', ParseUUIDPipe) movieId: string,
    @Param('creditId', ParseUUIDPipe) creditId: string,
    @Body() dto: UpdateCreditDto,
  ): Promise<CreditResponseDto> {
    return this.creditsService.update(movieId, creditId, dto);
  }

  @Delete('movies/:movieId/credits/:creditId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a credit' })
  removeCredit(@Param('movieId', ParseUUIDPipe) movieId: string, @Param('creditId', ParseUUIDPipe) creditId: string): Promise<void> {
    return this.creditsService.remove(movieId, creditId);
  }
}
