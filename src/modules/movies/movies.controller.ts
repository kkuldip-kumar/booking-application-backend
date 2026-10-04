import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ListMoviesQueryDto } from './dto/list-movies-query.dto';
import { MovieDetailDto, MovieListItemDto, PaginatedMoviesDto } from './dto/movie-response.dto';
import { MovieQueryService } from './movie-query.service';
import { MoviesService } from './movies.service';

@ApiTags('Movies')
@Public()
@Controller('movies')
export class MoviesController {
  constructor(
    private readonly movies: MoviesService,
    private readonly queries: MovieQueryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List published movies (search, filter, paginate)' })
  @ApiOkResponse({ type: PaginatedMoviesDto })
  list(@Query() query: ListMoviesQueryDto): Promise<PaginatedMoviesDto> {
    return this.queries.listPublic(query);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Movies featured on the homepage' })
  @ApiOkResponse({ type: [MovieListItemDto] })
  featured(): Promise<MovieListItemDto[]> {
    return this.queries.listFeatured();
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a published movie by slug' })
  @ApiOkResponse({ type: MovieDetailDto })
  bySlug(@Param('slug') slug: string): Promise<MovieDetailDto> {
    return this.movies.getPublicBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a published movie by id' })
  @ApiOkResponse({ type: MovieDetailDto })
  byId(@Param('id', ParseUUIDPipe) id: string): Promise<MovieDetailDto> {
    return this.movies.getPublicById(id);
  }
}
