import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CardNetwork, PaymentMethod } from '../../../common/enums/offer.enums';
import { Offer } from './offer.entity';

// card_bins holds issuer BIN prefixes only (6-8 digits). Full card numbers are never stored or accepted.
@Entity('offer_payment_rules')
export class OfferPaymentRule {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Index() @Column({ name: 'offer_id', type: 'uuid' }) offerId!: string;
  @ManyToOne(() => Offer, (offer) => offer.paymentRules, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'offer_id' }) offer!: Offer;
  @Column({ type: 'enum', enum: PaymentMethod, enumName: 'payment_method', nullable: true }) method!: PaymentMethod | null;
  @Column({ name: 'bank_code', type: 'varchar', length: 20, nullable: true }) bankCode!: string | null;
  @Column({ name: 'card_network', type: 'enum', enum: CardNetwork, enumName: 'card_network', nullable: true }) cardNetwork!: CardNetwork | null;
  @Column({ name: 'card_bins', type: 'text', array: true, default: () => "'{}'" }) cardBins!: string[];
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
