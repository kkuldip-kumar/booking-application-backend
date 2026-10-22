import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { hasGlobalCinemaAccess } from '../../common/utils/cinema-access.util';
import { Offer } from './entities/offer.entity';

/** Global offers (no cinema targeting) are SUPER_ADMIN-only; cinema admins manage offers confined to their cinemas. */
export function canManageCinemas(user: JwtUser, cinemaIds: readonly string[]): boolean {
  if (hasGlobalCinemaAccess(user)) return true;
  return cinemaIds.length > 0 && cinemaIds.every((id) => user.cinemaIds.includes(id));
}

@Injectable()
export class OfferAccessService {
  constructor(@InjectRepository(Offer) private readonly offers: Repository<Offer>) {}

  /** Loads the offer with targeting + payment rules; foreign offers look like they do not exist (404). */
  async loadManaged(user: JwtUser, id: string): Promise<Offer> {
    const offer = await this.offers.findOne({ where: { id }, relations: { cinemas: true, movies: true, paymentRules: true } });
    if (!offer || !canManageCinemas(user, (offer.cinemas ?? []).map((row) => row.cinemaId))) throw new NotFoundException('Offer not found');
    return offer;
  }
}
