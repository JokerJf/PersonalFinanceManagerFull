import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as AuthService from '../services/auth.service';
import { LoginDto, RegisterDto, ChangePasswordDto, UpdateProfileDto } from '../validators/auth.validator';

function deviceInfo(req: AuthRequest): string {
  return req.headers['user-agent'] ?? 'Unknown';
}
function ipAddress(req: AuthRequest): string {
  return req.ip ?? req.socket.remoteAddress ?? 'Unknown';
}

export async function register(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await AuthService.register(req.body as RegisterDto, deviceInfo(req), ipAddress(req));
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
}

export async function login(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await AuthService.login(req.body as LoginDto, deviceInfo(req), ipAddress(req));
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function refresh(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await AuthService.refreshTokens(req.body.refreshToken);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function logout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await AuthService.logout(req.userId!);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (e) { next(e); }
}

export async function logoutSession(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await AuthService.logoutSession(req.userId!, req.body.sessionId);
    res.json({ success: true, message: 'Session terminated successfully' });
  } catch (e) { next(e); }
}

export async function listSessions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await AuthService.listSessions(req.userId!);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function revokeAllSessions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await AuthService.revokeAllSessions(req.userId!);
    res.json({ success: true, message: 'All sessions revoked successfully' });
  } catch (e) { next(e); }
}

export async function verifyPassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const isValid = await AuthService.verifyPassword(req.userId!, req.body.password);
    res.json({ success: isValid });
  } catch (e) { next(e); }
}

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await AuthService.changePassword(req.userId!, req.body as ChangePasswordDto);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (e) { next(e); }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await AuthService.updateProfile(req.userId!, req.body as UpdateProfileDto);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}
