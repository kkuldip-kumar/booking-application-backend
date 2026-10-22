export enum PromotionType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  BOGO = 'BOGO',
}

export enum PromotionStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  ARCHIVED = 'ARCHIVED',
}

/** How this offer interacts with other applied offers. */
export enum CombinabilityRule {
  /** Cannot combine with any other offer. */
  EXCLUSIVE = 'EXCLUSIVE',
  /** May combine with other STACKABLE offers; EXCLUSIVE blocks all. */
  STACKABLE = 'STACKABLE',
  /** Pick the single best discount among eligible BEST_ONLY offers. */
  BEST_ONLY = 'BEST_ONLY',
}

export enum PaymentMethod {
  CARD = 'CARD',
  UPI = 'UPI',
  NET_BANKING = 'NET_BANKING',
  WALLET = 'WALLET',
}

export enum CardNetwork {
  VISA = 'VISA',
  MASTERCARD = 'MASTERCARD',
  RUPAY = 'RUPAY',
  AMEX = 'AMEX',
}
