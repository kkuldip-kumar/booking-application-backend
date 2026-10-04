import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CinemaStatus } from '../../../common/enums/cinema.enums';
import { CinemaImage } from './cinema-image.entity';

@Entity('cinemas')
@Index('idx_cinemas_city_status', ['city', 'status'])
export class Cinema {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'varchar', length: 20, unique: true }) code!: string;
  @Column({ type: 'varchar', length: 150 }) name!: string;
  @Column({ name: 'address_line', type: 'varchar', length: 255 }) addressLine!: string;
  @Column({ type: 'varchar', length: 100 }) city!: string;
  @Column({ type: 'varchar', length: 100 }) state!: string;
  @Column({ type: 'varchar', length: 2 }) country!: string;
  @Column({ name: 'postal_code', type: 'varchar', length: 12 }) postalCode!: string;
  @Column({ type: 'double precision', nullable: true }) latitude!: number | null;
  @Column({ type: 'double precision', nullable: true }) longitude!: number | null;
  @Column({ type: 'varchar', length: 64 }) timezone!: string;
  @Column({ type: 'varchar', length: 20, nullable: true }) phone!: string | null;
  @Column({ type: 'varchar', length: 255, nullable: true }) email!: string | null;
  @Column({ name: 'opening_time', type: 'time' }) openingTime!: string;
  @Column({ name: 'closing_time', type: 'time' }) closingTime!: string;
  @Column({ type: 'text', array: true, default: () => "'{}'" }) facilities!: string[];
  @Column({ type: 'enum', enum: CinemaStatus, enumName: 'cinema_status', default: CinemaStatus.ACTIVE }) status!: CinemaStatus;
  @OneToMany(() => CinemaImage, (image) => image.cinema) images?: CinemaImage[];
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
