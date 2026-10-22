import { CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Offer } from './offer.entity';

@Entity('offer_movies')
export class OfferMovie {
  @PrimaryColumn({ name: 'offer_id', type: 'uuid' }) offerId!: string;
  @Index() @PrimaryColumn({ name: 'movie_id', type: 'uuid' }) movieId!: string;
  @ManyToOne(() => Offer, (offer) => offer.movies, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'offer_id' }) offer!: Offer;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
}
