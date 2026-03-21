import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/finance.controller';
import { CreateCreditSchema, UpdateCreditSchema } from '../validators/finance.validator';

const router = Router();
router.use(authenticate);

router.get('/',       ctrl.listCredits);
router.post('/',      validate(CreateCreditSchema),  ctrl.createCredit);
router.put('/:id',    validate(UpdateCreditSchema),  ctrl.updateCredit);
router.delete('/:id',                                ctrl.deleteCredit);

export default router;
