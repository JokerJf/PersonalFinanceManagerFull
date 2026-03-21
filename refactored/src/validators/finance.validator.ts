import { z } from 'zod';

// ─── Budget ───────────────────────────────────────────────────────────────────

const CategoryLimitSchema = z.object({
  category: z.string().min(1),
  limitAmount: z.number().min(0),
});

const IncomePlanItemSchema = z.object({
  category: z.string().min(1),
  plannedAmount: z.number().min(0),
});

export const CreateBudgetSchema = z.object({
  monthKey: z.string().regex(/^\d{4}-\d{2}$/, 'monthKey must be YYYY-MM'),
  accountId: z.union([z.number().int(), z.string()]).optional().nullable(),
  totalIncomePlan: z.number().min(0).default(0),
  totalExpensePlan: z.number().min(0).default(0),
  categoryLimits: z.array(CategoryLimitSchema).optional(),
  incomePlanItems: z.array(IncomePlanItemSchema).optional(),
});

export const UpdateBudgetSchema = CreateBudgetSchema.partial();

export const CategoryLimitBodySchema = z.object({
  category: z.string().min(1, 'Category is required'),
  limitAmount: z.number().min(0, 'Limit amount must be non-negative'),
});

export const BudgetQuerySchema = z.object({
  accountId: z.string().optional(),
});

export const BudgetByMonthQuerySchema = z.object({
  monthKey: z.string().regex(/^\d{4}-\d{2}$/, 'monthKey must be YYYY-MM'),
  accountId: z.string().optional(),
});

export type CreateBudgetDto = z.infer<typeof CreateBudgetSchema>;
export type UpdateBudgetDto = z.infer<typeof UpdateBudgetSchema>;

// ─── Debt ─────────────────────────────────────────────────────────────────────

const WorkspaceSchema = z.enum(['personal', 'family']).default('personal');

export const CreateDebtSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  amount: z.number().positive('Amount must be positive'),
  creditor: z.string().max(100).optional(),
  dueDate: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
  notes: z.string().max(500).optional(),
  currency: z.string().length(3).default('USD'),
  type: z.enum(['owe', 'owed']).default('owe'),
  status: z.enum(['open', 'closed']).default('open'),
  date: z.string().optional(),
  workspace: WorkspaceSchema,
});

export const UpdateDebtSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  amount: z.number().positive().optional(),
  creditor: z.string().max(100).optional(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().max(500).optional(),
  currency: z.string().length(3).optional(),
  type: z.enum(['owe', 'owed']).optional(),
  status: z.enum(['open', 'closed']).optional(),
  date: z.string().optional(),
  paidAmount: z.number().min(0).optional(),
});

export const DebtQuerySchema = z.object({
  workspace: WorkspaceSchema,
});

export type CreateDebtDto = z.infer<typeof CreateDebtSchema>;
export type UpdateDebtDto = z.infer<typeof UpdateDebtSchema>;

// ─── Credit ───────────────────────────────────────────────────────────────────

export const CreateCreditSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  totalAmount: z.number().positive('Total amount must be positive'),
  currency: z.string().length(3).default('USD'),
  kind: z.enum(['credit', 'installment']).default('credit'),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  months: z.number().int().min(1).default(1),
  paidAmount: z.number().min(0).default(0),
  paidInstallments: z.number().int().min(0).default(0),
  status: z.enum(['active', 'closed']).default('active'),
  notes: z.string().max(500).optional(),
});

export const UpdateCreditSchema = CreateCreditSchema.partial();

export type CreateCreditDto = z.infer<typeof CreateCreditSchema>;
export type UpdateCreditDto = z.infer<typeof UpdateCreditSchema>;
