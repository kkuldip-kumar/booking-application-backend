import {
  Body, Controller, Get, HttpCode, HttpStatus, Param, ParseEnumPipe, ParseUUIDPipe, Patch, Post, Put,
  Query, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth, ApiBody, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { MovieAssetType } from '../../common/enums/movie-asset-type.enum';
import { MovieStatus } from '../../common/enums/movie-status.enum';
import { Role } from '../../common/enums/role.enum';
import { JwtUser } from '../../common/types/jwt-user.interface';
import { CreateMovieDto } from './dto/create-movie.dto';
import { AdminListMoviesQueryDto } from './dto/list-movies-query.dto';
import { ScheduleMovieDto, SetFeaturedDto, UpdateStatusDto } from './dto/movie-lifecycle.dto';
import { SetCreditsDto, SetLanguagesDto } from './dto/movie-relations.dto';
import { AdminMovieDetailDto, PaginatedMoviesDto } from './dto/movie-response.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieAssetsService, UploadedImageFile } from './movie-assets.service';
import { MovieLifecycleService } from './movie-lifecycle.service';
import { MovieQueryService } from './movie-query.service';
import { MovieRelationsService } from './movie-relations.service';
import { MAX_IMAGE_BYTES } from './movies.constants';
import { MoviesService } from './movies.service';

@ApiTags('Admin / Movies')
@ApiBearerAuth()
@Roles(Role.SUPER_ADMIN, Role.CONTENT_MANAGER)
@Controller('admin/movies')
export class AdminMoviesController {
  constructor(
    private readonly movies: MoviesService,
    private readonly queries: MovieQueryService,
    private readonly lifecycle: MovieLifecycleService,
    private readonly relations: MovieRelationsService,
    private readonly assets: MovieAssetsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a movie (always starts as DRAFT)' })
  @ApiCreatedResponse({ type: AdminMovieDetailDto })
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateMovieDto): Promise<AdminMovieDetailDto> {
    return this.movies.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List movies of any status' })
  @ApiOkResponse({ type: PaginatedMoviesDto })
  list(@Query() query: AdminListMoviesQueryDto): Promise<PaginatedMoviesDto> {
    return this.queries.listAdmin(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'View a movie with scheduling and audit fields' })
  @ApiOkResponse({ type: AdminMovieDetailDto })
  get(@Param('id', ParseUUIDPipe) id: string): Promise<AdminMovieDetailDto> {
    return this.movies.getAdmin(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit movie details, genres and formats' })
  @ApiOkResponse({ type: AdminMovieDetailDto })
  update(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMovieDto,
  ): Promise<AdminMovieDetailDto> {
    return this.movies.update(user.id, id, dto);
  }

  @Put(':id/credits')
  @ApiOperation({ summary: 'Replace directors, cast and crew' })
  @ApiOkResponse({ type: AdminMovieDetailDto })
  setCredits(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetCreditsDto,
  ): Promise<AdminMovieDetailDto> {
    return this.relations.setCredits(user.id, id, dto);
  }

  @Put(':id/languages')
  @ApiOperation({ summary: 'Replace audio languages and subtitle availability' })
  @ApiOkResponse({ type: AdminMovieDetailDto })
  setLanguages(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetLanguagesDto,
  ): Promise<AdminMovieDetailDto> {
    return this.relations.setLanguages(user.id, id, dto);
  }

  @Post(':id/assets/:type')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload or replace a POSTER, BANNER or HEADER image (JPEG/PNG/WebP, 5 MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary' } } },
  })
  @ApiOkResponse({ type: AdminMovieDetailDto })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } }))
  uploadAsset(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('type', new ParseEnumPipe(MovieAssetType)) type: MovieAssetType,
    @UploadedFile() file: UploadedImageFile | undefined,
  ): Promise<AdminMovieDetailDto> {
    return this.assets.upload({ actorId: user.id, movieId: id, type, file });
  }

  @Put(':id/featured')
  @ApiOperation({ summary: 'Feature or unfeature a movie on the homepage' })
  @ApiOkResponse({ type: AdminMovieDetailDto })
  setFeatured(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetFeaturedDto,
  ): Promise<AdminMovieDetailDto> {
    return this.lifecycle.setFeatured(user.id, id, dto);
  }

  @Put(':id/schedule')
  @ApiOperation({ summary: 'Schedule publication and/or unpublication (null clears)' })
  @ApiOkResponse({ type: AdminMovieDetailDto })
  setSchedule(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ScheduleMovieDto,
  ): Promise<AdminMovieDetailDto> {
    return this.lifecycle.setSchedule(user.id, id, dto);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish a draft (requires poster, genre and audio language)' })
  @ApiOkResponse({ type: AdminMovieDetailDto })
  publish(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string): Promise<AdminMovieDetailDto> {
    return this.change(user, id, MovieStatus.PUBLISHED);
  }

  @Post(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Return a published movie to DRAFT' })
  @ApiOkResponse({ type: AdminMovieDetailDto })
  unpublish(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string): Promise<AdminMovieDetailDto> {
    return this.change(user, id, MovieStatus.DRAFT);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a movie' })
  @ApiOkResponse({ type: AdminMovieDetailDto })
  archive(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string): Promise<AdminMovieDetailDto> {
    return this.change(user, id, MovieStatus.ARCHIVED);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore an archived movie as DRAFT' })
  @ApiOkResponse({ type: AdminMovieDetailDto })
  restore(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string): Promise<AdminMovieDetailDto> {
    return this.change(user, id, MovieStatus.DRAFT);
  }

  @Post(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Move a live movie between PUBLISHED, NOW_SHOWING and COMING_SOON' })
  @ApiOkResponse({ type: AdminMovieDetailDto })
  setStatus(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
  ): Promise<AdminMovieDetailDto> {
    return this.change(user, id, dto.status);
  }

  private change(user: JwtUser, movieId: string, target: MovieStatus): Promise<AdminMovieDetailDto> {
    return this.lifecycle.changeStatus({ movieId, target, actorId: user.id });
  }
}
