import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Device } from '../../devices/entities/device.entity';
import { User } from '../../user.entity';

@Entity('refresh_token')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid', {
    name: 'id',
    primaryKeyConstraintName: 'PK_refresh_token_id',
  })
  id: string;

  @Column()
  token: string;

  @ManyToOne(() => User, (user) => user.refreshTokens)
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'FK_refresh_token_user_id',
  })
  @Index('user_id_idx')
  user: User;

  @ManyToOne(() => Device, (device) => device.id)
  @JoinColumn({
    name: 'device_id',
    foreignKeyConstraintName: 'FK_refresh_token_device_id',
  })
  device: Device;

  @Column({ name: 'is_active', default: true })
  @Index('is_active_idx')
  isActive: boolean;

  @Column({ name: 'is_revoked', default: false })
  @Index('is_revoked_idx')
  isRevoked: boolean;

  @Column({ name: 'expires_at', nullable: true, type: 'timestamptz' })
  expiresAt: Date;
}
