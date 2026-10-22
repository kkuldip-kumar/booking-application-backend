import { CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Offer } from './offer.entity';

@Entity('offer_cinemas')
export class OfferCinema {
  @PrimaryColumn({ name: 'offer_id', type: 'uuid' }) offerId!: string;
  @Index() @PrimaryColumn({ name: 'cinema_id', type: 'uuid' }) cinemaId!: string;
  @ManyToOne(() => Offer, (offer) => offer.cinemas, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'offer_id' }) offer!: Offer;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
}
