import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CinemasModule } from '../cinemas/cinemas.module';
import { Movie } from '../movies/entities/movie.entity';
import { ShowtimesModule } from '../showtimes/showtimes.module';
import { AdminOffersController } from './admin-offers.controller';
import { CouponsService } from './coupons.service';
import { Coupon } from './entities/coupon.entity';
import { OfferCinema } from './entities/offer-cinema.entity';
import { OfferMovie } from './entities/offer-movie.entity';
import { OfferPaymentRule } from './entities/offer-payment-rule.entity';
import { OfferRedemption } from './entities/offer-redemption.entity';
import { Offer } from './entities/offer.entity';
import { OfferAccessService } from './offer-access.service';
import { OfferAuditService } from './offer-audit.service';
import { OfferQuoteService } from './offer-quote.service';
import { OfferRedemptionService } from './offer-redemption.service';
import { OfferUsageService } from './offer-usage.service';
import { OffersAdminService } from './offers-admin.service';
import { OffersQueryService } from './offers-query.service';
import { OffersController } from './offers.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Offer, OfferCinema, OfferMovie, OfferPaymentRule, Coupon, OfferRedemption, Movie]),
    CinemasModule,
    ShowtimesModule,
  ],
  controllers: [OffersController, AdminOffersController],
  providers: [
    OffersAdminService, OffersQueryService, CouponsService, OfferAccessService, OfferAuditService,
    OfferUsageService, OfferQuoteService, OfferRedemptionService,
  ],
  // The bookings/payments modules call these inside their own transactions.
  exports: [OfferQuoteService, OfferRedemptionService],
})
export class OffersModule {}
