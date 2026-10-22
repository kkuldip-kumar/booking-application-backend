import { BadRequestException } from '@nestjs/common';
import { OfferDiscountType as D, PaymentMethod } from '../../common/enums/offer.enums';
import { OfferDraft, validateOfferDraft } from './offer-validation';

const draft = (over: Partial<OfferDraft> = {}): OfferDraft => ({
  discountType: D.PERCENTAGE, discountValue: 1000, startsAt: new Date('2026-01-01'), endsAt: new Date('2026-02-01'), ...over,
});

describe('validateOfferDraft', () => {
  it('accepts a valid percentage offer', () => expect(() => validateOfferDraft(draft())).not.toThrow());
  it.each<[string, Partial<OfferDraft>]>([
    ['percentage above 100%', { discountValue: 10001 }],
    ['BOGO without quantities', { discountType: D.BOGO, discountValue: 10000 }],
    ['quantities on non-BOGO', { bogoBuyQty: 1, bogoGetQty: 1 }],
    ['max discount on fixed', { discountType: D.FIXED_AMOUNT, maxDiscountAmount: 100 }],
    ['end before start', { endsAt: new Date('2025-01-01') }],
    ['half a time window', { eligibleStartTime: '10:00' }],
    ['empty time window', { eligibleStartTime: '10:00', eligibleEndTime: '10:00' }],
    ['empty payment rule', { paymentRules: [{}] }],
    ['BIN on UPI rule', { paymentRules: [{ method: PaymentMethod.UPI, cardBins: ['411111'] }] }],
  ])('rejects %s', (_n, over) => expect(() => validateOfferDraft(draft(over))).toThrow(BadRequestException));
  it('accepts a credit-card bank rule', () => {
    expect(() => validateOfferDraft(draft({ paymentRules: [{ method: PaymentMethod.CREDIT_CARD, bankCode: 'HDFC', cardBins: ['411111'] }] }))).not.toThrow();
  });
});
