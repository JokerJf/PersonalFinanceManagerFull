import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

@Entity('credits')
export class Credit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 19, scale: 2 })
  totalAmount: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ default: 'credit' })
  kind: string; // 'credit' or 'installment'

  @Column({ type: 'date', nullable: true })
  startDate: Date | null;

  @Column({ type: 'date', nullable: true })
  endDate: Date | null;

  @Column({ default: 1 })
  months: number;

  @Column({ type: 'decimal', precision: 19, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ default: 0 })
  paidInstallments: number;

  @Column({ default: 'active' })
  status: string; // 'active' or 'closed'

  @Column({ nullable: true })
  notes: string;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.credits)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
