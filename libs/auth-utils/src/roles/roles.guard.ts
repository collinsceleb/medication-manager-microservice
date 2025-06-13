import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../../../apps/users/src/user.entity';
import { Repository } from 'typeorm';
import { Role } from '../../../../apps/users/src/roles/entities/role.entity';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PERMISSIONS_KEY } from '@app/auth-utils/permissions/permissions.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly reflector: Reflector,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions) {
      return true;
    }
    const request: Request = context.switchToHttp().getRequest();
    const user = request.user as User;

    if (!user) {
      return false;
    }
    const userWithRoles = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['role', 'role.permissions', 'permissions'],
    });

    if (!userWithRoles?.role) {
      return false;
    }

    // Combine both role-based and user-specific permissions
    const userPermissions = new Set<string>();

    // Add role-based permissions
    const roleWithPermissions = await this.roleRepository.findOne({
      where: { id: userWithRoles.role.id },
      relations: ['permissions'],
    });
    roleWithPermissions.permissions.forEach((permission) =>
      userPermissions.add(permission.name),
    );

    // Add user-specific granted permissions
    userWithRoles.permissions.forEach((permission) =>
      userPermissions.add(permission.name),
    );

    // Remove denied permissions from the final set
    userWithRoles.deniedPermissions?.forEach((permission) =>
      userPermissions.delete(permission.name),
    );
    return requiredPermissions.every((permission) =>
      userPermissions.has(permission),
    );
  }
}
