import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CinemaStatus, ScreenStatus } from '../../common/enums/cinema.enums';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { assertCinemaAccess } from '../../common/utils/cinema-access.util';
import { isUniqueViolation } from '../../common/utils/db-errors.util';
import { pickDefined } from '../../common/utils/query.util';
import { CinemasService } from '../cinemas/cinemas.service';
import { CreateMaintenanceDto, MaintenanceResponseDto } from './dto/maintenance.dto';
import { CreateScreenDto, ScreenResponseDto, UpdateScreenDto } from './dto/screen.dto';
import { ScreenMaintenance } from './entities/screen-maintenance.entity';
import { Screen } from './entities/screen.entity';

const SCREEN_UPDATABLE_FIELDS = ['name', 'screenNumber', 'supportedFormats'] as const satisfies readonly (keyof UpdateScreenDto)[];

@Injectable()
export class ScreensService {
  constructor(
    @InjectRepository(Screen) private readonly screens: Repository<Screen>,
    @InjectRepository(ScreenMaintenance) private readonly maintenance: Repository<ScreenMaintenance>,
    private readonly cinemasService: CinemasService,
  ) {}

  async create(user: JwtUser, cinemaId: string, dto: CreateScreenDto): Promise<ScreenResponseDto> {
    assertCinemaAccess(user, cinemaId);
    await this.cinemasService.assertExists(cinemaId);
    return this.saveScreen(this.screens.create({
      cinemaId, name: dto.name, screenNumber: dto.screenNumber, supportedFormats: dto.supportedFormats,
    }));
  }

  async update(user: JwtUser, id: string, dto: UpdateScreenDto): Promise<ScreenResponseDto> {
    const screen = await this.findOneForUser(user, id);
    Object.assign(screen, pickDefined(dto, SCREEN_UPDATABLE_FIELDS));
    return this.saveScreen(screen);
  }

  async setStatus(user: JwtUser, id: string, status: ScreenStatus): Promise<ScreenResponseDto> {
    const screen = await this.findOneForUser(user, id);
    screen.status = status;
    return this.saveScreen(screen);
  }

  async listByCinema(user: JwtUser, cinemaId: string): Promise<ScreenResponseDto[]> {
    assertCinemaAccess(user, cinemaId);
    const rows = await this.screens.find({ where: { cinemaId }, order: { screenNumber: 'ASC' } });
    return rows.map((row) => ScreenResponseDto.from(row));
  }

  async listPublicByCinema(cinemaId: string): Promise<ScreenResponseDto[]> {
    const rows = await this.screens.find({
      where: { cinemaId, status: ScreenStatus.ACTIVE, cinema: { status: CinemaStatus.ACTIVE } },
      order: { screenNumber: 'ASC' },
    });
    return rows.map((row) => ScreenResponseDto.from(row));
  }

  async getOne(user: JwtUser, id: string): Promise<ScreenResponseDto> {
    return ScreenResponseDto.from(await this.findOneForUser(user, id));
  }

  /** Loads the screen with its cinema and enforces cinema-scoped access (404 on foreign cinemas). */
  async findOneForUser(user: JwtUser, id: string): Promise<Screen> {
    const screen = await this.screens.findOne({ where: { id }, relations: { cinema: true } });
    if (!screen) throw new NotFoundException('Screen not found');
    assertCinemaAccess(user, screen.cinemaId);
    return screen;
  }

  async lockScreen(manager: EntityManager, id: string): Promise<Screen> {
    const screen = await manager.createQueryBuilder(Screen, 's').setLock('pessimistic_write').where('s.id = :id', { id }).getOne();
    if (!screen) throw new NotFoundException('Screen not found');
    return screen;
  }

  async setCapacity(manager: EntityManager, id: string, capacity: number): Promise<void> {
    await manager.update(Screen, { id }, { capacity });
  }

  async hasMaintenanceOverlap(manager: EntityManager, screenId: string, startAt: Date, endAt: Date): Promise<boolean> {
    return manager.createQueryBuilder(ScreenMaintenance, 'm')
      .where('m.screenId = :screenId AND m.startAt < :endAt AND m.endAt > :startAt', { screenId, startAt, endAt })
      .getExists();
  }

  async addMaintenance(user: JwtUser, screenId: string, dto: CreateMaintenanceDto): Promise<MaintenanceResponseDto> {
    await this.findOneForUser(user, screenId);
    if (dto.endAt <= dto.startAt) throw new BadRequestException('endAt must be after startAt');
    const row = this.maintenance.create({ screenId, startAt: dto.startAt, endAt: dto.endAt, reason: dto.reason, createdBy: user.id });
    return MaintenanceResponseDto.from(await this.maintenance.save(row));
  }

  async listMaintenance(user: JwtUser, screenId: string): Promise<MaintenanceResponseDto[]> {
    await this.findOneForUser(user, screenId);
    const rows = await this.maintenance.find({ where: { screenId }, order: { startAt: 'DESC' }, take: 100 });
    return rows.map((row) => MaintenanceResponseDto.from(row));
  }

  async removeMaintenance(user: JwtUser, screenId: string, id: string): Promise<void> {
    await this.findOneForUser(user, screenId);
    const result = await this.maintenance.delete({ id, screenId });
    if (!result.affected) throw new NotFoundException('Maintenance window not found');
  }

  private async saveScreen(screen: Screen): Promise<ScreenResponseDto> {
    try {
      return ScreenResponseDto.from(await this.screens.save(screen));
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException('Screen number already exists in this cinema');
      throw error;
    }
  }
}
