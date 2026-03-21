import { DataSource } from 'typeorm';
import { User } from '../entity/User';
import { Account } from '../entity/Account';
import { Transaction } from '../entity/Transaction';
import { Debt } from '../entity/Debt';
import { Credit } from '../entity/Credit';
import { ExchangeRate } from '../entity/ExchangeRate';
import { Notification } from '../entity/Notification';
import { BudgetPlan } from '../entity/BudgetPlan';
import { BudgetCategoryLimit } from '../entity/BudgetCategoryLimit';
import { BudgetIncomePlanItem } from '../entity/BudgetIncomePlanItem';
import { FamilyRequest } from '../entity/FamilyRequest';
import { FamilyGroup } from '../entity/FamilyGroup';
import { Session } from '../entity/Session';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'pfm',
  synchronize: true,
  logging: false,
  entities: [
    User,
    Account,
    Transaction,
    Debt,
    Credit,
    ExchangeRate,
    Notification,
    BudgetPlan,
    BudgetCategoryLimit,
    BudgetIncomePlanItem,
    FamilyRequest,
    FamilyGroup,
    Session,
  ],
  migrations: ['src/migration/*.ts'],
  subscribers: [],
});
