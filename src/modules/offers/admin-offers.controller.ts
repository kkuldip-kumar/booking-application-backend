import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { OfferStatus } from '../../common/enums/offer.enums';
import { Role } from '../../common/enums/role.enum';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Paginated } from '../../common/utils/pagination.util';
import { CouponResponseDto, CreateCouponsDto, QueryRedemptionsDto, UpdateCouponStatusDto } from './dto/coupon.dto';
import { CreateOfferDto, OfferResponseDto, QueryOffersDto, UpdateOfferDto } from './dto/offer.dto';
import { CouponsService } from './coupons.service';
import { OffersAdminService } from './offers-admin.service';
import { OffersQueryService, RedemptionPage } from './offers-query.service';

@ApiTags('Admin / Offers')
@Roles(Role.SUPER_ADMIN, Role.CINEMA_ADMIN)
@Controller('admin')
export class AdminOffersController {
  constructor(
    private readonly admin: OffersAdminService,
    private readonly queries: OffersQueryService,
    private readonly coupons: CouponsService,
  ) {}

  @Post('offers')
  @ApiOperation({ summary: 'Create a DRAFT offer (cinema admins: only for their own cinemas)' })
  @ApiOkResponse({ type: OfferResponseDto })
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateOfferDto): Promise<OfferResponseDto> {
    return this.admin.create(user, dto);
  }

  @Get('offers')
  @ApiOperation({ summary: 'List offers visible to the caller' })
  list(@CurrentUser() user: JwtUser, @Query() query: QueryOffersDto): Promise<Paginated<OfferResponseDto>> {
    return this.queries.listAdmin(user, query);
  }

  @Get('offers/:id')
  @ApiOperation({ summary: 'Get an offer with redemption count' })
  get(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string): Promise<OfferResponseDto> {
    return this.admin.getDetail(user, id);
  }

  @Patch('offers/:id')
  @ApiOperation({ summary: 'Update an offer (discount terms lock after the first redemption)' })
  update(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOfferDto): Promise<OfferResponseDto> {
    return this.admin.update(user, id, dto);
  }

  @Post('offers/:id/activate')
  @ApiOperation({ summary: 'Activate (or resume) an offer' })
  activate(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string): Promise<OfferResponseDto> {
    return this.admin.transition(user, id, OfferStatus.ACTIVE);
  }

  @Post('offers/:id/pause')
  @ApiOperation({ summary: 'Pause an active offer' })
  pause(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string): Promise<OfferResponseDto> {
    return this.admin.transition(user, id, OfferStatus.PAUSED);
  }

  @Post('offers/:id/archive')
  @ApiOperation({ summary: 'Archive an offer (terminal)' })
  archive(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string): Promise<OfferResponseDto> {
    return this.admin.transition(user, id, OfferStatus.ARCHIVED);
  }

  @Get('offers/:id/redemptions')
  @ApiOperation({ summary: 'Redemptions of an offer with totals' })
  redemptions(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string, @Query() query: QueryRedemptionsDto): Promise<RedemptionPage> {
    return this.queries.listRedemptions(user, id, query);
  }

  @Post('offers/:id/coupons')
  @ApiOperation({ summary: 'Create one coupon (code) or bulk-generate (count, prefix)' })
  createCoupons(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateCouponsDto): Promise<CouponResponseDto[]> {
    return this.coupons.create(user, id, dto);
  }

  @Get('offers/:id/coupons')
  @ApiOperation({ summary: 'List coupons of an offer with redemption counts' })
  listCoupons(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string, @Query() query: PaginationQueryDto): Promise<Paginated<CouponResponseDto>> {
    return this.coupons.list(user, id, query);
  }

  @Patch('coupons/:couponId/status')
  @ApiOperation({ summary: 'Enable or disable a coupon' })
  setCouponStatus(@CurrentUser() user: JwtUser, @Param('couponId', ParseUUIDPipe) couponId: string, @Body() dto: UpdateCouponStatusDto): Promise<CouponResponseDto> {
    return this.coupons.setStatus(user, couponId, dto.status);
  }
}
