import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('seat_types')
export class SeatType {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'varchar', length: 30, unique: true }) code!: string;
  @Column({ type: 'varchar', length: 100 }) name!: string;
  // Basis points: 10000 = 1.0x of the showtime base price.
  @Column({ name: 'price_multiplier_bps', type: 'int', default: 10000 }) priceMultiplierBps!: number;
  @Column({ name: 'is_active', type: 'boolean', default: true }) isActive!: boolean;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
