import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserStatus } from '../../../common/enums/user-status.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'varchar', length: 255, unique: true }) email!: string;
  @Column({ name: 'password_hash', type: 'varchar', length: 255 }) passwordHash!: string;
  @Column({ type: 'varchar', length: 120 }) name!: string;
  @Column({ type: 'varchar', length: 20, nullable: true }) phone!: string | null;
  @Column({ type: 'varchar', length: 30, default: UserStatus.PENDING_VERIFICATION }) status!: UserStatus;
  @Column({ name: 'email_verified_at', type: 'timestamptz', nullable: true }) emailVerifiedAt!: Date | null;
  @Column({ name: 'failed_login_attempts', type: 'int', default: 0 }) failedLoginAttempts!: number;
  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true }) lockedUntil!: Date | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
