import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Paginated } from '../../common/utils/pagination.util';
import { CreditsService } from './credits.service';
import { CreditResponseDto } from './dto/credit.dto';
import { PersonResponseDto, QueryPeopleDto } from './dto/person.dto';
import { PeopleService } from './people.service';

@ApiTags('Cast & Directors')
@Public()
@Controller()
export class PeopleController {
  constructor(private readonly peopleService: PeopleService, private readonly creditsService: CreditsService) {}

  @Get('people')
  @ApiOperation({ summary: 'Search active cast & crew' })
  @ApiOkResponse({ type: PersonResponseDto, isArray: true })
  list(@Query() query: QueryPeopleDto): Promise<Paginated<PersonResponseDto>> {
    return this.peopleService.findAll(query, true);
  }

  @Get('people/:id')
  @ApiOperation({ summary: 'Get a person with public filmography' })
  @ApiOkResponse({ type: PersonResponseDto })
  get(@Param('id', ParseUUIDPipe) id: string): Promise<PersonResponseDto> {
    return this.peopleService.findOnePublic(id);
  }

  @Get('movies/:movieId/credits')
  @ApiOperation({ summary: 'Cast & crew of a published movie' })
  @ApiOkResponse({ type: CreditResponseDto, isArray: true })
  credits(@Param('movieId', ParseUUIDPipe) movieId: string): Promise<CreditResponseDto[]> {
    return this.creditsService.listForMovie(movieId, true);
  }
}
