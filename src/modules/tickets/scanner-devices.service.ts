import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { CreateScannerDeviceDto } from './dto/create-scanner-device.dto';
import { CreatedScannerDeviceDto, ScannerDeviceDto } from './dto/scanner-device.dto';
import { ScannerDevice } from './entities/scanner-device.entity';
import { DeviceContext } from './interfaces/device-context.interface';
import {
  DEVICE_KEY_HASH_HEX_LENGTH,
  DEVICE_KEY_SECRET_BYTES,
  DEVICE_KEY_SECRET_MAX_LENGTH,
  DEVICE_KEY_SEPARATOR,
  PG_FOREIGN_KEY_VIOLATION,
} from './tickets.constants';
import { canAccessCinema } from './utils/cinema-access.util';
import { hasPgErrorCode } from './utils/db-errors.util';

interface ParsedDeviceKey {
  readonly id: string;
  readonly secret: string;
}

// Compared against when the device is unknown, so timing does not reveal valid ids.
const DUMMY_KEY_HASH = '0'.repeat(DEVICE_KEY_HASH_HEX_LENGTH);

@Injectable()
export class ScannerDevicesService {
  private readonly logger = new Logger(ScannerDevicesService.name);

  constructor(@InjectRepository(ScannerDevice) private readonly devices: Repository<ScannerDevice>) {}

  async create(actor: JwtUser, dto: CreateScannerDeviceDto): Promise<CreatedScannerDeviceDto> {
    if (!canAccessCinema(actor, dto.cinemaId)) {
      throw new ForbiddenException('No access to this cinema');
    }
    const id = randomUUID();
    const secret = randomBytes(DEVICE_KEY_SECRET_BYTES).toString('base64url');
    try {
      await this.devices.insert({
        id,
        cinemaId: dto.cinemaId,
        name: dto.name,
        keyHash: this.hashSecret(secret).toString('hex'),
        createdBy: actor.id,
      });
    } catch (error) {
      if (hasPgErrorCode(error, PG_FOREIGN_KEY_VIOLATION)) {
        throw new NotFoundException('Cinema not found');
      }
      throw error;
    }
    this.logger.log(`scanner device ${id} registered by ${actor.id}`);
    return {
      id,
      cinemaId: dto.cinemaId,
      name: dto.name,
      isActive: true,
      deviceKey: `${id}${DEVICE_KEY_SEPARATOR}${secret}`,
    };
  }

  async deactivate(actor: JwtUser, id: string): Promise<ScannerDeviceDto> {
    const device = await this.devices.findOne({ where: { id } });
    if (!device || !canAccessCinema(actor, device.cinemaId)) {
      throw new NotFoundException('Scanner device not found');
    }
    if (device.isActive) {
      await this.devices.update({ id }, { isActive: false });
      this.logger.warn(`scanner device ${id} deactivated by ${actor.id}`);
    }
    return { id, cinemaId: device.cinemaId, name: device.name, isActive: false };
  }

  async authenticate(rawKey: string | undefined): Promise<DeviceContext | null> {
    const parsed = this.parseKey(rawKey);
    const device = parsed
      ? await this.devices.findOne({ where: { id: parsed.id, isActive: true } })
      : null;
    const expected = Buffer.from(device?.keyHash ?? DUMMY_KEY_HASH, 'hex');
    const presented = this.hashSecret(parsed?.secret ?? '');
    const matches = expected.length === presented.length && timingSafeEqual(presented, expected);
    return device && matches ? { id: device.id, cinemaId: device.cinemaId } : null;
  }

  private parseKey(rawKey: string | undefined): ParsedDeviceKey | null {
    const [id, secret, ...rest] = (rawKey ?? '').split(DEVICE_KEY_SEPARATOR);
    const isWellFormed =
      rest.length === 0 &&
      isUUID(id, '4') &&
      typeof secret === 'string' &&
      secret.length > 0 &&
      secret.length <= DEVICE_KEY_SECRET_MAX_LENGTH;
    return isWellFormed ? { id, secret } : null;
  }

  private hashSecret(secret: string): Buffer {
    return createHash('sha256').update(secret).digest();
  }
}
