import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Permission } from './entities/permission.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly datasource: DataSource,
  ) {}
  /**
   * Creates a new permission.
   * @param {CreatePermissionDto} createPermissionDto - The data for creating a new permission.
   * @returns {Promise<Permission>} The newly created permission object.
   */
  async createPermission(
    createPermissionDto: CreatePermissionDto,
  ): Promise<Permission> {
    const queryRunner = this.datasource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { name, description } = createPermissionDto;
      const existingPermission = await this.permissionRepository.findOne({
        where: { name },
      });
      if (existingPermission) {
        throw new BadRequestException('Permission already exists');
      }
      const permission = this.permissionRepository.create({
        name: name,
        description: description,
      });
      const savedPermission = await queryRunner.manager.save(permission);
      await queryRunner.commitTransaction();
      return savedPermission;
      // return await this.permissionRepository.save(permission);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error creating permission:', error);
      throw new InternalServerErrorException(
        'An error occurred while creating permission. Please check server logs for details.',
        error,
      );
    } finally {
      await queryRunner.release();
    }
  }
  /**
   * Retrieves all permissions.
   * @returns {Promise<Permission[]>} An array of permission objects.
   */
  async getAllPermissions(): Promise<Permission[]> {
    try {
      return await this.permissionRepository.find();
    } catch (error) {
      console.error('error fetching permissions', error);
      throw new InternalServerErrorException(
        'An error occurred while fetching permissions. Please check server logs for details.',
        error,
      );
    }
  }
  /**
   * Retrieves a permission by its ID.
   * @param {string} id - The ID of the permission to retrieve.
   * @returns {Promise<Permission>} The permission object with the specified ID.
   */
  async getPermissionById(id: string): Promise<Permission> {
    try {
      const permission = await this.permissionRepository.findOne({
        where: { id },
      });
      if (!permission) {
        throw new BadRequestException(`Permission with id ${id} not found`);
      }
      return permission;
    } catch (error) {
      console.error('Error fetching permission by id:', error);
      throw new InternalServerErrorException(
        'An error occurred while fetching the permission. Please check server logs for details.',
        error,
      );
    }
  }
  /**
   * Updates a permission by its ID.
   * @param {string} id - The ID of the permission to be updated.
   * @param {UpdatePermissionDto} updatePermissionDto - The data object for updating the permission.
   * @returns {Promise<Permission>} The updated permission object.
   */
  async updatePermission(
    id: string,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    try {
      const { name, description } = updatePermissionDto;
      const permission = await this.permissionRepository.findOne({
        where: { id },
      });
      if (!permission) {
        throw new BadRequestException(`Permission with id ${id} not found`);
      }
      permission.name = name;
      permission.description = description;
      await this.permissionRepository.save(permission);
      return permission;
    } catch (error) {
      console.error('Error updating permission:', error);
      throw new InternalServerErrorException(
        'An error occurred while updating the permission. Please check server logs for details.',
        error,
      );
    }
  }
  /**
   * Deletes a permission by its ID.
   * @param {string} id - The ID of the permission to be deleted.
   * @returns {Promise<{ message: string }}
   */
  async deletePermission(id: string): Promise<{ message: string }> {
    try {
      const permission = await this.permissionRepository.delete(id);
      if (permission.affected === 0) {
        throw new BadRequestException(`Permission with id ${id} not found`);
      }
      return { message: 'Permission deleted successfully' };
    } catch (error) {
      console.error('Error deleting permission:', error);
      throw new InternalServerErrorException(
        'An error occurred while deleting the permission. Please check server logs for details.',
        error,
      );
    }
  }
}
