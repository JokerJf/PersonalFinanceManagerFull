import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  JoinColumn,
} from 'typeorm';
import { BudgetPlan } from './BudgetPlan';

@Entity('budget_income_plan_items')
@Unique(['budgetPlanId', 'category'])
export class BudgetIncomePlanItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  category: string;

  @Column({ type: 'decimal', precision: 19, scale: 2 })
  plannedAmount: number;

  @Column({ type: 'decimal', precision: 19, scale: 2, default: 0 })
  actualAmount: number;

  @Column()
  budgetPlanId: number;

  @ManyToOne(() => BudgetPlan, (plan) => plan.incomePlanItems)
  @JoinColumn({ name: 'budgetPlanId' })
  budgetPlan: BudgetPlan;
}
