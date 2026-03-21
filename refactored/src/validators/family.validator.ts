import { z } from 'zod';

export const CreateGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100),
});

export const JoinGroupSchema = z.object({
  inviteCode: z.string().min(1, 'Invite code is required'),
});

export const InviteByEmailSchema = z.object({
  email: z.string().email('Invalid email'),
});

export const RequestIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

export const MemberIdParamSchema = z.object({
  memberId: z.string().regex(/^\d+$/).transform(Number),
});

export const TransferLeadershipParamSchema = z.object({
  newLeaderId: z.string().regex(/^\d+$/).transform(Number),
});
