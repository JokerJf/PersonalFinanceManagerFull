import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as FamilyService from '../services/family.service';

export async function createGroup(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await FamilyService.createGroup(req.userId!, req.body.name);
    res.json({ success: true, data, message: 'Family group created successfully' });
  } catch (e) { next(e); }
}

export async function joinGroup(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await FamilyService.joinGroup(req.userId!, req.body.inviteCode);
    res.json({ success: true, data, message: 'Join request sent successfully' });
  } catch (e) { next(e); }
}

export async function getGroupStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await FamilyService.getGroupStatus(req.userId!);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function getIncomingRequests(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await FamilyService.getIncomingRequests(req.userId!);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function acceptRequest(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await FamilyService.acceptRequest(parseInt(req.params.id), req.userId!);
    res.json({ success: true, message: 'Request accepted' });
  } catch (e) { next(e); }
}

export async function declineRequest(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await FamilyService.declineRequest(parseInt(req.params.id), req.userId!);
    res.json({ success: true, message: 'Request declined' });
  } catch (e) { next(e); }
}

export async function removeMember(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await FamilyService.removeMember(req.userId!, parseInt(req.params.memberId));
    res.json({ success: true, message: 'Member removed successfully' });
  } catch (e) { next(e); }
}

export async function transferLeadership(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await FamilyService.transferLeadership(req.userId!, parseInt(req.params.newLeaderId));
    res.json({ success: true, message: 'Leadership transferred successfully' });
  } catch (e) { next(e); }
}

export async function leaveGroup(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const message = await FamilyService.leaveGroup(req.userId!);
    res.json({ success: true, message });
  } catch (e) { next(e); }
}

export async function inviteByEmail(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await FamilyService.inviteByEmail(req.userId!, req.body.email);
    res.json({ success: true, data, message: 'Invitation sent successfully' });
  } catch (e) { next(e); }
}

export async function cancelRequest(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await FamilyService.cancelRequest(parseInt(req.params.id), req.userId!);
    res.json({ success: true, message: 'Request cancelled' });
  } catch (e) { next(e); }
}
