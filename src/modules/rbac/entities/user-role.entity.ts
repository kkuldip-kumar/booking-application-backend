import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from './role.entity';

/** cinema_id NULL = platform-wide assignment; set = scoped to one cinema. */
@Entity('user_roles')
export class UserRole {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'user_id', type: 'uuid' }) userId!: string;
  @Column({ name: 'role_id', type: 'uuid' }) roleId!: string;
  @Column({ name: 'cinema_id', type: 'uuid', nullable: true }) cinemaId!: string | null;

  @ManyToOne(() => Role, { onDelete: 'RESTRICT', eager: false })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
}
