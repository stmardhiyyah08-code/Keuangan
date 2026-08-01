export type TransactionType = 'income' | 'expense' | 'transfer';
export type AccountType = 'cash' | 'bank' | 'e-wallet' | 'investment';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  currency: string; // e.g. 'IDR'
  darkMode: boolean;
  createdAt: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  icon: string;
  color: string;
  accountNumber?: string;
  isDefault?: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  accountId: string;
  targetAccountId?: string; // used for transfer
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  description: string;
  tags?: string[];
  receiptUrl?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  monthlyLimit: number;
  monthYear: string; // e.g. "2026-08"
}

export interface FinancialGoal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  icon: string;
  color: string;
}

export interface DailyReminder {
  enabled: boolean;
  time: string; // "20:00"
  lastLoggedDate?: string;
  streakDays: number;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastSyncedAt?: string;
}

export interface FilterState {
  search: string;
  type: 'all' | TransactionType;
  categoryId: string;
  accountId: string;
  datePreset: 'this_month' | 'last_month' | 'this_year' | 'last_30_days' | 'custom';
  startDate: string;
  endDate: string;
  sortBy: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
}

export interface ReportSummary {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number; // percentage
  topExpenseCategories: { category: Category; total: number; percentage: number }[];
  monthlyTrend: { month: string; income: number; expense: number; net: number }[];
  accountBalances: { account: Account; balance: number }[];
}
