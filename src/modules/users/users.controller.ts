import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Current user profile' })
  async me(@CurrentUser() current: JwtUser): Promise<UserResponseDto> {
    return UserResponseDto.from(await this.users.getByIdOrFail(current.id), current.roles, current.permissions);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own profile' })
  async update(@CurrentUser() current: JwtUser, @Body() dto: UpdateProfileDto): Promise<UserResponseDto> {
    return UserResponseDto.from(await this.users.updateProfile(current.id, dto), current.roles, current.permissions);
  }
}
