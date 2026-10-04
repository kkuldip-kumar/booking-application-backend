import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CinemasModule } from '../cinemas/cinemas.module';
import { AdminScreensController } from './admin-screens.controller';
import { ScreenMaintenance } from './entities/screen-maintenance.entity';
import { Screen } from './entities/screen.entity';
import { ScreensController } from './screens.controller';
import { ScreensService } from './screens.service';

@Module({
  imports: [TypeOrmModule.forFeature([Screen, ScreenMaintenance]), CinemasModule],
  controllers: [ScreensController, AdminScreensController],
  providers: [ScreensService],
  exports: [ScreensService],
})
export class ScreensModule {}
