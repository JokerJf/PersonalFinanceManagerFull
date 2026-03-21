import { z } from 'zod';

const WorkspaceSchema = z.enum(['personal', 'family']).default('personal');

export const CreateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  balance: z.number().default(0),
  type: z.string().default('CASH'),
  cardNumber: z.string().optional(),
  cardNumberFull: z.string().optional(),
  expiryDate: z.string().optional(),
  cardNetwork: z.string().optional(),
  colorStyle: z.number().int().min(1).default(1),
  currency: z.string().length(3, 'Currency must be 3 characters').default('UZS'),
  includedInBalance: z.boolean().default(true),
  workspace: WorkspaceSchema,
});

export const UpdateAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  balance: z.number().optional(),
  type: z.string().optional(),
  cardNumber: z.string().optional(),
  cardNumberFull: z.string().optional(),
  expiryDate: z.string().optional(),
  cardNetwork: z.string().optional(),
  colorStyle: z.number().int().min(1).optional(),
  currency: z.string().length(3).optional(),
  includedInBalance: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const AccountQuerySchema = z.object({
  workspace: WorkspaceSchema,
});

export type CreateAccountDto = z.infer<typeof CreateAccountSchema>;
export type UpdateAccountDto = z.infer<typeof UpdateAccountSchema>;
