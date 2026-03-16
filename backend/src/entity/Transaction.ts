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
import { Account } from './Account';
import { FamilyGroup } from './FamilyGroup';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 19, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'timestamp' })
  date: Date;

  @Column({ type: 'varchar' })
  type: TransactionType;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  currency: string;

  @Column({ nullable: true })
  accountName: string;

  @Column({ nullable: true })
  toAccountId: number;

  @Column({ nullable: true })
  toAccountName: string;

  @Column({ nullable: true })
  toCurrency: string;

  @Column({ type: 'decimal', precision: 19, scale: 2, nullable: true })
  toAmount: number;

  @Column({ nullable: true })
  icon: string;

  @Column({ nullable: true })
  note: string;

  @Column()
  accountId: number;

  @Column()
  userId: number;

  // ID семейной группы (для Family workspace)
  @Column({ nullable: true })
  familyGroupId: number | null;

  @ManyToOne(() => Account, (account) => account.transactions)
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @ManyToOne(() => User, (user) => user.transactions)
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
