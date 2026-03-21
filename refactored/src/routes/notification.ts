import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as ctrl from '../controllers/finance.controller';

const router = Router();
router.use(authenticate);

router.get('/',           ctrl.listNotifications);
router.post('/',          ctrl.createNotification);
router.put('/:id/read',   ctrl.markNotificationRead);
router.delete('/:id',     ctrl.deleteNotification);

export default router;
