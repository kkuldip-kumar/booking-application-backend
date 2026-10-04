export interface JwtUser {
  readonly id: string;
  readonly email: string;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
  /** Cinemas the user may administer (from cinema-scoped role assignments). */
  readonly cinemaIds: readonly string[];
}

export interface ClientContext {
  readonly ip: string;
  readonly userAgent: string;
}
