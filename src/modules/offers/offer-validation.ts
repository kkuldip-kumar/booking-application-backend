import { BadRequestException } from '@nestjs/common';
import { MAX_PRICE_PAISE } from '../../common/constants/cinema.constants';
import { BPS_DENOMINATOR } from '../../common/constants/offer.constants';
import { OfferDiscountType, PaymentMethod } from '../../common/enums/offer.enums';

export interface PaymentRuleDraft {
  method?: PaymentMethod | null;
  bankCode?: string | null;
  cardNetwork?: string | null;
  cardBins?: readonly string[] | null;
}

/** Cross-field shape of an offer, used for both create and (merged) update. */
export interface OfferDraft {
  discountType: OfferDiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  bogoBuyQty?: number | null;
  bogoGetQty?: number | null;
  startsAt: Date;
  endsAt: Date;
  eligibleStartTime?: string | null;
  eligibleEndTime?: string | null;
  paymentRules?: readonly PaymentRuleDraft[] | null;
}

const CARD_METHODS: readonly PaymentMethod[] = [PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD];

function validateDiscount(draft: OfferDraft): void {
  const { discountType: type, discountValue: value } = draft;
  if (type === OfferDiscountType.FIXED_AMOUNT && value > MAX_PRICE_PAISE) throw new BadRequestException('discountValue is too large');
  if (type !== OfferDiscountType.FIXED_AMOUNT && value > BPS_DENOMINATOR) {
    throw new BadRequestException('discountValue for PERCENTAGE/BOGO is in basis points (max 10000 = 100%)');
  }
  const isBogo = type === OfferDiscountType.BOGO;
  const hasBogoQty = draft.bogoBuyQty != null && draft.bogoGetQty != null;
  if (isBogo && !hasBogoQty) throw new BadRequestException('BOGO offers require bogoBuyQty and bogoGetQty');
  if (!isBogo && (draft.bogoBuyQty != null || draft.bogoGetQty != null)) {
    throw new BadRequestException('bogoBuyQty/bogoGetQty are only valid for BOGO offers');
  }
  if (type === OfferDiscountType.FIXED_AMOUNT && draft.maxDiscountAmount != null) {
    throw new BadRequestException('maxDiscountAmount is not applicable to FIXED_AMOUNT offers');
  }
}

function validateSchedule(draft: OfferDraft): void {
  if (draft.endsAt <= draft.startsAt) throw new BadRequestException('endsAt must be after startsAt');
  const { eligibleStartTime: start, eligibleEndTime: end } = draft;
  if ((start == null) !== (end == null)) throw new BadRequestException('eligibleStartTime and eligibleEndTime must be set together');
  if (start != null && start === end) throw new BadRequestException('Time window start and end must differ');
}

function validatePaymentRule(rule: PaymentRuleDraft): void {
  const hasBins = (rule.cardBins?.length ?? 0) > 0;
  if (!rule.method && !rule.bankCode && !rule.cardNetwork && !hasBins) {
    throw new BadRequestException('Each payment rule needs at least one of method, bankCode, cardNetwork, cardBins');
  }
  if ((hasBins || rule.cardNetwork) && rule.method && !CARD_METHODS.includes(rule.method)) {
    throw new BadRequestException('cardNetwork/cardBins only apply to CREDIT_CARD or DEBIT_CARD rules');
  }
}

export function validateOfferDraft(draft: OfferDraft): void {
  validateDiscount(draft);
  validateSchedule(draft);
  for (const rule of draft.paymentRules ?? []) validatePaymentRule(rule);
}
