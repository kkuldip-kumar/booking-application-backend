import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ScreenStatus, ShowFormat } from '../../../common/enums/cinema.enums';
import { Cinema } from '../../cinemas/entities/cinema.entity';

@Entity('screens')
@Index('uq_screens_cinema_number', ['cinemaId', 'screenNumber'], { unique: true })
export class Screen {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'cinema_id', type: 'uuid' }) cinemaId!: string;
  @ManyToOne(() => Cinema, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'cinema_id' }) cinema!: Cinema;
  @Column({ type: 'varchar', length: 100 }) name!: string;
  @Column({ name: 'screen_number', type: 'int' }) screenNumber!: number;
  // Derived from the active seat layout; never client-controlled.
  @Column({ type: 'int', default: 0 }) capacity!: number;
  @Column({ name: 'supported_formats', type: 'enum', enum: ShowFormat, enumName: 'show_format', array: true, default: () => "'{}'" })
  supportedFormats!: ShowFormat[];
  @Column({ type: 'enum', enum: ScreenStatus, enumName: 'screen_status', default: ScreenStatus.ACTIVE }) status!: ScreenStatus;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
