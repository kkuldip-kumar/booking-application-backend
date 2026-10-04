import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CinemaImageType } from '../../../common/enums/cinema.enums';
import { Cinema } from './cinema.entity';

@Entity('cinema_images')
export class CinemaImage {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Index() @Column({ name: 'cinema_id', type: 'uuid' }) cinemaId!: string;
  @ManyToOne(() => Cinema, (cinema) => cinema.images, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'cinema_id' }) cinema!: Cinema;
  @Column({ type: 'varchar', length: 500 }) url!: string;
  @Column({ type: 'enum', enum: CinemaImageType, enumName: 'cinema_image_type', default: CinemaImageType.GALLERY }) type!: CinemaImageType;
  @Column({ name: 'sort_order', type: 'int', default: 0 }) sortOrder!: number;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
