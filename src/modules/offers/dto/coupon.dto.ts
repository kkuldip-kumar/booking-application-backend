import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Matches, Max, Min } from 'class-validator';
import { COUPON_CODE_REGEX, COUPON_PREFIX_REGEX, MAX_COUPONS_PER_BULK } from '../../../common/constants/offer.constants';
import { CouponStatus, RedemptionStatus } from '../../../common/enums/offer.enums';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { Coupon } from '../entities/coupon.entity';
import { OfferRedemption } from '../entities/offer-redemption.entity';

const upperCase = ({ value }: { value: unknown }): unknown => (typeof value === 'string' ? value.trim().toUpperCase() : value);

export class CreateCouponsDto {
  // Provide `code` for one hand-picked coupon, or `count` (+ optional `prefix`) to generate random codes.
  @IsOptional() @Transform(upperCase) @Matches(COUPON_CODE_REGEX) code?: string;
  @IsOptional() @IsInt() @Min(1) @Max(MAX_COUPONS_PER_BULK) count?: number;
  @IsOptional() @Transform(upperCase) @Matches(COUPON_PREFIX_REGEX) prefix?: string;
  @IsOptional() @IsInt() @Min(1) @Max(100_000_000) maxUses?: number;
  @IsOptional() @IsInt() @Min(1) @Max(1000) perCustomerLimit?: number;
}

export class UpdateCouponStatusDto {
  @IsEnum(CouponStatus) status!: CouponStatus;
}

export class CouponResponseDto {
  id!: string;
  offerId!: string;
  code!: string;
  maxUses!: number | null;
  perCustomerLimit!: number | null;
  status!: CouponStatus;
  redeemedCount?: number;

  static from(coupon: Coupon, redeemedCount?: number): CouponResponseDto {
    return {
      id: coupon.id, offerId: coupon.offerId, code: coupon.code, maxUses: coupon.maxUses,
      perCustomerLimit: coupon.perCustomerLimit, status: coupon.status, redeemedCount,
    };
  }
}

export class QueryRedemptionsDto extends PaginationQueryDto {
  @IsOptional() @IsEnum(RedemptionStatus) status?: RedemptionStatus;
}

export class RedemptionResponseDto {
  id!: string;
  couponId!: string | null;
  customerId!: string;
  bookingId!: string;
  discountAmount!: number;
  status!: RedemptionStatus;
  createdAt!: Date;

  static from(row: OfferRedemption): RedemptionResponseDto {
    return {
      id: row.id, couponId: row.couponId, customerId: row.customerId, bookingId: row.bookingId,
      discountAmount: row.discountAmount, status: row.status, createdAt: row.createdAt,
    };
  }
}
