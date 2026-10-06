import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsEnum, IsOptional, IsUUID, Matches, ValidateNested } from 'class-validator';
import { COUPON_CODE_REGEX, MAX_COUPONS_PER_ORDER, MAX_SEATS_PER_ORDER } from '../../../common/constants/offer.constants';
import { CardNetwork, OfferDiscountType, PaymentMethod } from '../../../common/enums/offer.enums';

const upperCaseEach = ({ value }: { value: unknown }): unknown =>
  Array.isArray(value) ? value.map((v: unknown) => (typeof v === 'string' ? v.trim().toUpperCase() : v)) : value;

// A preview only: the browser's claim about how it will pay. The payments module must re-verify against the gateway.
export class QuotePaymentDto {
  @IsEnum(PaymentMethod) method!: PaymentMethod;
  @IsOptional() @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() : value)) @Matches(/^[A-Z0-9_]{2,20}$/) bankCode?: string;
  @IsOptional() @IsEnum(CardNetwork) cardNetwork?: CardNetwork;
  @IsOptional() @Matches(/^\d{6,8}$/) cardBin?: string;
}

export class QuoteDto {
  @IsUUID('4') showtimeId!: string;

  // showtime_seats ids; prices are always read from the database, never from the client.
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(MAX_SEATS_PER_ORDER) @ArrayUnique() @IsUUID('4', { each: true }) seatIds!: string[];

  @IsOptional() @Transform(upperCaseEach) @IsArray() @ArrayMaxSize(MAX_COUPONS_PER_ORDER) @ArrayUnique() @Matches(COUPON_CODE_REGEX, { each: true })
  couponCodes?: string[];

  @IsOptional() @ValidateNested() @Type(() => QuotePaymentDto) payment?: QuotePaymentDto;
}

export class AppliedOfferDto {
  offerId!: string;
  name!: string;
  couponCode!: string | null;
  discountType!: OfferDiscountType;
  amount!: number;
}

export class UnlockableOfferDto {
  offerId!: string;
  name!: string;
  potentialDiscount!: number;
}

export class QuoteResponseDto {
  showtimeId!: string;
  orderValue!: number;
  discountTotal!: number;
  payable!: number;
  applied!: AppliedOfferDto[];
  unlockableWithPayment!: UnlockableOfferDto[];
}
