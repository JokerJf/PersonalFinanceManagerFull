import { Account, Transaction, Debt, Notification, FamilyMember, ExchangeRate } from '../context/AppContext';

export const mockAccounts: Account[] = [
  { 
    id: '1', 
    name: 'Visa Platinum', 
    type: 'card', 
    currency: 'USD', 
    balance: 4250.80, 
    color: 'from-[#1a1f71] to-[#2d4aa8]', 
    cardNetwork: 'visa', 
    cardNumberFull: '4276123456783421', 
    expiryDate: '09/28', 
    includedInBalance: true 
  },
  { 
    id: '2', 
    name: 'Humo', 
    type: 'card', 
    currency: 'UZS', 
    balance: 12800000, 
    color: 'from-[#00a651] to-[#4fc978]', 
    cardNetwork: 'humo', 
    cardNumberFull: '9860456789017812', 
    expiryDate: '03/27', 
    includedInBalance: true 
  },
  { 
    id: '3', 
    name: 'UzCard', 
    type: 'card', 
    currency: 'UZS', 
    balance: 5400000, 
    color: 'from-[#0066b3] to-[#00a0e3]', 
    cardNetwork: 'uzcard', 
    cardNumberFull: '8600789012341456', 
    expiryDate: '11/26', 
    includedInBalance: true 
  },
  { 
    id: '4', 
    name: 'Savings Account', 
    type: 'bank', 
    currency: 'USD', 
    balance: 12800.00, 
    color: 'from-emerald-600 to-teal-500', 
    includedInBalance: true 
  },
  { 
    id: '5', 
    name: 'Cash', 
    type: 'cash', 
    currency: 'USD', 
    balance: 340.50, 
    color: 'from-amber-500 to-orange-400', 
    includedInBalance: true 
  }
];

export const mockTransactions: Transaction[] = [
  { 
    id: 't1', 
    type: 'expense', 
    amount: 42.50, 
    currency: 'USD', 
    category: 'Food & Dining', 
    description: 'Grocery Store', 
    accountId: '1', 
    accountName: 'Visa Platinum', 
    date: '2026-02-28T14:30', 
    icon: 'utensils-crossed', 
    note: 'Weekly grocery shopping at Makro' 
  },
  { 
    id: 't2', 
    type: 'expense', 
    amount: 12.99, 
    currency: 'USD', 
    category: 'Entertainment', 
    description: 'Netflix Subscription', 
    accountId: '1', 
    accountName: 'Visa Platinum', 
    date: '2026-02-27T09:15', 
    icon: 'film', 
    note: 'Monthly subscription' 
  },
  { 
    id: 't3', 
    type: 'income', 
    amount: 3500.00, 
    currency: 'USD', 
    category: 'Salary', 
    description: 'Monthly Salary', 
    accountId: '4', 
    accountName: 'Savings Account', 
    date: '2026-02-25T10:00', 
    icon: 'briefcase', 
    note: 'February salary' 
  },
  { 
    id: 't4', 
    type: 'expense', 
    amount: 65.00, 
    currency: 'USD', 
    category: 'Transport', 
    description: 'Gas Station', 
    accountId: '1', 
    accountName: 'Visa Platinum', 
    date: '2026-02-24T18:45', 
    icon: 'car', 
    note: 'Filled up tank at BP' 
  },
  { 
    id: 't5', 
    type: 'transfer', 
    amount: 500.00, 
    currency: 'USD', 
    category: 'Transfer', 
    description: 'To Savings', 
    accountId: '1', 
    accountName: 'Visa Platinum', 
    toAccountId: '4', 
    toAccountName: 'Savings Account', 
    date: '2026-02-23T11:20', 
    icon: 'arrow-left-right', 
    note: 'Monthly savings' 
  },
  { 
    id: 't6', 
    type: 'expense', 
    amount: 89.99, 
    currency: 'USD', 
    category: 'Shopping', 
    description: 'Amazon Purchase', 
    accountId: '1', 
    accountName: 'Visa Platinum', 
    date: '2026-02-22T16:30', 
    icon: 'shopping-bag', 
    note: 'Headphones and cables' 
  },
  { 
    id: 't7', 
    type: 'expense', 
    amount: 28.00, 
    currency: 'USD', 
    category: 'Health', 
    description: 'Pharmacy', 
    accountId: '5', 
    accountName: 'Cash', 
    date: '2026-02-21T12:00', 
    icon: 'heart-pulse', 
    note: 'Vitamins and medicine' 
  },
  { 
    id: 't8', 
    type: 'income', 
    amount: 150.00, 
    currency: 'USD', 
    category: 'Freelance', 
    description: 'Design Project', 
    accountId: '1', 
    accountName: 'Visa Platinum', 
    date: '2026-02-20T15:45', 
    icon: 'laptop', 
    note: 'Logo design for client' 
  },
  { 
    id: 't9', 
    type: 'transfer', 
    amount: 6500000, 
    currency: 'UZS', 
    category: 'Transfer', 
    description: 'USD to UZS Exchange', 
    accountId: '1', 
    accountName: 'Visa Platinum', 
    toAccountId: '2', 
    toAccountName: 'Humo', 
    toCurrency: 'UZS', 
    toAmount: 6500000, 
    date: '2026-02-19T13:30', 
    icon: 'arrow-left-right', 
    note: 'Currency exchange at 12,800 rate' 
  },
  { 
    id: 't10', 
    type: 'expense', 
    amount: 350000, 
    currency: 'UZS', 
    category: 'Food & Dining', 
    description: 'Korzinka', 
    accountId: '2', 
    accountName: 'Humo', 
    date: '2026-02-18T10:15', 
    icon: 'utensils-crossed', 
    note: 'Daily groceries' 
  }
];

export const mockDebts: Debt[] = [
  { 
    id: 'd1', 
    name: 'Alex', 
    amount: 150.00, 
    currency: 'USD', 
    type: 'owe', 
    status: 'open', 
    date: '2026-02-15', 
    description: 'Dinner at restaurant' 
  },
  { 
    id: 'd2', 
    name: 'Maria', 
    amount: 75.00, 
    currency: 'USD', 
    type: 'owed', 
    status: 'open', 
    date: '2026-02-10', 
    description: 'Taxi fare' 
  },
  { 
    id: 'd3', 
    name: 'John', 
    amount: 200.00, 
    currency: 'USD', 
    type: 'owed', 
    status: 'closed', 
    date: '2026-01-20', 
    description: 'Concert tickets' 
  },
  { 
    id: 'd4', 
    name: 'Sardor', 
    amount: 500000, 
    currency: 'UZS', 
    type: 'owe', 
    status: 'open', 
    date: '2026-02-20', 
    description: 'Phone repair' 
  }
];

export const mockNotifications: Notification[] = [
  { 
    id: 'n1', 
    title: 'Salary Received', 
    message: 'Your monthly salary of $3,500 has been deposited to Savings Account.', 
    date: '2026-02-25', 
    read: false, 
    type: 'success' 
  },
  { 
    id: 'n2', 
    title: 'Budget Warning', 
    message: 'You\'ve spent 85% of your Food & Dining budget this month.', 
    date: '2026-02-26', 
    read: false, 
    type: 'warning' 
  },
  { 
    id: 'n3', 
    title: 'New Feature', 
    message: 'Family workspace is now available! Invite your family members.', 
    date: '2026-02-20', 
    read: true, 
    type: 'info' 
  },
  { 
    id: 'n4', 
    title: 'Card Payment', 
    message: 'Payment of $42.50 at Grocery Store from Visa Platinum.', 
    date: '2026-02-28', 
    read: false, 
    type: 'info' 
  },
  { 
    id: 'n5', 
    title: 'Transfer Complete', 
    message: 'Transfer of $500 from Visa Platinum to Savings Account completed.', 
    date: '2026-02-23', 
    read: true, 
    type: 'success' 
  }
];

export const mockFamilyMembers: FamilyMember[] = [
  { 
    id: 'm1', 
    name: 'You', 
    email: 'you@email.com', 
    avatar: 'Y', 
    role: 'admin' 
  },
  { 
    id: 'm2', 
    name: 'Partner', 
    email: 'partner@email.com', 
    avatar: 'P', 
    role: 'admin' 
  },
  { 
    id: 'm3', 
    name: 'Child', 
    email: 'child@email.com', 
    avatar: 'C', 
    role: 'member' 
  }
];

// export const mockExchangeRates: ExchangeRate[] = [
//   { from: 'USD', to: 'UZS', rate: 12800 },
//   { from: 'USD', to: 'EUR', rate: 0.92 },
//   { from: 'USD', to: 'RUB', rate: 89.50 },
//   { from: 'USD', to: 'GBP', rate: 0.79 },
//   { from: 'EUR', to: 'UZS', rate: 13913 },
//   { from: 'EUR', to: 'USD', rate: 1.087 },
//   { from: 'EUR', to: 'RUB', rate: 97.28 },
//   { from: 'EUR', to: 'GBP', rate: 0.858 },
//   { from: 'UZS', to: 'USD', rate: 0.0000781 },
//   { from: 'UZS', to: 'EUR', rate: 0.0000719 },
//   { from: 'RUB', to: 'USD', rate: 0.01117 },
//   { from: 'RUB', to: 'UZS', rate: 143.02 },
//   { from: 'GBP', to: 'USD', rate: 1.266 },
//   { from: 'GBP', to: 'UZS', rate: 16202 }
// ];
export const mockExchangeRates: ExchangeRate[] = [
  // USD base
  { from: 'USD', to: 'UZS', rate: 12180 },
  { from: 'USD', to: 'EUR', rate: 0.92 },
  { from: 'USD', to: 'RUB', rate: 92.5 },
  { from: 'USD', to: 'GBP', rate: 0.79 },
  { from: 'USD', to: 'JPY', rate: 148.0 },
  { from: 'USD', to: 'CNY', rate: 7.20 },
  { from: 'USD', to: 'CHF', rate: 0.90 },

  // EUR
  { from: 'EUR', to: 'USD', rate: 1.087 },
  { from: 'EUR', to: 'UZS', rate: 13240 },
  { from: 'EUR', to: 'RUB', rate: 100.5 },
  { from: 'EUR', to: 'GBP', rate: 0.86 },
  { from: 'EUR', to: 'JPY', rate: 160.9 },

  // UZS
  { from: 'UZS', to: 'USD', rate: 0.0000821 },
  { from: 'UZS', to: 'EUR', rate: 0.0000755 },
  { from: 'UZS', to: 'RUB', rate: 0.0076 },

  // RUB
  { from: 'RUB', to: 'USD', rate: 0.0108 },
  { from: 'RUB', to: 'UZS', rate: 131.7 },
  { from: 'RUB', to: 'EUR', rate: 0.0099 },

  // GBP
  { from: 'GBP', to: 'USD', rate: 1.266 },
  { from: 'GBP', to: 'UZS', rate: 15420 },
  { from: 'GBP', to: 'EUR', rate: 1.16 },

  // JPY
  { from: 'JPY', to: 'USD', rate: 0.00676 },
  { from: 'JPY', to: 'UZS', rate: 82.3 },

  // CNY
  { from: 'CNY', to: 'USD', rate: 0.138 },
  { from: 'CNY', to: 'UZS', rate: 1680 },

  // CHF
  { from: 'CHF', to: 'USD', rate: 1.11 },
  { from: 'CHF', to: 'UZS', rate: 13520 }
];