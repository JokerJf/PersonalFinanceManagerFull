import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/finance.controller';
import { CreateTransactionSchema, UpdateTransactionSchema, TransactionQuerySchema } from '../validators/transaction.validator';

const router = Router();
router.use(authenticate);

router.get('/',      validate(TransactionQuerySchema, 'query'), ctrl.listTransactions);
router.post('/',     validate(CreateTransactionSchema),         ctrl.createTransaction);
router.put('/:id',   validate(UpdateTransactionSchema),         ctrl.updateTransaction);
router.delete('/:id',                                           ctrl.deleteTransaction);

export default router;
