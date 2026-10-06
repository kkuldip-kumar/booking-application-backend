import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { OfferStatus } from '../../common/enums/offer.enums';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { hasGlobalCinemaAccess } from '../../common/utils/cinema-access.util';
import { Paginated, paginate } from '../../common/utils/pagination.util';
import { escapeLike } from '../../common/utils/query.util';
import { QueryRedemptionsDto, RedemptionResponseDto } from './dto/coupon.dto';
import { OfferResponseDto, PublicOfferDto, QueryOffersDto, QueryPublicOffersDto } from './dto/offer.dto';
import { OfferRedemption } from './entities/offer-redemption.entity';
import { Offer } from './entities/offer.entity';
import { OfferAccessService } from './offer-access.service';

const TARGET_JOINS = ['cinemas', 'movies', 'paymentRules'] as const;

export interface RedemptionPage extends Paginated<RedemptionResponseDto> {
  summary: { count: number; totalDiscount: number };
}

@Injectable()
export class OffersQueryService {
  constructor(
    @InjectRepository(Offer) private readonly offers: Repository<Offer>,
    @InjectRepository(OfferRedemption) private readonly redemptions: Repository<OfferRedemption>,
    private readonly access: OfferAccessService,
  ) {}

  async listPublic(query: QueryPublicOffersDto): Promise<Paginated<PublicOfferDto>> {
    const qb = this.base()
      .where('o.status = :active AND o.isPublic = true AND o.startsAt <= now() AND o.endsAt > now()', { active: OfferStatus.ACTIVE });
    this.filterTargets(qb, query.cinemaId, query.movieId);
    const [rows, total] = await this.page(qb, query);
    return paginate(rows.map((row) => PublicOfferDto.from(row)), total, query.page, query.limit);
  }

  async getPublic(id: string): Promise<PublicOfferDto> {
    const offer = await this.base()
      .where('o.id = :id AND o.status = :active AND o.isPublic = true AND o.startsAt <= now() AND o.endsAt > now()', { id, active: OfferStatus.ACTIVE })
      .getOne();
    if (!offer) throw new NotFoundException('Offer not found');
    return PublicOfferDto.from(offer);
  }

  async listAdmin(user: JwtUser, query: QueryOffersDto): Promise<Paginated<OfferResponseDto>> {
    const qb = this.base().where('1 = 1');
    if (!hasGlobalCinemaAccess(user)) this.scopeToCinemas(qb, user.cinemaIds);
    if (query.status) qb.andWhere('o.status = :status', { status: query.status });
    if (query.q) qb.andWhere('LOWER(o.name) LIKE :q', { q: `%${escapeLike(query.q.toLowerCase())}%` });
    this.filterTargets(qb, query.cinemaId, query.movieId);
    const [rows, total] = await this.page(qb, query);
    return paginate(rows.map((row) => OfferResponseDto.fromAdmin(row)), total, query.page, query.limit);
  }

  async listRedemptions(user: JwtUser, offerId: string, query: QueryRedemptionsDto): Promise<RedemptionPage> {
    await this.access.loadManaged(user, offerId);
    const qb = this.redemptions.createQueryBuilder('r').where('r.offerId = :offerId', { offerId });
    if (query.status) qb.andWhere('r.status = :status', { status: query.status });
    const [rows, total] = await qb.clone().orderBy('r.createdAt', 'DESC').addOrderBy('r.id', 'ASC').skip(query.skip).take(query.limit).getManyAndCount();
    const sum = await qb.clone().select('COALESCE(SUM(r.discountAmount), 0)', 'sum').getRawOne<{ sum: string }>();
    return { ...paginate(rows.map((row) => RedemptionResponseDto.from(row)), total, query.page, query.limit), summary: { count: total, totalDiscount: Number(sum?.sum ?? 0) } };
  }

  private base(): SelectQueryBuilder<Offer> {
    const qb = this.offers.createQueryBuilder('o');
    for (const relation of TARGET_JOINS) qb.leftJoinAndSelect(`o.${relation}`, relation);
    return qb;
  }

  // An offer with no targeting rows applies everywhere, so it matches any cinema/movie filter.
  private filterTargets(qb: SelectQueryBuilder<Offer>, cinemaId?: string, movieId?: string): void {
    if (cinemaId) {
      qb.andWhere(`(NOT EXISTS (SELECT 1 FROM offer_cinemas x WHERE x.offer_id = o.id) OR EXISTS (SELECT 1 FROM offer_cinemas x WHERE x.offer_id = o.id AND x.cinema_id = :fCinema))`, { fCinema: cinemaId });
    }
    if (movieId) {
      qb.andWhere(`(NOT EXISTS (SELECT 1 FROM offer_movies x WHERE x.offer_id = o.id) OR EXISTS (SELECT 1 FROM offer_movies x WHERE x.offer_id = o.id AND x.movie_id = :fMovie))`, { fMovie: movieId });
    }
  }

  // Cinema admins see only offers targeted exclusively at cinemas they manage.
  private scopeToCinemas(qb: SelectQueryBuilder<Offer>, cinemaIds: readonly string[]): void {
    if (cinemaIds.length === 0) {
      qb.andWhere('1 = 0');
      return;
    }
    qb.andWhere('EXISTS (SELECT 1 FROM offer_cinemas s WHERE s.offer_id = o.id)')
      .andWhere('NOT EXISTS (SELECT 1 FROM offer_cinemas s WHERE s.offer_id = o.id AND s.cinema_id NOT IN (:...scopeIds))', { scopeIds: cinemaIds });
  }

  private page(qb: SelectQueryBuilder<Offer>, query: { skip: number; limit: number }): Promise<[Offer[], number]> {
    return qb.orderBy('o.createdAt', 'DESC').addOrderBy('o.id', 'ASC').skip(query.skip).take(query.limit).getManyAndCount();
  }
}
