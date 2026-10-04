import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Paginated } from '../../common/utils/pagination.util';
import { CinemasService } from './cinemas.service';
import { CinemaResponseDto } from './dto/cinema-response.dto';
import { QueryPublicCinemasDto } from './dto/query-cinemas.dto';

@ApiTags('Cinemas')
@Public()
@Controller('cinemas')
export class CinemasController {
  constructor(private readonly cinemasService: CinemasService) {}

  @Get()
  @ApiOperation({ summary: 'List active cinemas' })
  @ApiOkResponse({ type: CinemaResponseDto, isArray: true })
  list(@Query() query: QueryPublicCinemasDto): Promise<Paginated<CinemaResponseDto>> {
    return this.cinemasService.findAllPublic(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an active cinema with images' })
  @ApiOkResponse({ type: CinemaResponseDto })
  get(@Param('id', ParseUUIDPipe) id: string): Promise<CinemaResponseDto> {
    return this.cinemasService.findOnePublic(id);
  }
}
