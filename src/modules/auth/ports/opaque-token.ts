export interface GeneratedToken {
  readonly raw: string;
  readonly hash: string;
}

export abstract class OpaqueTokenGenerator {
  abstract generate(): GeneratedToken;
  abstract hash(raw: string): string;
}
