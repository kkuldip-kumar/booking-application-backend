import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('people')
export class Person {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Index() @Column({ type: 'varchar', length: 150 }) name!: string;
  @Column({ type: 'varchar', length: 160, unique: true }) slug!: string;
  @Column({ type: 'text', nullable: true }) biography!: string | null;
  @Column({ name: 'profile_image_url', type: 'varchar', length: 500, nullable: true }) profileImageUrl!: string | null;
  @Column({ name: 'birth_date', type: 'date', nullable: true }) birthDate!: string | null;
  @Column({ name: 'is_active', type: 'boolean', default: true }) isActive!: boolean;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
