import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Paginated } from '../../common/utils/pagination.util';
import { QueryPublicShowtimesDto } from './dto/query-showtimes.dto';
import { ShowtimeResponseDto } from './dto/showtime-response.dto';
import { ShowtimeQueryService } from './showtime-query.service';

@ApiTags('Showtimes')
@Public()
@Controller('showtimes')
export class ShowtimesController {
  constructor(private readonly queries: ShowtimeQueryService) {}

  @Get()
  @ApiOperation({ summary: 'List bookable upcoming showtimes (filter by movie, cinema, time range)' })
  @ApiOkResponse({ type: ShowtimeResponseDto, isArray: true })
  list(@Query() query: QueryPublicShowtimesDto): Promise<Paginated<ShowtimeResponseDto>> {
    return this.queries.findAllPublic(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a bookable showtime with seat availability counts' })
  @ApiOkResponse({ type: ShowtimeResponseDto })
  get(@Param('id', ParseUUIDPipe) id: string): Promise<ShowtimeResponseDto> {
    return this.queries.findOnePublic(id);
  }
}
