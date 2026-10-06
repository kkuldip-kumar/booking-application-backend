// src/modules/cities/entities/city.entity.ts
import {
  Column, CreateDateColumn, Entity, Index, OneToMany,
  PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { Cinema } from '../../cinemas/entities/cinema.entity';

@Entity('cities')
export class City {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('uq_cities_name', { unique: true })
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Index('uq_cities_slug', { unique: true })
  @Column({ type: 'varchar', length: 120 })
  slug!: string;

  @Column({ type: 'varchar', length: 100 })
  state!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => Cinema, (cinema) => cinema.city)
  cinemas?: Cinema[];

  // Populated by loadRelationCountAndMap, not a column.
  cinemaCount?: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}