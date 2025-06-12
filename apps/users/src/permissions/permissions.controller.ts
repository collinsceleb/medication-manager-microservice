import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Controller()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @MessagePattern({ cmd: 'create_permission' })
  async createPermission(@Payload() createPermissionDto: CreatePermissionDto) {
    return await this.permissionsService.createPermission(createPermissionDto);
  }

  @MessagePattern({ cmd: 'get_all_permissions' })
  async getAllPermissions() {
    return await this.permissionsService.getAllPermissions();
  }

  @MessagePattern({ cmd: 'get_permission' })
  async getPermissionById(@Payload() id: string) {
    return await this.permissionsService.getPermissionById(id);
  }

  @MessagePattern({ cmd: 'update_permission' })
  async updatePermission(
    @Payload() data: { id: string; updatePermissionDto: UpdatePermissionDto },
  ) {
    const { id, updatePermissionDto } = data;
    return await this.permissionsService.updatePermission(
      id,
      updatePermissionDto,
    );
  }

  @MessagePattern({ cmd: 'delete_permission' })
  async deletePermission(@Payload() id: string) {
    return await this.permissionsService.deletePermission(id);
  }
}
