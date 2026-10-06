import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { DEFAULT_OFFER_PRIORITY } from '../../common/constants/offer.constants';
import { OfferCombineMode, OfferStatus } from '../../common/enums/offer.enums';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { pickDefined } from '../../common/utils/query.util';
import { CinemasService } from '../cinemas/cinemas.service';
import { Movie } from '../movies/entities/movie.entity';
import { CreateOfferDto, OfferResponseDto, PaymentRuleDto, UpdateOfferDto } from './dto/offer.dto';
import { OfferCinema } from './entities/offer-cinema.entity';
import { OfferMovie } from './entities/offer-movie.entity';
import { OfferPaymentRule } from './entities/offer-payment-rule.entity';
import { OfferRedemption } from './entities/offer-redemption.entity';
import { Offer } from './entities/offer.entity';
import { OfferAccessService, canManageCinemas } from './offer-access.service';
import { OfferAuditService } from './offer-audit.service';
import { OfferDraft, validateOfferDraft } from './offer-validation';

// Changing these after customers redeemed the offer would make history ambiguous; clone the offer instead.
const TERMS_LOCKED_AFTER_REDEMPTION = ['discountType', 'discountValue', 'maxDiscountAmount', 'bogoBuyQty', 'bogoGetQty'] as const satisfies readonly (keyof UpdateOfferDto)[];

const SCALAR_UPDATABLE = [
  'name', 'description', 'discountType', 'discountValue', 'maxDiscountAmount', 'minOrderAmount', 'bogoBuyQty', 'bogoGetQty',
  'startsAt', 'endsAt', 'eligibleDays', 'eligibleStartTime', 'eligibleEndTime', 'combineMode', 'stackGroup', 'priority',
  'requiresCoupon', 'isPublic', 'totalUsageLimit', 'perCustomerLimit',
] as const satisfies readonly (keyof UpdateOfferDto)[];

const ALLOWED_TRANSITIONS: Readonly<Record<OfferStatus, readonly OfferStatus[]>> = {
  [OfferStatus.DRAFT]: [OfferStatus.ACTIVE, OfferStatus.ARCHIVED],
  [OfferStatus.ACTIVE]: [OfferStatus.PAUSED, OfferStatus.ARCHIVED],
  [OfferStatus.PAUSED]: [OfferStatus.ACTIVE, OfferStatus.ARCHIVED],
  [OfferStatus.ARCHIVED]: [],
};

@Injectable()
export class OffersAdminService {
  constructor(
    @InjectRepository(Offer) private readonly offers: Repository<Offer>,
    @InjectRepository(Movie) private readonly movies: Repository<Movie>,
    @InjectRepository(OfferRedemption) private readonly redemptions: Repository<OfferRedemption>,
    private readonly dataSource: DataSource,
    private readonly cinemasService: CinemasService,
    private readonly access: OfferAccessService,
    private readonly audit: OfferAuditService,
  ) {}

  async create(user: JwtUser, dto: CreateOfferDto): Promise<OfferResponseDto> {
    validateOfferDraft(dto);
    this.assertCanTarget(user, dto.cinemaIds ?? []);
    await this.assertTargetsExist(dto.cinemaIds ?? [], dto.movieIds ?? []);
    const id = await this.dataSource.transaction(async (manager) => {
      const offer = await manager.save(Offer, manager.create(Offer, {
        name: dto.name, description: dto.description ?? null, discountType: dto.discountType, discountValue: dto.discountValue,
        maxDiscountAmount: dto.maxDiscountAmount ?? null, minOrderAmount: dto.minOrderAmount ?? 0,
        bogoBuyQty: dto.bogoBuyQty ?? null, bogoGetQty: dto.bogoGetQty ?? null, startsAt: dto.startsAt, endsAt: dto.endsAt,
        eligibleDays: dto.eligibleDays ?? null, eligibleStartTime: dto.eligibleStartTime ?? null, eligibleEndTime: dto.eligibleEndTime ?? null,
        combineMode: dto.combineMode ?? OfferCombineMode.EXCLUSIVE, stackGroup: dto.stackGroup?.toUpperCase() ?? null,
        priority: dto.priority ?? DEFAULT_OFFER_PRIORITY, requiresCoupon: dto.requiresCoupon ?? false, isPublic: dto.isPublic ?? true,
        totalUsageLimit: dto.totalUsageLimit ?? null, perCustomerLimit: dto.perCustomerLimit ?? null,
        status: OfferStatus.DRAFT, createdBy: user.id,
      }));
      await this.replaceTargets(manager, offer.id, dto);
      return offer.id;
    });
    this.audit.record(user.id, 'OFFER_CREATED', id, { discountType: dto.discountType });
    return this.getDetail(user, id);
  }

  async update(user: JwtUser, id: string, dto: UpdateOfferDto): Promise<OfferResponseDto> {
    const offer = await this.access.loadManaged(user, id);
    if (offer.status === OfferStatus.ARCHIVED) throw new ConflictException('Archived offers cannot be edited');
    await this.assertTermsEditable(offer.id, dto);
    const draft = this.mergeDraft(offer, dto);
    validateOfferDraft(draft);
    if (dto.cinemaIds) this.assertCanTarget(user, dto.cinemaIds);
    await this.assertTargetsExist(dto.cinemaIds ?? [], dto.movieIds ?? []);
    await this.dataSource.transaction(async (manager) => {
      await manager.update(Offer, { id }, { ...pickDefined(dto, SCALAR_UPDATABLE), ...(dto.stackGroup ? { stackGroup: dto.stackGroup.toUpperCase() } : {}) });
      await this.replaceTargets(manager, id, dto, true);
    });
    this.audit.record(user.id, 'OFFER_UPDATED', id, { fields: Object.keys(dto) });
    return this.getDetail(user, id);
  }

  async transition(user: JwtUser, id: string, target: OfferStatus): Promise<OfferResponseDto> {
    const offer = await this.access.loadManaged(user, id);
    if (!ALLOWED_TRANSITIONS[offer.status].includes(target)) throw new ConflictException(`Cannot move offer from ${offer.status} to ${target}`);
    if (target === OfferStatus.ACTIVE && offer.endsAt <= new Date()) throw new BadRequestException('Cannot activate an offer whose endsAt has passed');
    await this.offers.update({ id }, { status: target });
    this.audit.record(user.id, `OFFER_${target}`, id, { from: offer.status });
    return this.getDetail(user, id);
  }

  async getDetail(user: JwtUser, id: string): Promise<OfferResponseDto> {
    const offer = await this.access.loadManaged(user, id);
    return OfferResponseDto.fromAdmin(offer, await this.redemptions.countBy({ offerId: id }));
  }

  private assertCanTarget(user: JwtUser, cinemaIds: readonly string[]): void {
    if (!canManageCinemas(user, cinemaIds)) throw new NotFoundException('Cinema not found');
  }

  private async assertTargetsExist(cinemaIds: readonly string[], movieIds: readonly string[]): Promise<void> {
    await this.cinemasService.assertAllExist(cinemaIds);
    if (movieIds.length > 0 && (await this.movies.count({ where: { id: In([...movieIds]) } })) !== new Set(movieIds).size) {
      throw new NotFoundException('One or more movies not found');
    }
  }

  private async assertTermsEditable(offerId: string, dto: UpdateOfferDto): Promise<void> {
    if (!TERMS_LOCKED_AFTER_REDEMPTION.some((field) => dto[field] !== undefined)) return;
    if ((await this.redemptions.countBy({ offerId })) > 0) {
      throw new ConflictException('Offer already has redemptions; create a new offer to change discount terms');
    }
  }

  private mergeDraft(offer: Offer, dto: UpdateOfferDto): OfferDraft {
    return {
      discountType: dto.discountType ?? offer.discountType,
      discountValue: dto.discountValue ?? offer.discountValue,
      maxDiscountAmount: dto.maxDiscountAmount ?? offer.maxDiscountAmount,
      bogoBuyQty: dto.bogoBuyQty ?? offer.bogoBuyQty,
      bogoGetQty: dto.bogoGetQty ?? offer.bogoGetQty,
      startsAt: dto.startsAt ?? offer.startsAt,
      endsAt: dto.endsAt ?? offer.endsAt,
      eligibleStartTime: dto.eligibleStartTime ?? offer.eligibleStartTime?.slice(0, 5),
      eligibleEndTime: dto.eligibleEndTime ?? offer.eligibleEndTime?.slice(0, 5),
      paymentRules: dto.paymentRules ?? offer.paymentRules,
    };
  }

  // When `replace` is set, only the collections present in the DTO are replaced.
  private async replaceTargets(manager: EntityManager, offerId: string, dto: UpdateOfferDto, replace = false): Promise<void> {
    if (dto.cinemaIds && (replace || dto.cinemaIds.length > 0)) {
      await manager.delete(OfferCinema, { offerId });
      if (dto.cinemaIds.length > 0) await manager.insert(OfferCinema, dto.cinemaIds.map((cinemaId) => ({ offerId, cinemaId })));
    }
    if (dto.movieIds && (replace || dto.movieIds.length > 0)) {
      await manager.delete(OfferMovie, { offerId });
      if (dto.movieIds.length > 0) await manager.insert(OfferMovie, dto.movieIds.map((movieId) => ({ offerId, movieId })));
    }
    if (dto.paymentRules && (replace || dto.paymentRules.length > 0)) {
      await manager.delete(OfferPaymentRule, { offerId });
      if (dto.paymentRules.length > 0) await manager.insert(OfferPaymentRule, dto.paymentRules.map((rule) => this.toRuleRow(offerId, rule)));
    }
  }

  private toRuleRow(offerId: string, rule: PaymentRuleDto): Partial<OfferPaymentRule> {
    return { offerId, method: rule.method ?? null, bankCode: rule.bankCode?.toUpperCase() ?? null, cardNetwork: rule.cardNetwork ?? null, cardBins: rule.cardBins ?? [] };
  }
}
