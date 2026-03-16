# API Layer

This directory contains the API layer for the application, providing a unified interface for interacting with data.

## Files

### `api.ts`

Main API interface with configuration options.

#### Configuration

```typescript
import { api } from './api';

// Get current configuration
const config = api.config.get();
console.log('Current API config:', config);

// Update configuration
api.config.set({
  baseUrl: 'https://api.yourbackend.com',
  useMockData: false, // Switch to real API
  mockDelay: 500 // Reduce delay for faster responses
});
```

#### Usage

```typescript
import { api } from './api';

// Fetch all accounts
const accounts = await api.accounts.getAllAccounts();

// Create new account
const newAccount = await api.accounts.createAccount({
  name: 'New Account',
  type: 'bank',
  currency: 'USD',
  balance: 1000,
  transactions: 0,
  color: 'from-blue-500 to-blue-600',
  includedInBalance: true
});

// Fetch all transactions
const transactions = await api.transactions.getAllTransactions();

// Get transactions by account
const accountTransactions = await api.transactions.getTransactionsByAccount('1');

// Create new transaction
const newTransaction = await api.transactions.createTransaction({
  type: 'expense',
  amount: 50,
  currency: 'USD',
  category: 'Food & Dining',
  description: 'Groceries',
  accountId: '1',
  accountName: 'Visa Platinum',
  date: new Date().toISOString(),
  icon: 'utensils-crossed'
});

// Fetch all debts
const debts = await api.debts.getAllDebts();

// Fetch all notifications
const notifications = await api.notifications.getAllNotifications();

// Fetch all family members
const familyMembers = await api.familyMembers.getAllFamilyMembers();

// Fetch exchange rates
const exchangeRates = await api.exchangeRates.getExchangeRates();
```

### `mockData.ts`

Contains fake data used when `useMockData` is true. The data is structured according to the types defined in `AppContext.tsx`.

## Switching to Real API

To switch to a real backend API, update the configuration:

```typescript
import { api } from './api';

api.config.set({
  baseUrl: 'https://api.yourbackend.com',
  useMockData: false
});
```

Then implement the real API calls in `api.ts` by replacing the mock data calls with fetch/axios requests.
