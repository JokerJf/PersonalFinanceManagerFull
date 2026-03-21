import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/finance.controller';
import { CreateDebtSchema, UpdateDebtSchema } from '../validators/finance.validator';

const router = Router();
router.use(authenticate);

router.get('/',       ctrl.listDebts);
router.post('/',      validate(CreateDebtSchema),  ctrl.createDebt);
router.put('/:id',    validate(UpdateDebtSchema),  ctrl.updateDebt);
router.delete('/:id',                              ctrl.deleteDebt);

export default router;
