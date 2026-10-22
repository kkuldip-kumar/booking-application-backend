import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import {
  COUPON_ALPHABET, COUPON_GENERATION_ATTEMPTS, COUPON_RANDOM_LENGTH,
} from '../../common/constants/offer.constants';
import { CouponStatus, OfferStatus } from '../../common/enums/offer.enums';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { isUniqueViolation } from '../../common/utils/db-errors.util';
import { Paginated, paginate } from '../../common/utils/pagination.util';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CouponResponseDto, CreateCouponsDto } from './dto/coupon.dto';
import { Coupon } from './entities/coupon.entity';
import { OfferAccessService } from './offer-access.service';
import { OfferAuditService } from './offer-audit.service';
import { OfferUsageService } from './offer-usage.service';

function randomCode(prefix: string): string {
  let suffix = '';
  for (let i = 0; i < COUPON_RANDOM_LENGTH; i++) suffix += COUPON_ALPHABET[randomInt(COUPON_ALPHABET.length)];
  return `${prefix}${suffix}`;
}

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon) private readonly coupons: Repository<Coupon>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly access: OfferAccessService,
    private readonly usage: OfferUsageService,
    private readonly audit: OfferAuditService,
  ) {}

  async create(user: JwtUser, offerId: string, dto: CreateCouponsDto): Promise<CouponResponseDto[]> {
    const offer = await this.access.loadManaged(user, offerId);
    if (offer.status === OfferStatus.ARCHIVED) throw new ConflictException('Archived offers cannot get new coupons');
    const limits = { maxUses: dto.maxUses ?? null, perCustomerLimit: dto.perCustomerLimit ?? null };
    const created = dto.code ? [await this.createOne(offerId, dto.code.trim().toUpperCase(), limits)] : await this.generate(offerId, dto, limits);
    this.audit.record(user.id, 'COUPONS_CREATED', offerId, { count: created.length });
    return created.map((coupon) => CouponResponseDto.from(coupon, 0));
  }

  async list(user: JwtUser, offerId: string, query: PaginationQueryDto): Promise<Paginated<CouponResponseDto>> {
    await this.access.loadManaged(user, offerId);
    const [rows, total] = await this.coupons.findAndCount({ where: { offerId }, order: { createdAt: 'DESC', id: 'ASC' }, skip: query.skip, take: query.limit });
    const counts = await this.usage.totalsByCoupon(this.dataSource.manager, rows.map((r) => r.id));
    return paginate(rows.map((row) => CouponResponseDto.from(row, this.usage.usageOf(counts, row.id).total)), total, query.page, query.limit);
  }

  async setStatus(user: JwtUser, couponId: string, status: CouponStatus): Promise<CouponResponseDto> {
    const coupon = await this.coupons.findOneBy({ id: couponId });
    if (!coupon) throw new NotFoundException('Coupon not found');
    await this.access.loadManaged(user, coupon.offerId);
    coupon.status = status;
    const saved = await this.coupons.save(coupon);
    this.audit.record(user.id, `COUPON_${status}`, coupon.offerId, { couponId });
    return CouponResponseDto.from(saved);
  }

  private async createOne(offerId: string, code: string, limits: { maxUses: number | null; perCustomerLimit: number | null }): Promise<Coupon> {
    try {
      return await this.coupons.save(this.coupons.create({ offerId, code, ...limits }));
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException('Coupon code already exists');
      throw error;
    }
  }

  private async generate(offerId: string, dto: CreateCouponsDto, limits: { maxUses: number | null; perCustomerLimit: number | null }): Promise<Coupon[]> {
    const wanted = dto.count ?? 1;
    const created: Coupon[] = [];
    for (let attempt = 0; attempt < COUPON_GENERATION_ATTEMPTS && created.length < wanted; attempt++) {
      const codes = new Set<string>();
      while (codes.size < wanted - created.length) codes.add(randomCode(dto.prefix?.toUpperCase() ?? ''));
      const result = await this.coupons.createQueryBuilder().insert().values([...codes].map((code) => ({ offerId, code, ...limits })))
        .orIgnore().returning('*').execute();
      created.push(...this.coupons.create(result.generatedMaps.length > 0 ? (result.raw as Record<string, unknown>[]).map((r) => this.fromRaw(r)) : []));
    }
    if (created.length < wanted) throw new ConflictException('Could not generate enough unique coupon codes; use a different prefix');
    return created;
  }

  private fromRaw(raw: Record<string, unknown>): Partial<Coupon> {
    return {
      id: raw.id as string, offerId: raw.offer_id as string, code: raw.code as string, maxUses: raw.max_uses as number | null,
      perCustomerLimit: raw.per_customer_limit as number | null, status: raw.status as CouponStatus,
    };
  }
}
