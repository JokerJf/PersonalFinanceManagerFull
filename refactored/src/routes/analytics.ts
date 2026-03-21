import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as ctrl from '../controllers/finance.controller';

const router = Router();
router.use(authenticate);

router.get('/summary',          ctrl.getAnalyticsSummary);
router.get('/by-category',      ctrl.getAnalyticsByCategory);
router.get('/accounts-summary', ctrl.getAccountsSummary);

export default router;
