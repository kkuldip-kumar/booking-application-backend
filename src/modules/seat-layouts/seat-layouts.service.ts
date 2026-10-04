import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { SEAT_INSERT_CHUNK } from '../../common/constants/cinema.constants';
import { SeatLayoutStatus, SeatStatus } from '../../common/enums/cinema.enums';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { chunked } from '../../common/utils/query.util';
import { ScreensService } from '../screens/screens.service';
import { CreateSeatLayoutDto } from './dto/create-seat-layout.dto';
import { SeatLayoutResponseDto, SeatResponseDto, SeatTypeResponseDto } from './dto/seat-layout-response.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';
import { SeatLayout } from './entities/seat-layout.entity';
import { SeatType } from './entities/seat-type.entity';
import { Seat } from './entities/seat.entity';
import { buildLayout, LayoutDraft, SeatDraft } from './seat-layout.builder';

interface NewLayoutInput {
  screenId: string;
  name: string;
  userId: string;
  draft: LayoutDraft;
}

@Injectable()
export class SeatLayoutsService {
  constructor(
    @InjectRepository(SeatLayout) private readonly layouts: Repository<SeatLayout>,
    @InjectRepository(Seat) private readonly seats: Repository<Seat>,
    @InjectRepository(SeatType) private readonly seatTypes: Repository<SeatType>,
    private readonly screensService: ScreensService,
    private readonly dataSource: DataSource,
  ) {}

  async listSeatTypes(): Promise<SeatTypeResponseDto[]> {
    const rows = await this.seatTypes.find({ where: { isActive: true }, order: { priceMultiplierBps: 'ASC' } });
    return rows.map((row) => SeatTypeResponseDto.from(row));
  }

  async create(user: JwtUser, screenId: string, dto: CreateSeatLayoutDto): Promise<SeatLayoutResponseDto> {
    await this.screensService.findOneForUser(user, screenId);
    const draft = buildLayout(dto.rows, await this.loadTypeIdByCode());
    return this.dataSource.transaction(async (manager) => {
      const layout = await this.insertLayout(manager, { screenId, name: dto.name, userId: user.id, draft });
      await this.insertSeats(manager, layout.id, draft.seats);
      return SeatLayoutResponseDto.from(layout, undefined, draft.seats.length);
    });
  }

  async clone(user: JwtUser, layoutId: string): Promise<SeatLayoutResponseDto> {
    const source = await this.requireLayout(user, layoutId);
    const seats = await this.seats.find({ where: { layoutId } });
    const draft: LayoutDraft = {
      rowCount: source.rowCount,
      columnCount: source.columnCount,
      seats: seats.map((s) => ({
        seatTypeId: s.seatTypeId, rowLabel: s.rowLabel, seatNumber: s.seatNumber, gridRow: s.gridRow,
        gridCol: s.gridCol, isAccessible: s.isAccessible, isCompanion: s.isCompanion,
      })),
    };
    return this.dataSource.transaction(async (manager) => {
      const layout = await this.insertLayout(manager, { screenId: source.screenId, name: `${source.name} (copy)`.slice(0, 100), userId: user.id, draft });
      await this.insertSeats(manager, layout.id, draft.seats);
      return SeatLayoutResponseDto.from(layout, undefined, draft.seats.length);
    });
  }

  async listByScreen(user: JwtUser, screenId: string): Promise<SeatLayoutResponseDto[]> {
    await this.screensService.findOneForUser(user, screenId);
    const rows = await this.layouts.find({ where: { screenId }, order: { version: 'DESC' } });
    return rows.map((row) => SeatLayoutResponseDto.from(row));
  }

  async getDetail(user: JwtUser, layoutId: string): Promise<SeatLayoutResponseDto> {
    const layout = await this.requireLayout(user, layoutId);
    const seats = await this.seats.find({
      where: { layoutId }, relations: { seatType: true }, order: { gridRow: 'ASC', gridCol: 'ASC' },
    });
    return SeatLayoutResponseDto.from(layout, seats);
  }

  async updateSeat(user: JwtUser, layoutId: string, seatId: string, dto: UpdateSeatDto): Promise<SeatResponseDto> {
    await this.requireDraft(user, layoutId);
    const seat = await this.seats.findOne({ where: { id: seatId, layoutId }, relations: { seatType: true } });
    if (!seat) throw new NotFoundException('Seat not found');
    if (dto.seatTypeCode) {
      const typeId = (await this.loadTypeIdByCode()).get(dto.seatTypeCode);
      if (!typeId) throw new BadRequestException(`Unknown seat type ${dto.seatTypeCode}`);
      seat.seatTypeId = typeId;
    }
    await this.seats.update({ id: seatId }, {
      seatTypeId: seat.seatTypeId,
      isAccessible: dto.isAccessible ?? seat.isAccessible,
      isCompanion: dto.isCompanion ?? seat.isCompanion,
      status: dto.status ?? seat.status,
    });
    const reloaded = await this.seats.findOneOrFail({ where: { id: seatId }, relations: { seatType: true } });
    return SeatResponseDto.from(reloaded);
  }

  async activate(user: JwtUser, layoutId: string): Promise<SeatLayoutResponseDto> {
    const layout = await this.requireDraft(user, layoutId);
    return this.dataSource.transaction(async (manager) => {
      await this.screensService.lockScreen(manager, layout.screenId);
      await manager.update(SeatLayout, { screenId: layout.screenId, status: SeatLayoutStatus.ACTIVE }, { status: SeatLayoutStatus.ARCHIVED });
      await manager.update(SeatLayout, { id: layout.id }, { status: SeatLayoutStatus.ACTIVE });
      const capacity = await manager.count(Seat, { where: { layoutId: layout.id, status: SeatStatus.ACTIVE } });
      await this.screensService.setCapacity(manager, layout.screenId, capacity);
      return SeatLayoutResponseDto.from({ ...layout, status: SeatLayoutStatus.ACTIVE }, undefined, capacity);
    });
  }

  async removeDraft(user: JwtUser, layoutId: string): Promise<void> {
    await this.requireDraft(user, layoutId);
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(Seat, { layoutId });
      await manager.delete(SeatLayout, { id: layoutId });
    });
  }

  async getActiveLayoutOrFail(screenId: string): Promise<SeatLayout> {
    const layout = await this.layouts.findOneBy({ screenId, status: SeatLayoutStatus.ACTIVE });
    if (!layout) throw new ConflictException('Screen has no active seat layout');
    return layout;
  }

  async getBookableSeats(manager: EntityManager, layoutId: string): Promise<Seat[]> {
    return manager.find(Seat, { where: { layoutId, status: SeatStatus.ACTIVE }, relations: { seatType: true } });
  }

  async resolveSeatTypeIds(codes: readonly string[]): Promise<Map<string, string>> {
    if (codes.length === 0) return new Map();
    const rows = await this.seatTypes.find({ where: { code: In([...codes]), isActive: true } });
    const byCode = new Map(rows.map((row) => [row.code, row.id] as const));
    const unknown = codes.find((code) => !byCode.has(code));
    if (unknown) throw new BadRequestException(`Unknown seat type ${unknown}`);
    return byCode;
  }

  private async loadTypeIdByCode(): Promise<Map<string, string>> {
    const rows = await this.seatTypes.find({ where: { isActive: true } });
    return new Map(rows.map((row) => [row.code, row.id] as const));
  }

  private async requireLayout(user: JwtUser, layoutId: string): Promise<SeatLayout> {
    const layout = await this.layouts.findOneBy({ id: layoutId });
    if (!layout) throw new NotFoundException('Seat layout not found');
    await this.screensService.findOneForUser(user, layout.screenId);
    return layout;
  }

  // Active/archived layouts are immutable: showtimes and bookings pin to them. Edit via clone.
  private async requireDraft(user: JwtUser, layoutId: string): Promise<SeatLayout> {
    const layout = await this.requireLayout(user, layoutId);
    if (layout.status !== SeatLayoutStatus.DRAFT) throw new ConflictException('Only DRAFT layouts can be modified; clone it first');
    return layout;
  }

  private async insertLayout(manager: EntityManager, input: NewLayoutInput): Promise<SeatLayout> {
    await this.screensService.lockScreen(manager, input.screenId);
    const { max } = (await manager.createQueryBuilder(SeatLayout, 'l').select('COALESCE(MAX(l.version), 0)', 'max')
      .where('l.screenId = :screenId', { screenId: input.screenId }).getRawOne<{ max: string }>()) ?? { max: '0' };
    return manager.save(SeatLayout, manager.create(SeatLayout, {
      screenId: input.screenId, version: Number(max) + 1, name: input.name, status: SeatLayoutStatus.DRAFT,
      rowCount: input.draft.rowCount, columnCount: input.draft.columnCount, createdBy: input.userId,
    }));
  }

  private async insertSeats(manager: EntityManager, layoutId: string, drafts: readonly SeatDraft[]): Promise<void> {
    for (const chunk of chunked(drafts, SEAT_INSERT_CHUNK)) {
      await manager.insert(Seat, chunk.map((draft) => ({ ...draft, layoutId, status: SeatStatus.ACTIVE })));
    }
  }
}
