import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user.entity';

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid', {
    name: 'id',
    primaryKeyConstraintName: 'PK_device_id',
  })
  id: string;

  @ManyToOne(() => User, (user) => user.devices)
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'FK_device_user_id',
  })
  user: User;

  @Column({ name: 'unique_device_id' })
  uniqueDeviceId: string;

  @Column({ name: 'device_type' })
  deviceType: string;

  @Column({ name: 'device_vendor' })
  deviceVendor: string;

  @Column({ name: 'device_model' })
  deviceModel: string;

  @Column({ name: 'os_name' })
  osName: string;

  @Column({ name: 'os_version' })
  osVersion: string;

  @Column({ name: 'browser_name' })
  browserName: string;

  @Column({ name: 'browser_version' })
  browserVersion: string;

  @Column({ name: 'user_agent' })
  userAgent: string;

  @Column({ name: 'ip_address' })
  ipAddress: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  region: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  latitude: number;

  @Column({ nullable: true })
  longitude: number;
}
