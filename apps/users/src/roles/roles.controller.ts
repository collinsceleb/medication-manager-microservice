import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionDto } from './dto/assign-permission.dto';

@Controller()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @MessagePattern({ cmd: 'create_role' })
  async createRole(@Payload() createRoleDto: CreateRoleDto) {
    return await this.rolesService.createRole(createRoleDto);
  }

  @MessagePattern({ cmd: 'get_all_roles' })
  async getAllRoles() {
    return await this.rolesService.getAllRoles();
  }

  @MessagePattern({ cmd: 'get_role' })
  async getRoleById(@Payload() id: string) {
    return await this.rolesService.getRoleById(id);
  }

  @MessagePattern({ cmd: 'update_role' })
  async updateRole(
    @Payload() data: { id: string; updateRoleDto: UpdateRoleDto },
  ) {
    const { id, updateRoleDto } = data;
    return await this.rolesService.updateRole(id, updateRoleDto);
  }

  @MessagePattern({ cmd: 'delete_role' })
  async deleteRole(@Payload() id: string) {
    return await this.rolesService.deleteRole(id);
  }

  @MessagePattern({ cmd: 'assign_permissions_to_role' })
  async addPermissionsToRole(
    @Payload()
    data: {
      roleId: string;
      assignPermissionsDto: AssignPermissionDto;
    },
  ) {
    const { roleId, assignPermissionsDto } = data;
    return await this.rolesService.assignPermissionsToRole(
      roleId,
      assignPermissionsDto,
    );
  }

  @MessagePattern({ cmd: 'remove_permissions_from_role' })
  async removePermissionsFromRole(
    @Payload()
    data: {
      roleId: string;
      removePermissionsDto: AssignPermissionDto;
    },
  ) {
    const { roleId, removePermissionsDto } = data;
    return await this.rolesService.removePermissionsFromRole(
      roleId,
      removePermissionsDto,
    );
  }
}
