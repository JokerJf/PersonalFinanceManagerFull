import { 
  Account, 
  Transaction, 
  Debt, 
  Credit,
  Notification, 
  FamilyMember,
  ExchangeRate
} from '../context/AppContext';
import { 
  mockAccounts, 
  mockTransactions, 
  mockDebts, 
  mockNotifications, 
  mockFamilyMembers, 
  mockExchangeRates 
} from './mockData';
import { 
  getApiBaseUrl, 
  shouldUseMockData, 
  getMockDelay 
} from '../lib/env';

// Тип ответа API
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Имитация задержки для реальности
const delay = (ms: number = 1000) => new Promise(resolve => setTimeout(resolve, ms));

// Тип для настроек API
export interface ApiConfig {
  baseUrl: string;
  useMockData: boolean;
  mockDelay: number;
}

// Инициализация конфигурации из env переменных
let apiConfig: ApiConfig = {
  baseUrl: getApiBaseUrl(),
  useMockData: shouldUseMockData(),
  mockDelay: getMockDelay()
};

// Функция для изменения настроек API
export const setApiConfig = (config: Partial<ApiConfig>) => {
  apiConfig = { ...apiConfig, ...config };
};

// Функция для получения настроек API
export const getApiConfig = () => apiConfig;

// Базовый fetch для реального API
const fetchFromApi = async <T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> => {
  const url = `${apiConfig.baseUrl}${endpoint}`;
  
  // Получаем токен из localStorage
  const token = localStorage.getItem('auth_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Добавляем Authorization заголовок если есть токен
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  const json = await response.json();
  
  // Если ответ содержит { success, data }, извлекаем data
  if (json && typeof json === 'object' && 'data' in json) {
    return json.data as T;
  }
  
  return json as T;
};

// Базовая функция для имитации запросов
const fetchData = async <T>(getData: () => T, delayMs?: number): Promise<T> => {
  await delay(delayMs ?? apiConfig.mockDelay);
  return Promise.resolve(getData());
};

// Функция для имитации ошибок
const fetchError = async (message: string, delayMs?: number): Promise<never> => {
  await delay(delayMs ?? apiConfig.mockDelay);
  return Promise.reject(new Error(message));
};

// API для счетов
export const accountsApi = {
  // Получить все счета
  async getAllAccounts(workspace: string = 'personal'): Promise<Account[]> {
    if (!apiConfig.useMockData) {
      const data = await fetchFromApi<Account[]>(`/accounts?workspace=${workspace}`);
      // Конвертируем числовые ID в строки для совместимости с фронтендом
      return data.map(account => ({
        ...account,
        id: String(account.id)
      }));
    }
    return fetchData(() => mockAccounts);
  },

  // Получить уникальные валюты из счетов
  async getCurrencies(workspace: string = 'personal'): Promise<string[]> {
    if (!apiConfig.useMockData) {
      const data = await fetchFromApi<any>(`/accounts/currencies?workspace=${workspace}`);
      return data;
    }
    // Mock данные
    return fetchData(() => ['USD', 'UZS', 'EUR', 'RUB', 'GBP']);
  },

  // Получить счет по ID
  async getAccountById(id: string, workspace: string = 'personal'): Promise<Account | undefined> {
    if (!apiConfig.useMockData) {
      const account = await fetchFromApi<Account | null>(`/accounts/${id}?workspace=${workspace}`);
      return account ?? undefined;
    }
    return fetchData(() => mockAccounts.find(account => account.id === id));
  },

  // Создать новый счет
  async createAccount(account: Omit<Account, 'id'>, workspace: string = 'personal'): Promise<Account> {
    if (!apiConfig.useMockData) {
      return fetchFromApi<Account>('/accounts', {
        method: 'POST',
        body: JSON.stringify({ ...account, workspace }),
      });
    }
    const newAccount: Account = {
      ...account,
      id: Date.now().toString(),
    };
    return fetchData(() => newAccount);
  },

  // Обновить счет
  async updateAccount(id: string, updates: Partial<Account>, workspace: string = 'personal'): Promise<Account> {
    if (!apiConfig.useMockData) {
      return fetchFromApi<Account>(`/accounts/${id}?workspace=${workspace}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    }
    const updatedAccount: Account = {
      ...(mockAccounts.find(account => account.id === id) as Account),
      ...updates
    };
    return fetchData(() => updatedAccount);
  },

  // Удалить счет
  async deleteAccount(id: string, workspace: string = 'personal'): Promise<void> {
    if (!apiConfig.useMockData) {
      return fetchFromApi<void>(`/accounts/${id}?workspace=${workspace}`, {
        method: 'DELETE',
      });
    }
    return fetchData(() => undefined);
  }
};

// API для транзакций
export const transactionsApi = {
  // Получить все транзакции
  async getAllTransactions(workspace: string = 'personal'): Promise<Transaction[]> {
    if (!apiConfig.useMockData) {
      const data = await fetchFromApi<Transaction[]>(`/transactions?workspace=${workspace}`);
      // Конвертируем числовые ID в строки и типы в нижний регистр
      return data.map(tx => ({
        ...tx,
        id: String(tx.id),
        type: (tx.type as string).toLowerCase() as Transaction['type'],
        accountId: String(tx.accountId),
        toAccountId: tx.toAccountId ? String(tx.toAccountId) : undefined
      }));
    }
    return fetchData(() => mockTransactions);
  },

  // Получить транзакции по счету
  async getTransactionsByAccount(accountId: string, workspace: string = 'personal'): Promise<Transaction[]> {
    if (!apiConfig.useMockData) {
      return fetchFromApi<Transaction[]>(`/transactions?accountId=${accountId}&workspace=${workspace}`);
    }
    return fetchData(() => mockTransactions.filter(transaction => 
      transaction.accountId === accountId
    ));
  },

  // Создать новую транзакцию
  async createTransaction(transaction: Omit<Transaction, 'id'>, workspace: string = 'personal'): Promise<Transaction> {
    if (!apiConfig.useMockData) {
      return fetchFromApi<Transaction>('/transactions', {
        method: 'POST',
        body: JSON.stringify({ ...transaction, workspace }),
      });
    }
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString()
    };
    return fetchData(() => newTransaction);
  },

  // Обновить транзакцию
  async updateTransaction(id: string, updates: Partial<Transaction>, workspace: string = 'personal'): Promise<Transaction> {
    if (!apiConfig.useMockData) {
      return fetchFromApi<Transaction>(`/transactions/${id}?workspace=${workspace}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    }
    const updatedTransaction: Transaction = {
      ...(mockTransactions.find(transaction => transaction.id === id) as Transaction),
      ...updates
    };
    return fetchData(() => updatedTransaction);
  },

  // Удалить транзакцию
  async deleteTransaction(id: string, workspace: string = 'personal'): Promise<void> {
    if (!apiConfig.useMockData) {
      return fetchFromApi<void>(`/transactions/${id}?workspace=${workspace}`, {
        method: 'DELETE',
      });
    }
    return fetchData(() => undefined);
  }
};

// API для долгов
const getLocalDateString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localDate = new Date(now.getTime() - offset);
  return localDate.toISOString().split("T")[0];
};

export const debtsApi = {
  // Получить все долги
  async getAllDebts(workspace: string = 'personal'): Promise<Debt[]> {
    if (!apiConfig.useMockData) {
      const data = await fetchFromApi<any[]>(`/debts?workspace=${workspace}`);
      // Конвертируем числовые ID в строки и маппим поля из бэкенда
      // Используем локальную дату
      const getLocalDateString = () => {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localDate = new Date(now.getTime() - offset);
        return localDate.toISOString().split("T")[0];
      };
      return data.map(debt => ({
        id: String(debt.id),
        name: debt.name,
        amount: Number(debt.amount) || 0,
        currency: debt.currency || 'USD',
        type: debt.type || 'owe',
        status: debt.status || 'open',
        date: debt.date ? new Date(debt.date).toISOString().split('T')[0] : getLocalDateString(),
        description: debt.notes || debt.description || undefined,
      }));
    }
    return fetchData(() => mockDebts);
  },

  // Создать новый долг
  async createDebt(debt: Omit<Debt, 'id'>, workspace: string = 'personal'): Promise<Debt> {
    if (!apiConfig.useMockData) {
      const data = await fetchFromApi<any>('/debts', {
        method: 'POST',
        body: JSON.stringify({ ...debt, workspace }),
      });
      // Маппим данные из бэкенда
      return {
        id: String(data.id),
        name: data.name,
        amount: Number(data.amount) || 0,
        currency: data.currency || 'USD',
        type: data.type || 'owe',
        status: data.status || 'open',
        date: data.date ? new Date(data.date).toISOString().split('T')[0] : getLocalDateString(),
        description: data.notes || data.description || undefined,
      };
    }
    const newDebt: Debt = {
      ...debt,
      id: Date.now().toString()
    };
    return fetchData(() => newDebt);
  },

  // Обновить долг
  async updateDebt(id: string, updates: Partial<Debt>, workspace: string = 'personal'): Promise<Debt> {
    if (!apiConfig.useMockData) {
      const data = await fetchFromApi<any>(`/debts/${id}?workspace=${workspace}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      // Маппим данные из бэкенда
      return {
        id: String(data.id),
        name: data.name,
        amount: Number(data.amount) || 0,
        currency: data.currency || 'USD',
        type: data.type || 'owe',
        status: data.status || 'open',
        date: data.date ? new Date(data.date).toISOString().split('T')[0] : getLocalDateString(),
        description: data.notes || data.description || undefined,
      };
    }
    const updatedDebt: Debt = {
      ...(mockDebts.find(debt => debt.id === id) as Debt),
      ...updates
    };
    return fetchData(() => updatedDebt);
  },

  // Удалить долг
  async deleteDebt(id: string, workspace: string = 'personal'): Promise<void> {
    if (!apiConfig.useMockData) {
      return fetchFromApi<void>(`/debts/${id}?workspace=${workspace}`, {
        method: 'DELETE',
      });
    }
    return fetchData(() => undefined);
  }
};

// API для кредитов
export const creditsApi = {
  // Получить все кредиты
  async getAllCredits(): Promise<Credit[]> {
    if (!apiConfig.useMockData) {
      const data = await fetchFromApi<any[]>('/credits');
      // Конвертируем числовые ID в строки и маппим поля из бэкенда
      const getLocalDateString = () => {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localDate = new Date(now.getTime() - offset);
        return localDate.toISOString().split("T")[0];
      };
      return data.map(credit => ({
        id: String(credit.id),
        title: credit.name,
        totalAmount: Number(credit.totalAmount) || 0,
        currency: credit.currency || 'USD',
        kind: credit.kind || 'credit',
        startDate: credit.startDate ? new Date(credit.startDate).toISOString().split('T')[0] : getLocalDateString(),
        endDate: credit.endDate ? new Date(credit.endDate).toISOString().split('T')[0] : '',
        months: Number(credit.months) || 1,
        paidInstallments: Number(credit.paidInstallments) || 0,
        status: credit.status || 'active',
        description: credit.notes || undefined,
      }));
    }
    // Mock данные
    return fetchData(() => [
      {
        id: "c1",
        title: "iPhone 15 Pro",
        totalAmount: 1200,
        currency: "USD",
        kind: "installment",
        startDate: "2026-03-01",
        endDate: "2026-08-01",
        months: 5,
        paidInstallments: 2,
        status: "active",
        description: "Рассрочка на телефон",
      },
    ]);
  },

  // Создать новый кредит
  async createCredit(credit: Omit<Credit, 'id'>): Promise<Credit> {
    if (!apiConfig.useMockData) {
      const data = await fetchFromApi<any>('/credits', {
        method: 'POST',
        body: JSON.stringify({
          name: credit.title,
          totalAmount: credit.totalAmount,
          currency: credit.currency,
          kind: credit.kind,
          startDate: credit.startDate,
          endDate: credit.endDate,
          months: credit.months,
          paidInstallments: credit.paidInstallments,
          status: credit.status,
          notes: credit.description,
        }),
      });
      // Маппим данные из бэкенда
      return {
        id: String(data.id),
        title: data.name,
        totalAmount: Number(data.totalAmount) || 0,
        currency: data.currency || 'USD',
        kind: data.kind || 'credit',
        startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '',
        endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : '',
        months: Number(data.months) || 1,
        paidInstallments: Number(data.paidInstallments) || 0,
        status: data.status || 'active',
        description: data.notes || undefined,
      };
    }
    const newCredit: Credit = {
      ...credit,
      id: Date.now().toString()
    };
    return fetchData(() => newCredit);
  },

  // Обновить кредит
  async updateCredit(id: string, updates: Partial<Credit>): Promise<Credit> {
    if (!apiConfig.useMockData) {
      const data = await fetchFromApi<any>(`/credits/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: updates.title,
          totalAmount: updates.totalAmount,
          currency: updates.currency,
          kind: updates.kind,
          startDate: updates.startDate,
          endDate: updates.endDate,
          months: updates.months,
          paidInstallments: updates.paidInstallments,
          status: updates.status,
          notes: updates.description,
        }),
      });
      // Маппим данные из бэкенда
      return {
        id: String(data.id),
        title: data.name,
        totalAmount: Number(data.totalAmount) || 0,
        currency: data.currency || 'USD',
        kind: data.kind || 'credit',
        startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '',
        endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : '',
        months: Number(data.months) || 1,
        paidInstallments: Number(data.paidInstallments) || 0,
        status: data.status || 'active',
        description: data.notes || undefined,
      };
    }
    const updatedCredit: Credit = {
      ...(await creditsApi.getAllCredits()).find(credit => credit.id === id) as Credit,
      ...updates
    };
    return fetchData(() => updatedCredit);
  },

  // Удалить кредит
  async deleteCredit(id: string): Promise<void> {
    if (!apiConfig.useMockData) {
      return fetchFromApi<void>(`/credits/${id}`, {
        method: 'DELETE',
      });
    }
    return fetchData(() => undefined);
  }
};

// API для уведомлений
export const notificationsApi = {
  // Получить все уведомления
  async getAllNotifications(): Promise<Notification[]> {
    if (!apiConfig.useMockData) {
      const data = await fetchFromApi<any[]>('/notifications');
      return data.map(n => ({
        id: String(n.id),
        title: n.title || '',
        message: n.message,
        date: n.createdAt ? new Date(n.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        read: n.isRead || false,
        type: n.type || 'info',
        relatedRequestId: n.relatedRequestId || undefined
      }));
    }
    return fetchData(() => mockNotifications);
  },

  // Создать новое уведомление
  async createNotification(notification: Omit<Notification, 'id'>): Promise<Notification> {
    if (!apiConfig.useMockData) {
      return fetchFromApi<Notification>('/notifications', {
        method: 'POST',
        body: JSON.stringify({
          title: notification.title,
          message: notification.message,
          type: notification.type,
          isRead: notification.read
        }),
      });
    }
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString()
    };
    return fetchData(() => newNotification);
  },

  // Удалить уведомление
  async deleteNotification(id: string): Promise<void> {
    if (!apiConfig.useMockData) {
      return fetchFromApi<void>(`/notifications/${id}`, {
        method: 'DELETE',
      });
    }
    return fetchData(() => undefined);
  },

  // Отметить уведомление как прочитанное
  async markAsRead(id: string): Promise<void> {
    if (!apiConfig.useMockData) {
      return fetchFromApi<void>(`/notifications/${id}/read`, {
        method: 'PUT',
      });
    }
    return fetchData(() => undefined);
  }
};

// API для членов семьи
export const familyMembersApi = {
  // Получить всех членов семьи
  async getAllFamilyMembers(): Promise<FamilyMember[]> {
    if (!apiConfig.useMockData) {
      return fetchFromApi<FamilyMember[]>('/family-members');
    }
    return fetchData(() => mockFamilyMembers);
  },

  // Создать нового члена семьи
  async createFamilyMember(member: Omit<FamilyMember, 'id'>): Promise<FamilyMember> {
    if (!apiConfig.useMockData) {
      return fetchFromApi<FamilyMember>('/family-members', {
        method: 'POST',
        body: JSON.stringify(member),
      });
    }
    const newMember: FamilyMember = {
      ...member,
      id: Date.now().toString()
    };
    return fetchData(() => newMember);
  },

  // Обновить члена семьи
  async updateFamilyMember(id: string, updates: Partial<FamilyMember>): Promise<FamilyMember> {
    if (!apiConfig.useMockData) {
      return fetchFromApi<FamilyMember>(`/family-members/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    }
    const updatedMember: FamilyMember = {
      ...(mockFamilyMembers.find(member => member.id === id) as FamilyMember),
      ...updates
    };
    return fetchData(() => updatedMember);
  },

  // Удалить члена семьи
  async deleteFamilyMember(id: string): Promise<void> {
    if (!apiConfig.useMockData) {
      return fetchFromApi<void>(`/family-members/${id}`, {
        method: 'DELETE',
      });
    }
    return fetchData(() => undefined);
  }
};

// API для запросов в семью
export interface FamilyGroupStatus {
  isInGroup: boolean;
  isLeader: boolean;
  groupName: string | null;
  groupId: number | null;
  inviteCode: string | null;
  members: Array<{
    id: number;
    name: string;
    email: string;
    avatar: string;
    isLeader: boolean;
  }>;
}

export interface IncomingRequest {
  id: number;
  senderId: number;
  senderName: string;
  senderEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export const familyGroupApi = {
  // Создать семейную группу
  async createGroup(name: string): Promise<FamilyGroupStatus> {
    if (!apiConfig.useMockData) {
      return fetchFromApi<FamilyGroupStatus>('/family-requests/create-group', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
    }
    return fetchData(() => ({
      isInGroup: true,
      isLeader: true,
      groupName: name,
      groupId: Date.now(),
      inviteCode: 'ABC123',
      members: []
    }));
  },

  // Присоединиться к группе по коду
  async joinGroup(inviteCode: string): Promise<{ requestId: number; groupName: string }> {
    if (!apiConfig.useMockData) {
      return fetchFromApi<{ requestId: number; groupName: string }>('/family-requests/join-group', {
        method: 'POST',
        body: JSON.stringify({ inviteCode }),
      });
    }
    return fetchData(() => ({
      requestId: Date.now(),
      groupName: 'Test Group'
    }));
  },

  // Получить статус группы
  async getStatus(): Promise<FamilyGroupStatus> {
    if (!apiConfig.useMockData) {
      return fetchFromApi<FamilyGroupStatus>('/family-requests/status');
    }
    return fetchData(() => ({
      isInGroup: false,
      isLeader: false,
      groupName: null,
      groupId: null,
      inviteCode: null,
      members: []
    }));
  },

  // Получить входящие запросы (для лидера)
  async getIncomingRequests(): Promise<IncomingRequest[]> {
    if (!apiConfig.useMockData) {
      return fetchFromApi<IncomingRequest[]>('/family-requests/incoming-requests');
    }
    return fetchData(() => []);
  },

  // Принять запрос на присоединение (для лидера)
  async acceptRequest(requestId: number): Promise<void> {
    if (!apiConfig.useMockData) {
      return fetchFromApi<void>(`/family-requests/requests/${requestId}/accept`, {
        method: 'PUT',
      });
    }
    return fetchData(() => undefined);
  },

  // Отклонить запрос на присоединение (для лидера)
  async declineRequest(requestId: number): Promise<void> {
    if (!apiConfig.useMockData) {
      return fetchFromApi<void>(`/family-requests/requests/${requestId}/decline`, {
        method: 'PUT',
      });
    }
    return fetchData(() => undefined);
  },

  // Удалить участника (для лидера)
  async removeMember(memberId: number): Promise<void> {
    if (!apiConfig.useMockData) {
      return fetchFromApi<void>(`/family-requests/members/${memberId}`, {
        method: 'DELETE',
      });
    }
    return fetchData(() => undefined);
  },

  // Передать статус лидера
  async transferLeadership(newLeaderId: number): Promise<void> {
    if (!apiConfig.useMockData) {
      return fetchFromApi<void>(`/family-requests/transfer-leadership/${newLeaderId}`, {
        method: 'PUT',
      });
    }
    return fetchData(() => undefined);
  },

  // Покинуть группу
  async leaveGroup(): Promise<void> {
    if (!apiConfig.useMockData) {
      return fetchFromApi<void>('/family-requests/leave', {
        method: 'POST',
      });
    }
    return fetchData(() => undefined);
  },

  // Отправить приглашение по email
  async inviteByEmail(email: string): Promise<{ invitedEmail: string; groupName: string }> {
    if (!apiConfig.useMockData) {
      return fetchFromApi<{ invitedEmail: string; groupName: string }>('/family-requests/invite-by-email', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    }
    return fetchData(() => ({
      invitedEmail: email,
      groupName: 'Family Group'
    }));
  }
};

// API для курсов валют
export const exchangeRatesApi = {
  // Получить все курсы валют
  async getExchangeRates(): Promise<ExchangeRate[]> {
    if (!apiConfig.useMockData) {
      const data = await fetchFromApi<any[]>('/exchange-rates');
      // Преобразуем данные из формата бэкенда в формат фронтенда
      // Бэкенд: fromCurrency, toCurrency, rate (строка)
      // Фронтенд: from, to, rate (число)
      return data.map((r) => ({
        from: r.fromCurrency || r.from,
        to: r.toCurrency || r.to,
        rate: parseFloat(r.rate) || 0
      }));
    }
    return fetchData(() => mockExchangeRates);
  },

  // Получить список доступных валют (всегда с бэкенда)
  async getAvailableCurrencies(): Promise<string[]> {
    // Всегда получаем валюты с реального бэкенда
    // Не используем mock данные для валют
    try {
      const data = await fetchFromApi<any[]>('/exchange-rates/currencies');
      return data;
    } catch (error) {
      console.error('Error fetching currencies:', error);
      // При ошибке возвращаем базовые валюты
      return ['USD', 'UZS', 'EUR', 'RUB', 'GBP'];
    }
  },

  // Обновить курс валюты
  async updateExchangeRate(from: string, to: string, rate: number): Promise<ExchangeRate> {
    if (!apiConfig.useMockData) {
      return fetchFromApi<ExchangeRate>(`/exchange-rates/${from}/${to}`, {
        method: 'PUT',
        body: JSON.stringify({ rate }),
      });
    }
    const updatedRate: ExchangeRate = {
      from,
      to,
      rate
    };
    return fetchData(() => updatedRate);
  }
};

// Интерфейс для Budget Plan
export interface BudgetPlanData {
  id?: number;
  monthKey: string;
  accountId?: string;
  totalIncomePlan: number;
  totalExpensePlan: number;
  categoryLimits?: Array<{
    category: string;
    limitAmount: number;
  }>;
  incomePlanItems?: Array<{
    category: string;
    plannedAmount: number;
  }>;
}

// API для бюджетов
export const budgetsApi = {
  // Получить все бюджеты
  async getAllBudgets(): Promise<BudgetPlanData[]> {
    if (!apiConfig.useMockData) {
      const data = await fetchFromApi<any[]>('/budgets');
      return data.map(budget => ({
        id: budget.id,
        monthKey: budget.monthKey,
        totalIncomePlan: Number(budget.totalIncomePlan) || 0,
        totalExpensePlan: Number(budget.totalExpensePlan) || 0,
        categoryLimits: budget.categoryLimits?.map((l: any) => ({
          category: l.category,
          limitAmount: Number(l.limit) || 0
        })),
        incomePlanItems: budget.incomePlanItems?.map((i: any) => ({
          category: i.category,
          plannedAmount: Number(i.plannedAmount) || 0
        }))
      }));
    }
    return fetchData(() => []);
  },

  // Получить бюджет по monthKey и accountId
  async getBudgetByMonth(monthKey: string, accountId?: string): Promise<BudgetPlanData | null> {
    if (!apiConfig.useMockData) {
      const params = new URLSearchParams({ monthKey });
      if (accountId) {
        params.append('accountId', accountId);
      }
      const data = await fetchFromApi<any>(`/budgets/by-month?${params.toString()}`);
      if (!data) return null;
      return {
        id: data.id,
        accountId: data.accountId,
        monthKey: data.monthKey,
        totalIncomePlan: Number(data.totalIncomePlan) || 0,
        totalExpensePlan: Number(data.totalExpensePlan) || 0,
        categoryLimits: data.categoryLimits?.map((l: any) => ({
          category: l.category,
          limitAmount: Number(l.limit) || 0
        })),
        incomePlanItems: data.incomePlanItems?.map((i: any) => ({
          category: i.category,
          plannedAmount: Number(i.plannedAmount) || 0
        }))
      };
    }
    return fetchData(() => null);
  },

  // Создать или обновить бюджет
  async saveBudget(budget: BudgetPlanData): Promise<BudgetPlanData> {
    if (!apiConfig.useMockData) {
      // Если есть id - обновляем, иначе создаём
      if (budget.id) {
        const data = await fetchFromApi<any>(`/budgets/${budget.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            monthKey: budget.monthKey,
            accountId: budget.accountId,
            totalIncomePlan: budget.totalIncomePlan,
            totalExpensePlan: budget.totalExpensePlan,
            categoryLimits: budget.categoryLimits,
            incomePlanItems: budget.incomePlanItems
          }),
        });
        return {
          id: data.id,
          accountId: data.accountId,
          monthKey: data.monthKey,
          totalIncomePlan: Number(data.totalIncomePlan) || 0,
          totalExpensePlan: Number(data.totalExpensePlan) || 0
        };
      } else {
        const data = await fetchFromApi<any>('/budgets', {
          method: 'POST',
          body: JSON.stringify({
            monthKey: budget.monthKey,
            accountId: budget.accountId,
            totalIncomePlan: budget.totalIncomePlan,
            totalExpensePlan: budget.totalExpensePlan,
            categoryLimits: budget.categoryLimits,
            incomePlanItems: budget.incomePlanItems
          }),
        });
        return {
          id: data.id,
          accountId: data.accountId,
          monthKey: data.monthKey,
          totalIncomePlan: Number(data.totalIncomePlan) || 0,
          totalExpensePlan: Number(data.totalExpensePlan) || 0
        };
      }
    }
    return fetchData(() => budget);
  },

  // Удалить бюджет
  async deleteBudget(id: number): Promise<void> {
    if (!apiConfig.useMockData) {
      return fetchFromApi<void>(`/budgets/${id}`, {
        method: 'DELETE',
      });
    }
    return fetchData(() => undefined);
  },

  // Добавить лимит категории
  async addCategoryLimit(budgetId: number, category: string, limitAmount: number): Promise<BudgetPlanData> {
    if (!apiConfig.useMockData) {
      const data = await fetchFromApi<any>(`/budgets/${budgetId}/category-limits`, {
        method: 'POST',
        body: JSON.stringify({ category, limitAmount }),
      });
      return {
        id: data.id,
        accountId: data.accountId,
        monthKey: data.monthKey,
        totalIncomePlan: Number(data.totalIncomePlan) || 0,
        totalExpensePlan: Number(data.totalExpensePlan) || 0,
        categoryLimits: data.categoryLimits?.map((l: any) => ({
          category: l.category,
          limitAmount: Number(l.limit) || 0
        })),
        incomePlanItems: data.incomePlanItems?.map((i: any) => ({
          category: i.category,
          plannedAmount: Number(i.plannedAmount) || 0
        }))
      };
    }
    return fetchData(() => ({} as BudgetPlanData));
  },

  // Обновить лимит категории
  async updateCategoryLimit(budgetId: number, category: string, limitAmount: number): Promise<BudgetPlanData> {
    if (!apiConfig.useMockData) {
      const data = await fetchFromApi<any>(`/budgets/${budgetId}/category-limits/${encodeURIComponent(category)}`, {
        method: 'PUT',
        body: JSON.stringify({ limitAmount }),
      });
      return {
        id: data.id,
        accountId: data.accountId,
        monthKey: data.monthKey,
        totalIncomePlan: Number(data.totalIncomePlan) || 0,
        totalExpensePlan: Number(data.totalExpensePlan) || 0,
        categoryLimits: data.categoryLimits?.map((l: any) => ({
          category: l.category,
          limitAmount: Number(l.limit) || 0
        })),
        incomePlanItems: data.incomePlanItems?.map((i: any) => ({
          category: i.category,
          plannedAmount: Number(i.plannedAmount) || 0
        }))
      };
    }
    return fetchData(() => ({} as BudgetPlanData));
  },

  // Удалить лимит категории
  async deleteCategoryLimit(budgetId: number, category: string): Promise<BudgetPlanData> {
    if (!apiConfig.useMockData) {
      const data = await fetchFromApi<any>(`/budgets/${budgetId}/category-limits/${encodeURIComponent(category)}`, {
        method: 'DELETE',
      });
      return {
        id: data.id,
        accountId: data.accountId,
        monthKey: data.monthKey,
        totalIncomePlan: Number(data.totalIncomePlan) || 0,
        totalExpensePlan: Number(data.totalExpensePlan) || 0,
        categoryLimits: data.categoryLimits?.map((l: any) => ({
          category: l.category,
          limitAmount: Number(l.limit) || 0
        })),
        incomePlanItems: data.incomePlanItems?.map((i: any) => ({
          category: i.category,
          plannedAmount: Number(i.plannedAmount) || 0
        }))
      };
    }
    return fetchData(() => ({} as BudgetPlanData));
  }
};

// Общий API объект для удобного импорта
export const api = {
  accounts: accountsApi,
  transactions: transactionsApi,
  debts: debtsApi,
  credits: creditsApi,
  notifications: notificationsApi,
  familyMembers: familyMembersApi,
  familyGroup: familyGroupApi,
  exchangeRates: exchangeRatesApi,
  budgets: budgetsApi,
  config: {
    set: setApiConfig,
    get: getApiConfig
  }
};

export default api;
