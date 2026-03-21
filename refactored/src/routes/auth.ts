import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiter';
import * as ctrl from '../controllers/auth.controller';
import {
  RegisterSchema, LoginSchema, RefreshTokenSchema,
  ChangePasswordSchema, UpdateProfileSchema,
  VerifyPasswordSchema, LogoutSessionSchema,
} from '../validators/auth.validator';

const router = Router();

// Public — rate limited
router.post('/register', authLimiter, validate(RegisterSchema), ctrl.register);
router.post('/login',    authLimiter, validate(LoginSchema),    ctrl.login);
router.post('/refresh',  authLimiter, validate(RefreshTokenSchema), ctrl.refresh);

// Protected
router.use(authenticate);
router.post('/logout',              ctrl.logout);
router.post('/logout-session',      validate(LogoutSessionSchema), ctrl.logoutSession);
router.get('/sessions',             ctrl.listSessions);
router.post('/revoke-all-sessions', ctrl.revokeAllSessions);
router.post('/verify-password',     validate(VerifyPasswordSchema), ctrl.verifyPassword);
router.post('/change-password',     validate(ChangePasswordSchema), ctrl.changePassword);
router.put('/profile',              validate(UpdateProfileSchema),  ctrl.updateProfile);

export default router;
