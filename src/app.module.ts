import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { appConfig } from './config/app.config';
import { authConfig } from './config/auth.config';
import { databaseConfig } from './config/database.config';
import { validateEnv } from './config/env.validation';
import { mailConfig } from './config/mail.config';
import { AuditLog } from './modules/audit/entities/audit-log.entity';
import { AuthModule } from './modules/auth/auth.module';
import { RefreshToken } from './modules/auth/entities/refresh-token.entity';
import { VerificationToken } from './modules/auth/entities/verification-token.entity';
import { Permission } from './modules/rbac/entities/permission.entity';
import { Role } from './modules/rbac/entities/role.entity';
import { UserRole } from './modules/rbac/entities/user-role.entity';
import { User } from './modules/users/entities/user.entity';
import { ScannerDevice } from './modules/tickets/entities/scanner-device.entity';
import { TicketScanLog } from './modules/tickets/entities/ticket-scan-log.entity';
import { Ticket } from './modules/tickets/entities/ticket.entity';
import { BookingsModule } from './modules/bookings/bookings.module';
import { CinemasModule } from './modules/cinemas/cinemas.module';
import { CitiesModule } from './modules/cities/cities.module';
import { MoviesModule } from './modules/movies/movies.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OffersModule } from './modules/offers/offers.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PeopleModule } from './modules/people/people.module';
import { ScreensModule } from './modules/screens/screens.module';
import { SeatLayoutsModule } from './modules/seat-layouts/seat-layouts.module';
import { ShowtimesModule } from './modules/showtimes/showtimes.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { UsersModule } from './modules/users/users.module';
import { Payment } from './modules/payments/payment.entity';
import { Cinema } from './modules/cinemas/entities/cinema.entity';
import { CinemaImage } from './modules/cinemas/entities/cinema-image.entity';
import { City } from './modules/cities/entities/city.entity';
import { Booking } from './modules/bookings/entities/booking.entity';
import { BookingSeat } from './modules/bookings/entities/booking-seat.entity';
import { SeatLayout } from './modules/seat-layouts/entities/seat-layout.entity';
import { SeatType } from './modules/seat-layouts/entities/seat-type.entity';
import { Screen } from './modules/screens/entities/screen.entity';
import { Seat } from './modules/seat-layouts/entities/seat.entity';
import { Offer } from './modules/offers/entities/offer.entity';
import { OfferCinema } from './modules/offers/entities/offer-cinema.entity';
import { OfferMovie } from './modules/offers/entities/offer-movie.entity';
import { OfferPaymentRule } from './modules/offers/entities/offer-payment-rule.entity';
import { Coupon } from './modules/offers/entities/coupon.entity';
import { OfferRedemption } from './modules/offers/entities/offer-redemption.entity';

export const ENTITIES = [
  User, Role, Permission, UserRole, RefreshToken, VerificationToken, AuditLog,
  Ticket, TicketScanLog, ScannerDevice, Payment, Cinema, CinemaImage, City,
  Booking, BookingSeat, SeatLayout, SeatType, Screen, Seat,
  Offer, OfferCinema, OfferMovie, OfferPaymentRule, Coupon, OfferRedemption,
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig, authConfig, databaseConfig, mailConfig], validate: validateEnv }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.getOrThrow<string>('database.url'),
        ssl: config.get<boolean>('database.ssl') ? { rejectUnauthorized: false } : false,
        entities: ENTITIES,
        autoLoadEntities: true,
        synchronize: false,
        extra: { max: 10, statement_timeout: 10_000, idle_in_transaction_session_timeout: 15_000 },
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ connection: { url: config.getOrThrow<string>('database.redisUrl') } }),
    }),
    AuthModule,
    UsersModule,
    CitiesModule,
    CinemasModule,
    ScreensModule,
    SeatLayoutsModule,
    PeopleModule,
    MoviesModule,
    ShowtimesModule,
    OffersModule,
    BookingsModule,
    PaymentsModule,
    TicketsModule,
    NotificationsModule,
  ],
})
export class AppModule {}