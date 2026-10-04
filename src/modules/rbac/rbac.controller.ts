import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions, Roles } from '../../common/decorators';
import { SystemRole } from '../../common/enums/system-role.enum';
import { AssignRoleDto, CreateRoleDto, SetRolePermissionsDto } from './dto/rbac.dto';
import { RbacService } from './rbac.service';

@ApiTags('admin / rbac')
@Roles(SystemRole.SUPER_ADMIN)
@Controller('admin')
export class RbacController {
  constructor(private readonly rbac: RbacService) {}

  @Get('roles')
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'List roles with permissions' })
  async listRoles() {
    const roles = await this.rbac.listRoles();
    return roles.map((r) => ({ id: r.id, name: r.name, isSystem: r.isSystem, permissions: r.permissions.map((p) => p.code) }));
  }

  @Get('permissions')
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'List permission catalog' })
  async listPermissions() {
    return (await this.rbac.listPermissions()).map((p) => ({ id: p.id, code: p.code }));
  }

  @Post('roles')
  @RequirePermissions('roles:write')
  @ApiOperation({ summary: 'Create a custom role' })
  async createRole(@Body() dto: CreateRoleDto) {
    const role = await this.rbac.createRole(dto.name, dto.description);
    return { id: role.id, name: role.name };
  }

  @Put('roles/:roleId/permissions')
  @RequirePermissions('roles:write')
  @ApiOperation({ summary: 'Replace permissions of a role' })
  async setPermissions(@Param('roleId', ParseUUIDPipe) roleId: string, @Body() dto: SetRolePermissionsDto) {
    const role = await this.rbac.setRolePermissions(roleId, dto.permissionCodes);
    return { id: role.id, permissions: role.permissions.map((p) => p.code) };
  }

  @Post('users/:userId/roles')
  @HttpCode(204)
  @RequirePermissions('users:write')
  @ApiOperation({ summary: 'Assign role to a user (optionally cinema-scoped)' })
  async assign(@Param('userId', ParseUUIDPipe) userId: string, @Body() dto: AssignRoleDto): Promise<void> {
    await this.rbac.assignRole(userId, dto.roleId, dto.cinemaId);
  }

  @Delete('users/:userId/roles/:roleId')
  @HttpCode(204)
  @RequirePermissions('users:write')
  @ApiOperation({ summary: 'Revoke a platform-wide role from a user' })
  async revoke(@Param('userId', ParseUUIDPipe) userId: string, @Param('roleId', ParseUUIDPipe) roleId: string): Promise<void> {
    await this.rbac.revokeRole(userId, roleId);
  }
}
