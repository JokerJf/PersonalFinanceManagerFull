import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { FamilyGroup } from './FamilyGroup';
import { Transaction } from './Transaction';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 19, scale: 2, default: 0 })
  balance: number;

  @Column({ default: 'CASH' })
  type: string;

  @Column({ nullable: true })
  cardNumber: string;

  @Column({ nullable: true })
  cardNumberFull: string;

  @Column({ nullable: true })
  expiryDate: string;

  @Column({ nullable: true })
  cardNetwork: string;

  @Column({ default: 1 })
  colorStyle: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  currency: string;

  @Column({ default: true })
  includedInBalance: boolean;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.accounts)
  @JoinColumn({ name: 'userId' })
  user: User;

  // ID семейной группы (для Family workspace)
  @Column({ nullable: true })
  familyGroupId: number | null;

  @ManyToOne(() => FamilyGroup, { nullable: true })
  @JoinColumn({ name: 'familyGroupId' })
  familyGroup: FamilyGroup;

  @OneToMany(() => Transaction, (transaction) => transaction.account)
  transactions: Transaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
