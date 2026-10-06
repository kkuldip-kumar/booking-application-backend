import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { QUOTE_THROTTLE_LIMIT, QUOTE_THROTTLE_TTL_MS } from '../../common/constants/offer.constants';
import { Role } from '../../common/enums/role.enum';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { Paginated } from '../../common/utils/pagination.util';
import { PublicOfferDto, QueryPublicOffersDto } from './dto/offer.dto';
import { QuoteDto, QuoteResponseDto } from './dto/quote.dto';
import { OfferQuoteService } from './offer-quote.service';
import { OffersQueryService } from './offers-query.service';

@ApiTags('Offers')
@Controller('offers')
export class OffersController {
  constructor(private readonly queries: OffersQueryService, private readonly quotes: OfferQuoteService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List currently valid public offers (optionally for a cinema / movie)' })
  @ApiOkResponse({ type: PublicOfferDto, isArray: true })
  list(@Query() query: QueryPublicOffersDto): Promise<Paginated<PublicOfferDto>> {
    return this.queries.listPublic(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a public offer' })
  @ApiOkResponse({ type: PublicOfferDto })
  get(@Param('id', ParseUUIDPipe) id: string): Promise<PublicOfferDto> {
    return this.queries.getPublic(id);
  }

  // Tight throttle: this endpoint validates coupon codes, so it must not be usable for guessing.
  @Post('quote')
  @Roles(Role.CUSTOMER)
  @Throttle({ default: { limit: QUOTE_THROTTLE_LIMIT, ttl: QUOTE_THROTTLE_TTL_MS } })
  @ApiOperation({ summary: 'Price a seat selection with best offers and optional coupons (preview only)' })
  @ApiOkResponse({ type: QuoteResponseDto })
  quote(@CurrentUser() user: JwtUser, @Body() dto: QuoteDto): Promise<QuoteResponseDto> {
    return this.quotes.quoteForShowtime(user.id, dto);
  }
}
