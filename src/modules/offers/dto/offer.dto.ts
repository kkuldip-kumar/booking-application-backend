import { PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayUnique, IsArray, IsBoolean, IsDate, IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Matches, Max, MaxLength, Min, ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { MAX_PRICE_PAISE, TIME_REGEX } from '../../../common/constants/cinema.constants';
import { MAX_BOGO_QTY, MAX_OFFER_TARGETS, MAX_PAYMENT_RULES } from '../../../common/constants/offer.constants';
import { CardNetwork, OfferCombineMode, OfferDiscountType, OfferStatus, PaymentMethod } from '../../../common/enums/offer.enums';
import { Offer } from '../entities/offer.entity';

const upperCase = ({ value }: { value: unknown }): unknown => (typeof value === 'string' ? value.trim().toUpperCase() : value);

export class PaymentRuleDto {
  @IsOptional() @IsEnum(PaymentMethod) method?: PaymentMethod;
  @IsOptional() @Transform(upperCase) @Matches(/^[A-Z0-9_]{2,20}$/) bankCode?: string;
  @IsOptional() @IsEnum(CardNetwork) cardNetwork?: CardNetwork;

  // Issuer BIN prefixes (first 6-8 digits) - never full card numbers.
  @IsOptional() @IsArray() @ArrayUnique() @ArrayMaxSize(50) @Matches(/^\d{6,8}$/, { each: true }) cardBins?: string[];
}

export class CreateOfferDto {
  @IsString() @Length(3, 150) name!: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsEnum(OfferDiscountType) discountType!: OfferDiscountType;

  // PERCENTAGE / BOGO: basis points (1000 = 10%). FIXED_AMOUNT: paise.
  @IsInt() @Min(1) @Max(MAX_PRICE_PAISE) discountValue!: number;
  @IsOptional() @IsInt() @Min(1) @Max(MAX_PRICE_PAISE) maxDiscountAmount?: number;
  @IsOptional() @IsInt() @Min(0) @Max(MAX_PRICE_PAISE) minOrderAmount?: number;
  @IsOptional() @IsInt() @Min(1) @Max(MAX_BOGO_QTY) bogoBuyQty?: number;
  @IsOptional() @IsInt() @Min(1) @Max(MAX_BOGO_QTY) bogoGetQty?: number;
  @Type(() => Date) @IsDate() startsAt!: Date;
  @Type(() => Date) @IsDate() endsAt!: Date;

  // 0 = Sunday .. 6 = Saturday, evaluated on the showtime date in the cinema's timezone.
  @IsOptional() @IsArray() @ArrayUnique() @ArrayMaxSize(7) @IsInt({ each: true }) @Min(0, { each: true }) @Max(6, { each: true }) eligibleDays?: number[];
  @IsOptional() @Matches(TIME_REGEX) eligibleStartTime?: string;
  @IsOptional() @Matches(TIME_REGEX) eligibleEndTime?: string;
  @IsOptional() @IsEnum(OfferCombineMode) combineMode?: OfferCombineMode;
  @IsOptional() @Transform(upperCase) @Matches(/^[A-Z0-9_]{2,50}$/) stackGroup?: string;
  @IsOptional() @IsInt() @Min(0) @Max(1000) priority?: number;
  @IsOptional() @IsBoolean() requiresCoupon?: boolean;
  @IsOptional() @IsBoolean() isPublic?: boolean;
  @IsOptional() @IsInt() @Min(1) @Max(100_000_000) totalUsageLimit?: number;
  @IsOptional() @IsInt() @Min(1) @Max(1000) perCustomerLimit?: number;

  // Empty/omitted = valid at every cinema / for every movie.
  @IsOptional() @IsArray() @ArrayUnique() @ArrayMaxSize(MAX_OFFER_TARGETS) @IsUUID('4', { each: true }) cinemaIds?: string[];
  @IsOptional() @IsArray() @ArrayUnique() @ArrayMaxSize(MAX_OFFER_TARGETS) @IsUUID('4', { each: true }) movieIds?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(MAX_PAYMENT_RULES) @ValidateNested({ each: true }) @Type(() => PaymentRuleDto) paymentRules?: PaymentRuleDto[];
}

export class UpdateOfferDto extends PartialType(CreateOfferDto) {}

export class QueryOffersDto extends PaginationQueryDto {
  @IsOptional() @IsEnum(OfferStatus) status?: OfferStatus;
  @IsOptional() @IsString() @Length(1, 100) q?: string;
  @IsOptional() @IsUUID('4') cinemaId?: string;
  @IsOptional() @IsUUID('4') movieId?: string;
}

export class QueryPublicOffersDto extends PaginationQueryDto {
  @IsOptional() @IsUUID('4') cinemaId?: string;
  @IsOptional() @IsUUID('4') movieId?: string;
}

export class PaymentRuleResponseDto {
  method!: PaymentMethod | null;
  bankCode!: string | null;
  cardNetwork!: CardNetwork | null;
  cardBins!: string[];
}

export class PublicOfferDto {
  id!: string;
  name!: string;
  description!: string | null;
  discountType!: OfferDiscountType;
  discountValue!: number;
  maxDiscountAmount!: number | null;
  minOrderAmount!: number;
  bogoBuyQty!: number | null;
  bogoGetQty!: number | null;
  startsAt!: Date;
  endsAt!: Date;
  eligibleDays!: number[] | null;
  eligibleStartTime!: string | null;
  eligibleEndTime!: string | null;
  requiresCoupon!: boolean;
  cinemaIds!: string[];
  movieIds!: string[];
  paymentRules!: PaymentRuleResponseDto[];

  static from(offer: Offer): PublicOfferDto {
    return {
      id: offer.id, name: offer.name, description: offer.description, discountType: offer.discountType,
      discountValue: offer.discountValue, maxDiscountAmount: offer.maxDiscountAmount, minOrderAmount: offer.minOrderAmount,
      bogoBuyQty: offer.bogoBuyQty, bogoGetQty: offer.bogoGetQty, startsAt: offer.startsAt, endsAt: offer.endsAt,
      eligibleDays: offer.eligibleDays, eligibleStartTime: offer.eligibleStartTime?.slice(0, 5) ?? null,
      eligibleEndTime: offer.eligibleEndTime?.slice(0, 5) ?? null, requiresCoupon: offer.requiresCoupon,
      cinemaIds: (offer.cinemas ?? []).map((row) => row.cinemaId), movieIds: (offer.movies ?? []).map((row) => row.movieId),
      paymentRules: (offer.paymentRules ?? []).map((r) => ({ method: r.method, bankCode: r.bankCode, cardNetwork: r.cardNetwork, cardBins: r.cardBins })),
    };
  }
}

export class OfferResponseDto extends PublicOfferDto {
  status!: OfferStatus;
  combineMode!: OfferCombineMode;
  stackGroup!: string | null;
  priority!: number;
  isPublic!: boolean;
  totalUsageLimit!: number | null;
  perCustomerLimit!: number | null;
  createdBy!: string;
  createdAt!: Date;
  redeemedCount?: number;

  static fromAdmin(offer: Offer, redeemedCount?: number): OfferResponseDto {
    return {
      ...PublicOfferDto.from(offer), status: offer.status, combineMode: offer.combineMode, stackGroup: offer.stackGroup,
      priority: offer.priority, isPublic: offer.isPublic, totalUsageLimit: offer.totalUsageLimit,
      perCustomerLimit: offer.perCustomerLimit, createdBy: offer.createdBy, createdAt: offer.createdAt, redeemedCount,
    };
  }
}
