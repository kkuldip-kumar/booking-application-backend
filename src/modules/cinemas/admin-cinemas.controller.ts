import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { Paginated } from '../../common/utils/pagination.util';
import { CinemasService } from './cinemas.service';
import { AddCinemaImageDto, CinemaImageResponseDto } from './dto/cinema-image.dto';
import { CinemaResponseDto } from './dto/cinema-response.dto';
import { CreateCinemaDto } from './dto/create-cinema.dto';
import { QueryCinemasDto } from './dto/query-cinemas.dto';
import { UpdateCinemaDto, UpdateCinemaStatusDto } from './dto/update-cinema.dto';

@ApiTags('Admin / Cinemas')
@Roles(Role.SUPER_ADMIN, Role.CINEMA_ADMIN)
@Controller('admin/cinemas')
export class AdminCinemasController {
  constructor(private readonly cinemasService: CinemasService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a cinema' })
  @ApiOkResponse({ type: CinemaResponseDto })
  create(@Body() dto: CreateCinemaDto): Promise<CinemaResponseDto> {
    return this.cinemasService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List cinemas visible to the caller' })
  list(@CurrentUser() user: JwtUser, @Query() query: QueryCinemasDto): Promise<Paginated<CinemaResponseDto>> {
    return this.cinemasService.findAllAdmin(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a cinema' })
  get(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string): Promise<CinemaResponseDto> {
    return this.cinemasService.findOneAdmin(user, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a cinema' })
  update(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCinemaDto): Promise<CinemaResponseDto> {
    return this.cinemasService.update(user, id, dto);
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Activate, deactivate or close a cinema' })
  setStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCinemaStatusDto): Promise<CinemaResponseDto> {
    return this.cinemasService.setStatus(id, dto.status);
  }

  @Post(':id/images')
  @ApiOperation({ summary: 'Add a cinema image' })
  addImage(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: AddCinemaImageDto): Promise<CinemaImageResponseDto> {
    return this.cinemasService.addImage(user, id, dto);
  }

  @Delete(':id/images/:imageId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a cinema image' })
  removeImage(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string, @Param('imageId', ParseUUIDPipe) imageId: string): Promise<void> {
    return this.cinemasService.removeImage(user, id, imageId);
  }
}
