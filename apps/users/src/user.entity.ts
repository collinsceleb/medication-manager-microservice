import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import * as argon2 from 'argon2';
import { Exclude } from 'class-transformer';
import { RefreshToken } from './refresh-tokens/entities/refresh-token.entity';
import { Device } from './devices/entities/device.entity';
import { Role } from './roles/entities/role.entity';
import { Permission } from './permissions/entities/permission.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid', {
    name: 'id',
    primaryKeyConstraintName: 'users_pkey',
  })
  id: string;

  @Column('varchar', { length: 255, nullable: false, unique: true })
  username: string;

  @Column('varchar', { length: 255, nullable: false, unique: true })
  email: string;

  @Column('varchar', { length: 255, nullable: false })
  @Exclude()
  password: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @Column({ name: 'is_blocked', default: false })
  isBlocked: boolean;

  @Column({ name: 'is_email_verified', default: false })
  isEmailVerified: boolean;

  @Column({ name: 'tries', nullable: false, default: 0 })
  @Check('tries >= 0')
  failedAttempts: number;

  @Column({ name: 'is_locked', default: false })
  isLocked: boolean;

  @Column({ name: 'profile_picture', nullable: true })
  profilePicture: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'last_login', nullable: true, type: 'timestamptz' })
  lastLogin: Date;

  @Column({ name: 'country', nullable: true, type: 'varchar' })
  country: string;

  @Column({ name: 'gender', nullable: true, type: 'varchar' })
  gender: string;

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];
  @OneToMany(() => Device, (device) => device.user)
  devices: Device[];

  @Column('jsonb', {
    default: {
      transactionalEmails: false,
      marketingEmails: false,
      systemEmails: false,
    },
  })
  emailPreference: {
    transactionalEmails: boolean;
    marketingEmails: boolean;
    systemEmails: boolean;
  };

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id', foreignKeyConstraintName: 'FK_user_role_id' })
  role: Role;

  @ManyToMany(() => Permission, { cascade: true })
  @JoinTable({
    name: 'user_permissions',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
      foreignKeyConstraintName: 'fk_user_permissions_user_id',
    },
    inverseJoinColumn: {
      name: 'permission_id',
      referencedColumnName: 'id',
      foreignKeyConstraintName: 'fk_user_permissions_permission_id',
    },
  })
  permissions: Permission[];

  @ManyToMany(() => Permission, { cascade: true })
  @JoinTable({
    name: 'user_denied_permissions',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
      foreignKeyConstraintName: 'FK_user_denied_permissions_user_id',
    },
    inverseJoinColumn: {
      name: 'permission_id',
      referencedColumnName: 'id',
      foreignKeyConstraintName: 'FK_user_denied_permissions_permission_id',
    },
  })
  deniedPermissions: Permission[];

  async hashPassword(): Promise<void> {
    this.password = await argon2.hash(this.password);
  }

  async comparePassword(plainPassword: string): Promise<boolean> {
    return await argon2.verify(this.password, plainPassword);
  }

  // @Expose()
  // async getFullName(): Promise<string> {
  //   return `${this.firstName} ${this.lastName}`;
  // }
}
