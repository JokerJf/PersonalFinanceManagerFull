import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/finance.controller';
import { CreateAccountSchema, UpdateAccountSchema } from '../validators/account.validator';

const router = Router();
router.use(authenticate);

router.get('/',             ctrl.listAccounts);
router.get('/currencies',   ctrl.listAccountCurrencies);
router.post('/',            validate(CreateAccountSchema), ctrl.createAccount);
router.get('/:id',          ctrl.getAccount);
router.put('/:id',          validate(UpdateAccountSchema), ctrl.updateAccount);
router.delete('/:id',       ctrl.deleteAccount);

export default router;
