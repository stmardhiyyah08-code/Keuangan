import {
  User,
  Transaction,
  Account,
  Category,
  Budget,
  FinancialGoal,
  DailyReminder,
  SupabaseConfig,
} from '../types';

const API_BASE = '/api';

export async function fetchUsers(): Promise<User[]> {
  try {
    const res = await fetch(`${API_BASE}/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return await res.json();
  } catch (err) {
    console.warn('API error, returning mock users:', err);
    return [
      {
        id: 'user-demo',
        name: 'Ahmad Rizky',
        email: 'ahmad.rizky@example.com',
        currency: 'IDR',
        darkMode: false,
        createdAt: new Date().toISOString(),
      },
    ];
  }
}

export async function loginUser(email: string): Promise<User> {
  const res = await fetch(`${API_BASE}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  return data.user;
}

export async function fetchTransactions(userId: string): Promise<Transaction[]> {
  try {
    const res = await fetch(`${API_BASE}/transactions?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return await res.json();
  } catch (err) {
    console.warn('Error fetching transactions:', err);
    return [];
  }
}

export async function createTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Promise<{ transaction: Transaction; accounts: Account[] }> {
  const res = await fetch(`${API_BASE}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tx),
  });
  return await res.json();
}

export async function updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
  const res = await fetch(`${API_BASE}/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  return data.transaction;
}

export async function deleteTransaction(id: string): Promise<{ accounts: Account[] }> {
  const res = await fetch(`${API_BASE}/transactions/${id}`, {
    method: 'DELETE',
  });
  return await res.json();
}

export async function fetchAccounts(userId: string): Promise<Account[]> {
  try {
    const res = await fetch(`${API_BASE}/accounts?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch accounts');
    return await res.json();
  } catch (err) {
    console.warn('Error fetching accounts:', err);
    return [];
  }
}

export async function createAccount(acc: Omit<Account, 'id'>): Promise<Account> {
  const res = await fetch(`${API_BASE}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(acc),
  });
  const data = await res.json();
  return data.account;
}

export async function transferBetweenAccounts(payload: {
  userId: string;
  sourceAccountId: string;
  targetAccountId: string;
  amount: number;
  description: string;
  date: string;
}): Promise<{ transaction: Transaction; accounts: Account[] }> {
  const res = await fetch(`${API_BASE}/accounts/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return await res.json();
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return await res.json();
  } catch (err) {
    return [];
  }
}

export async function fetchBudgets(userId: string): Promise<Budget[]> {
  try {
    const res = await fetch(`${API_BASE}/budgets?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch budgets');
    return await res.json();
  } catch (err) {
    return [];
  }
}

export async function saveBudget(budget: Omit<Budget, 'id'>): Promise<Budget[]> {
  const res = await fetch(`${API_BASE}/budgets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(budget),
  });
  const data = await res.json();
  return data.budgets;
}

export async function fetchGoals(userId: string): Promise<FinancialGoal[]> {
  try {
    const res = await fetch(`${API_BASE}/goals?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch goals');
    return await res.json();
  } catch (err) {
    return [];
  }
}

export async function createGoal(goal: Omit<FinancialGoal, 'id'>): Promise<FinancialGoal> {
  const res = await fetch(`${API_BASE}/goals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(goal),
  });
  const data = await res.json();
  return data.goal;
}

export async function updateGoal(id: string, updates: Partial<FinancialGoal>): Promise<FinancialGoal> {
  const res = await fetch(`${API_BASE}/goals/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  return data.goal;
}

export async function fetchReminders(): Promise<DailyReminder> {
  try {
    const res = await fetch(`${API_BASE}/reminders`);
    return await res.json();
  } catch (err) {
    return { enabled: true, time: '20:00', streakDays: 0 };
  }
}

export async function saveReminders(reminder: Partial<DailyReminder>): Promise<DailyReminder> {
  const res = await fetch(`${API_BASE}/reminders`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reminder),
  });
  const data = await res.json();
  return data.reminders;
}

export async function fetchSupabaseConfig(): Promise<SupabaseConfig> {
  try {
    const res = await fetch(`${API_BASE}/supabase-config`);
    return await res.json();
  } catch (err) {
    return { url: '', anonKey: '', isConnected: false };
  }
}

export async function saveSupabaseConfig(config: { url: string; anonKey: string }): Promise<SupabaseConfig> {
  const res = await fetch(`${API_BASE}/supabase-config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  const data = await res.json();
  return data.supabaseConfig;
}

export async function askGeminiAdvisor(payload: {
  prompt: string;
  receiptImage?: string;
  userFinancials?: {
    totalIncome: number;
    totalExpense: number;
    totalBalance: number;
    topCategory: string;
  };
}): Promise<string> {
  const res = await fetch(`${API_BASE}/ai/advisor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.text;
}
