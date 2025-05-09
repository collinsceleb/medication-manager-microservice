import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import * as argon2 from 'argon2';
import { Exclude, Expose } from 'class-transformer';

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
