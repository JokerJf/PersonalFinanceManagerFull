import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/family.controller';
import {
  CreateGroupSchema,
  JoinGroupSchema,
  InviteByEmailSchema,
  RequestIdParamSchema,
  MemberIdParamSchema,
  TransferLeadershipParamSchema,
} from '../validators/family.validator';

const router = Router();
router.use(authenticate);

// Group management
router.post('/create-group',         validate(CreateGroupSchema),              ctrl.createGroup);
router.post('/join-group',           validate(JoinGroupSchema),                ctrl.joinGroup);
router.get('/status',                                                           ctrl.getGroupStatus);
router.post('/leave',                                                           ctrl.leaveGroup);
router.post('/invite-by-email',      validate(InviteByEmailSchema),            ctrl.inviteByEmail);

// Incoming requests (leader only)
router.get('/incoming-requests',                                                ctrl.getIncomingRequests);

// Request actions
router.put('/requests/:id/accept',   validate(RequestIdParamSchema, 'params'), ctrl.acceptRequest);
router.put('/requests/:id/decline',  validate(RequestIdParamSchema, 'params'), ctrl.declineRequest);
router.delete('/requests/:id/cancel',validate(RequestIdParamSchema, 'params'), ctrl.cancelRequest);

// Member management
router.delete('/members/:memberId',  validate(MemberIdParamSchema, 'params'),  ctrl.removeMember);
router.put('/transfer-leadership/:newLeaderId', validate(TransferLeadershipParamSchema, 'params'), ctrl.transferLeadership);

export default router;
