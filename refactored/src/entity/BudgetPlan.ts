import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Unique,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { BudgetCategoryLimit } from './BudgetCategoryLimit';
import { BudgetIncomePlanItem } from './BudgetIncomePlanItem';

@Entity('budget_plans')
@Unique(['userId', 'monthKey', 'accountId'])
export class BudgetPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  monthKey: string;

  @Column({ nullable: true })
  accountId: string;

  @Column({ type: 'decimal', precision: 19, scale: 2, default: 0 })
  totalIncomePlan: number;

  @Column({ type: 'decimal', precision: 19, scale: 2, default: 0 })
  totalExpensePlan: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.budgetPlans)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => BudgetCategoryLimit, (limit) => limit.budgetPlan)
  categoryLimits: BudgetCategoryLimit[];

  @OneToMany(() => BudgetIncomePlanItem, (item) => item.budgetPlan)
  incomePlanItems: BudgetIncomePlanItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
