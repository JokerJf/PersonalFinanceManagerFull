import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  JoinColumn,
} from 'typeorm';
import { BudgetPlan } from './BudgetPlan';

@Entity('budget_category_limits')
@Unique(['budgetPlanId', 'category'])
export class BudgetCategoryLimit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  category: string;

  @Column({ type: 'decimal', precision: 19, scale: 2 })
  limit: number;

  @Column({ type: 'decimal', precision: 19, scale: 2, default: 0 })
  spent: number;

  @Column()
  budgetPlanId: number;

  @ManyToOne(() => BudgetPlan, (plan) => plan.categoryLimits)
  @JoinColumn({ name: 'budgetPlanId' })
  budgetPlan: BudgetPlan;
}
