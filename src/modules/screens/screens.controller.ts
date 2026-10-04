import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ScreenResponseDto } from './dto/screen.dto';
import { ScreensService } from './screens.service';

@ApiTags('Screens')
@Public()
@Controller('cinemas/:cinemaId/screens')
export class ScreensController {
  constructor(private readonly screensService: ScreensService) {}

  @Get()
  @ApiOperation({ summary: 'List active screens of an active cinema' })
  @ApiOkResponse({ type: ScreenResponseDto, isArray: true })
  list(@Param('cinemaId', ParseUUIDPipe) cinemaId: string): Promise<ScreenResponseDto[]> {
    return this.screensService.listPublicByCinema(cinemaId);
  }
}
