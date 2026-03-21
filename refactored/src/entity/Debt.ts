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
import { FamilyGroup } from './FamilyGroup';

@Entity('debts')
export class Debt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 19, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 19, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ nullable: true })
  creditor: string;

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date | null;

  @Column({ default: false })
  isPaid: boolean;

  @Column({ nullable: true })
  notes: string;

  @Column()
  userId: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ default: 'owe' })
  type: 'owe' | 'owed';

  @Column({ default: 'open' })
  status: 'open' | 'closed';

  @Column({ type: 'timestamp', nullable: true })
  date: Date;

  // ID семейной группы (для Family workspace)
  @Column({ nullable: true })
  familyGroupId: number | null;

  @ManyToOne(() => User, (user) => user.debts)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => FamilyGroup, { nullable: true })
  @JoinColumn({ name: 'familyGroupId' })
  familyGroup: FamilyGroup;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
