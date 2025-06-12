import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { DataSource, In, Repository } from 'typeorm';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
    private readonly datasource: DataSource,
  ) {}
  /**
   * Creates a new role.
   * @param {CreateRoleDto} createRoleDto - The data for creating a new role.
   * @returns {Promise<Role>} The newly created role object.
   * @throws {BadRequestException} If the provided role data is invalid.
   * @throws {InternalServerErrorException} If an error occurs while creating the role.
   */
  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    try {
      const role = this.roleRepository.create({
        name: createRoleDto.name,
        description: createRoleDto.description,
      });
      await this.roleRepository.save(role);
      return role;
    } catch (error) {
      console.error('Error creating role:', error);
      throw new InternalServerErrorException(
        'An error occurred while creating the role. Please check server logs for details.',
        error,
      );
    }
  }
  /**
   * Retrieves all roles.
   * @returns An array of roles.
   */
  async getAllRoles(): Promise<Role[]> {
    try {
      return await this.roleRepository.find();
    } catch (error) {
      console.error('Error retrieving roles:', error);
      throw new InternalServerErrorException(
        'An error occurred while retrieving roles. Please check server logs for details.',
        error,
      );
    }
  }
  /**
   * Retrieves a role by its name.
   * @param name The name of the role to retrieve.
   * @returns The role with the specified name.
   * @throws {BadRequestException} If the provided name is invalid.
   */
  async findOne(name: string): Promise<Role> {
    try {
      const role = await this.roleRepository.findOne({ where: { name } });
      if (!role) {
        throw new BadRequestException('Role not found');
      }
      return role;
    } catch (error) {
      console.error('error fetching role', error);
      throw new InternalServerErrorException(
        'An error occurred while fetching role. Please check server logs for details.',
        error,
      );
    }
  }
  async getRoleById(id: string): Promise<Role> {
    try {
      const role = await this.roleRepository.findOne({ where: { id } });
      if (!role) {
        throw new BadRequestException(`Role with ID ${id} not found`);
      }
      return role;
    } catch (error) {
      console.error('Error retrieving role:', error);
      throw new InternalServerErrorException(
        'An error occurred while retrieving the role. Please check server logs for details.',
        error,
      );
    }
  }
  /**
   * Updates a role by its ID.
   * @param id The ID of the role to update.
   * @param updateRoleDto The data to update the role with.
   * @returns The updated role.
   * @throws {BadRequestException} If the provided ID is invalid.
   */
  async updateRole(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    try {
      const { name } = updateRoleDto;
      const role = await this.roleRepository.findOne({ where: { id } });
      if (!role) {
        throw new BadRequestException(`Role with ID ${id} not found`);
      }
      role.name = name;
      await this.roleRepository.save(role);
      return role;
    } catch (error) {
      if (error.name === 'CastError') {
        throw new BadRequestException('Invalid role ID provided', error);
      } else if (error.name === 'ValidationError') {
        throw new BadRequestException('Invalid role data provided', error);
      }
      console.error('Error updating role:', error);
      throw new InternalServerErrorException(
        'An error occurred while updating the role. Please check server logs for details.',
        error,
      );
    }
  }
  /**
   * Deletes a role by its ID.
   * @param id The ID of the role to delete.
   * @throws {BadRequestException} If the provided ID is invalid.
   */
  async deleteRole(id: string): Promise<void> {
    try {
      const role = await this.roleRepository.delete(id);
      if (role.affected === 0) {
        throw new BadRequestException(`Role with ID ${id} not found`);
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      throw new InternalServerErrorException(
        'An error occurred while deleting the role. Please check server logs for details.',
        error,
      );
    }
  }
  /**
   * Assigns a permission to a role.
   * @returns The updated role with the assigned permission.
   */
  async assignPermissionsToRole(
    roleId: string,
    assignPermissionDto: AssignPermissionDto,
  ): Promise<Role> {
    const queryRunner = this.datasource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { permissions } = assignPermissionDto;
      const role = await queryRunner.manager.findOne(Role, {
        where: { id: roleId },
        relations: ['permissions'],
      });
      if (!Array.isArray(permissions)) {
        throw new BadRequestException('Permissions must be arrays');
      }
      const permissionsToAssign = await queryRunner.manager.find(Permission, {
        where: { id: In(permissions) },
      });
      if (!role) {
        throw new BadRequestException('Role not found');
      }
      if (permissionsToAssign.length !== permissions.length) {
        throw new BadRequestException('One or more permission not found');
      }
      const existingPermissionIds = new Set(role.permissions.map((p) => p.id));
      const newPermissionIds = permissionsToAssign.filter(
        (p) => !existingPermissionIds.has(p.id),
      );
      await this.roleRepository
        .createQueryBuilder()
        .relation(Role, 'permissions')
        .of(role)
        .add(newPermissionIds);
      const updatedRole = await queryRunner.manager.findOne(Role, {
        where: { id: roleId },
        relations: ['permissions'],
      });
      await queryRunner.commitTransaction();
      return updatedRole;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('error assigning permission to role', error);
      throw new InternalServerErrorException(
        'An error occurred while assigning permissions to role. Please check server logs for details.',
        error,
      );
    } finally {
      await queryRunner.release();
    }
  }
  /**
   * Removes a permission from a role.
   * @returns The updated role with the removed permission.
   */
  async removePermissionsFromRole(
    roleId: string,
    removePermissionDto: AssignPermissionDto,
  ): Promise<Role> {
    const queryRunner = this.datasource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { permissions } = removePermissionDto;
      const role = await queryRunner.manager.findOne(Role, {
        where: { id: roleId },
        relations: ['permissions'],
      });
      console.log('role', role);
      if (!role) {
        throw new BadRequestException('Role not found');
      }
      const validPermissions = await queryRunner.manager.find(Permission, {
        where: { id: In(permissions) },
      });
      console.log('validPermissions', validPermissions);
      if (validPermissions.length === 0) {
        throw new BadRequestException('No Permission found');
      }
      const permissionsToRemoveFromRole = role.permissions.filter(
        (removePermission) =>
          validPermissions.some(
            (permission) => permission.id === removePermission.id,
          ),
      );
      console.log('permissionsToRemoveFromDenied', permissionsToRemoveFromRole);
      if (permissionsToRemoveFromRole.length === 0) {
        return role;
      }
      if (permissionsToRemoveFromRole.length > 0) {
        await queryRunner.manager
          .createQueryBuilder()
          .relation(Role, 'permissions')
          .of(role)
          .remove(permissionsToRemoveFromRole);
      }
      const updatedRole = await queryRunner.manager.findOne(Role, {
        where: { id: roleId },
        relations: ['permissions'],
      });
      console.log('updatedRole', updatedRole);
      await queryRunner.commitTransaction();
      return updatedRole;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('error removing permission from role', error);
      throw new InternalServerErrorException(
        'An error occurred while removing permission from role. Please check server logs for details.',
        error,
      );
    } finally {
      await queryRunner.release();
    }
  }
}
