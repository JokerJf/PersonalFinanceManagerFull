import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Account } from './Account';
import { Transaction } from './Transaction';
import { BudgetPlan } from './BudgetPlan';
import { Notification } from './Notification';
import { Debt } from './Debt';
import { Credit } from './Credit';
import { FamilyGroup } from './FamilyGroup';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: false })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true, default: null })
  familyGroupId: number | null;

  @ManyToOne(() => FamilyGroup, (familyGroup) => familyGroup.members, { nullable: true })
  @JoinColumn({ name: 'familyGroupId' })
  familyGroup: FamilyGroup;

  @OneToMany(() => Account, (account) => account.user)
  accounts: Account[];

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  @OneToMany(() => BudgetPlan, (budgetPlan) => budgetPlan.user)
  budgetPlans: BudgetPlan[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => Debt, (debt) => debt.user)
  debts: Debt[];

  @OneToMany(() => Credit, (credit) => credit.user)
  credits: Credit[];
}
