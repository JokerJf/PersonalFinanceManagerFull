import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as ctrl from '../controllers/finance.controller';
import {
  CreateBudgetSchema, UpdateBudgetSchema,
  CategoryLimitBodySchema, BudgetByMonthQuerySchema,
} from '../validators/finance.validator';

const router = Router();
router.use(authenticate);

router.get('/',                                    ctrl.listBudgets);
router.get('/by-month', validate(BudgetByMonthQuerySchema, 'query'), ctrl.getBudgetByMonth);
router.get('/summary/:monthKey',                   ctrl.getBudgetSummary);
router.post('/',  validate(CreateBudgetSchema),    ctrl.createBudget);
router.put('/:id', validate(UpdateBudgetSchema),   ctrl.updateBudget);
router.delete('/:id',                              ctrl.deleteBudget);
router.post('/:id/category-limits',   validate(CategoryLimitBodySchema), ctrl.upsertCategoryLimit);
router.put('/:id/category-limits/:category',  validate(CategoryLimitBodySchema), ctrl.upsertCategoryLimit);
router.delete('/:id/category-limits/:category',    ctrl.deleteCategoryLimit);

export default router;
