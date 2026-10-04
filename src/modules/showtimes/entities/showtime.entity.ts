import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ShowFormat, ShowtimeStatus } from '../../../common/enums/cinema.enums';
import { Movie } from '../../movies/entities/movie.entity';
import { Screen } from '../../screens/entities/screen.entity';
import { SeatLayout } from '../../seat-layouts/entities/seat-layout.entity';

@Entity('showtimes')
@Index('idx_showtimes_movie_start', ['movieId', 'startAt'])
@Index('idx_showtimes_screen_start', ['screenId', 'startAt'])
export class Showtime {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'movie_id', type: 'uuid' }) movieId!: string;
  @ManyToOne(() => Movie, { onDelete: 'RESTRICT', nullable: false }) @JoinColumn({ name: 'movie_id' }) movie!: Movie;
  @Column({ name: 'screen_id', type: 'uuid' }) screenId!: string;
  @ManyToOne(() => Screen, { onDelete: 'RESTRICT', nullable: false }) @JoinColumn({ name: 'screen_id' }) screen!: Screen;
  // Pinned so later layout changes never alter an existing session's seat inventory.
  @Column({ name: 'seat_layout_id', type: 'uuid' }) seatLayoutId!: string;
  @ManyToOne(() => SeatLayout, { onDelete: 'RESTRICT', nullable: false }) @JoinColumn({ name: 'seat_layout_id' }) seatLayout!: SeatLayout;
  @Column({ type: 'enum', enum: ShowFormat, enumName: 'show_format' }) format!: ShowFormat;
  @Column({ name: 'language_code', type: 'varchar', length: 10 }) languageCode!: string;
  @Column({ name: 'subtitle_language_code', type: 'varchar', length: 10, nullable: true }) subtitleLanguageCode!: string | null;
  @Column({ name: 'start_at', type: 'timestamptz' }) startAt!: Date;
  @Column({ name: 'end_at', type: 'timestamptz' }) endAt!: Date;
  @Column({ name: 'base_price', type: 'int' }) basePrice!: number;
  @Column({ name: 'booking_opens_at', type: 'timestamptz', nullable: true }) bookingOpensAt!: Date | null;
  @Column({ name: 'booking_cutoff_minutes', type: 'int' }) bookingCutoffMinutes!: number;
  @Column({ type: 'enum', enum: ShowtimeStatus, enumName: 'showtime_status', default: ShowtimeStatus.SCHEDULED }) status!: ShowtimeStatus;
  @Column({ name: 'status_reason', type: 'varchar', length: 255, nullable: true }) statusReason!: string | null;
  @Column({ name: 'created_by', type: 'uuid' }) createdBy!: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
