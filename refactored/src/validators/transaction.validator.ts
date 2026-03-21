import { z } from 'zod';

const WorkspaceSchema = z.enum(['personal', 'family']).default('personal');
const TransactionTypeSchema = z.enum(['INCOME', 'EXPENSE', 'TRANSFER']);

export const CreateTransactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().max(255).optional(),
  date: z.string().datetime({ offset: true }).or(z.string().date()),
  type: TransactionTypeSchema,
  category: z.string().max(100).optional(),
  accountId: z.union([z.number().int(), z.string().regex(/^\d+$/).transform(Number)]),
  toAccountId: z
    .union([z.number().int(), z.string().regex(/^\d+$/).transform(Number)])
    .optional(),
  currency: z.string().length(3).optional(),
  toCurrency: z.string().length(3).optional(),
  toAmount: z.number().positive().optional(),
  accountName: z.string().optional(),
  toAccountName: z.string().optional(),
  icon: z.string().optional(),
  note: z.string().max(500).optional(),
  workspace: WorkspaceSchema,
});

export const UpdateTransactionSchema = CreateTransactionSchema.omit({ workspace: true }).partial().extend({
  amount: z.number().positive('Amount must be positive'),
  date: z.string(),
  type: TransactionTypeSchema,
  accountId: z.union([z.number().int(), z.string().regex(/^\d+$/).transform(Number)]),
});

export const TransactionQuerySchema = z.object({
  workspace: WorkspaceSchema,
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  type: TransactionTypeSchema.optional(),
  accountId: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export type CreateTransactionDto = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionDto = z.infer<typeof UpdateTransactionSchema>;
