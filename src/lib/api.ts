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

async function safeJsonParse<T>(res: Response, fallback: T): Promise<T> {
  if (!res.ok) return fallback;
  try {
    const text = await res.text();
    if (!text || !text.trim()) return fallback;
    return JSON.parse(text) as T;
  } catch (err) {
    console.warn('JSON parse error:', err);
    return fallback;
  }
}

export async function fetchUsers(): Promise<User[]> {
  try {
    const res = await fetch(`${API_BASE}/users`);
    return await safeJsonParse<User[]>(res, []);
  } catch (err) {
    console.warn('API error, returning empty users list:', err);
    return [];
  }
}

export async function loginUser(email: string, name?: string): Promise<User> {
  try {
    const res = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });
    
    if (!res.ok) {
      throw new Error(`Server error (${res.status})`);
    }

    const text = await res.text();
    if (!text || !text.trim()) {
      throw new Error('Server mengembalikan respon kosong.');
    }

    const data = JSON.parse(text);
    if (!data || !data.user) {
      throw new Error('Format data user dari server tidak valid.');
    }
    return data.user;
  } catch (err: any) {
    console.warn('Login server failed, generating local session:', err);
    // Fallback local session if server API is unavailable
    const fallbackUser: User = {
      id: 'user-' + Date.now(),
      name: name || (email ? email.split('@')[0] : 'Pengguna'),
      email: email,
      currency: 'IDR',
      darkMode: false,
      createdAt: new Date().toISOString(),
    };
    return fallbackUser;
  }
}

export async function fetchTransactions(userId: string): Promise<Transaction[]> {
  if (!userId) return [];
  try {
    const res = await fetch(`${API_BASE}/transactions?userId=${encodeURIComponent(userId)}`);
    return await safeJsonParse<Transaction[]>(res, []);
  } catch (err) {
    console.warn('Error fetching transactions:', err);
    return [];
  }
}

export async function createTransaction(
  tx: Omit<Transaction, 'id' | 'createdAt'>
): Promise<{ transaction: Transaction; accounts: Account[] }> {
  const localTx: Transaction = {
    ...tx,
    id: 'tx-' + Date.now(),
    createdAt: new Date().toISOString(),
  };

  try {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx),
    });
    
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim()) {
        const data = JSON.parse(text);
        if (data.transaction) return data;
      }
    }
  } catch (err) {
    console.warn('Network error on createTransaction, using local state:', err);
  }

  return { transaction: localTx, accounts: [] };
}

export async function updateTransaction(
  id: string,
  updates: Partial<Transaction>
): Promise<Transaction> {
  try {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (res.ok) {
      const text = await res.text();
      if (text && text.trim()) {
        const data = JSON.parse(text);
        if (data.transaction) return data.transaction;
      }
    }
  } catch (err) {
    console.warn('Error updating transaction:', err);
  }

  return { id, ...updates } as Transaction;
}

export async function deleteTransaction(id: string): Promise<{ accounts: Account[] }> {
  try {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim()) {
        return JSON.parse(text);
      }
    }
  } catch (err) {
    console.warn('Error deleting transaction:', err);
  }
  return { accounts: [] };
}

export async function fetchAccounts(userId: string): Promise<Account[]> {
  if (!userId) return [];
  try {
    const res = await fetch(`${API_BASE}/accounts?userId=${encodeURIComponent(userId)}`);
    return await safeJsonParse<Account[]>(res, []);
  } catch (err) {
    console.warn('Error fetching accounts:', err);
    return [];
  }
}

export async function createAccount(acc: Omit<Account, 'id'>): Promise<Account> {
  const localAcc: Account = { ...acc, id: 'acc-' + Date.now() };
  try {
    const res = await fetch(`${API_BASE}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(acc),
    });
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim()) {
        const data = JSON.parse(text);
        if (data.account) return data.account;
      }
    }
  } catch (err) {
    console.warn('Error creating account:', err);
  }
  return localAcc;
}

export async function transferBetweenAccounts(payload: {
  userId: string;
  sourceAccountId: string;
  targetAccountId: string;
  amount: number;
  description: string;
  date: string;
}): Promise<{ transaction: Transaction; accounts: Account[] }> {
  const localTx: Transaction = {
    id: 'tx-' + Date.now(),
    userId: payload.userId,
    type: 'transfer',
    amount: payload.amount,
    categoryId: 'exp-10',
    accountId: payload.sourceAccountId,
    targetAccountId: payload.targetAccountId,
    date: payload.date,
    time: new Date().toTimeString().slice(0, 5),
    description: payload.description,
    createdAt: new Date().toISOString(),
  };

  try {
    const res = await fetch(`${API_BASE}/accounts/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim()) {
        const data = JSON.parse(text);
        if (data.transaction) return data;
      }
    }
  } catch (err) {
    console.warn('Error in transferBetweenAccounts:', err);
  }

  return { transaction: localTx, accounts: [] };
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    return await safeJsonParse<Category[]>(res, []);
  } catch (err) {
    return [];
  }
}

export async function fetchBudgets(userId: string): Promise<Budget[]> {
  if (!userId) return [];
  try {
    const res = await fetch(`${API_BASE}/budgets?userId=${encodeURIComponent(userId)}`);
    return await safeJsonParse<Budget[]>(res, []);
  } catch (err) {
    return [];
  }
}

export async function saveBudget(budget: Omit<Budget, 'id'>): Promise<Budget[]> {
  try {
    const res = await fetch(`${API_BASE}/budgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(budget),
    });
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim()) {
        const data = JSON.parse(text);
        if (data.budgets) return data.budgets;
      }
    }
  } catch (err) {
    console.warn('Error saving budget:', err);
  }
  return [];
}

export async function fetchGoals(userId: string): Promise<FinancialGoal[]> {
  if (!userId) return [];
  try {
    const res = await fetch(`${API_BASE}/goals?userId=${encodeURIComponent(userId)}`);
    return await safeJsonParse<FinancialGoal[]>(res, []);
  } catch (err) {
    return [];
  }
}

export async function createGoal(goal: Omit<FinancialGoal, 'id'>): Promise<FinancialGoal> {
  const localGoal: FinancialGoal = { ...goal, id: 'goal-' + Date.now() };
  try {
    const res = await fetch(`${API_BASE}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal),
    });
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim()) {
        const data = JSON.parse(text);
        if (data.goal) return data.goal;
      }
    }
  } catch (err) {
    console.warn('Error creating goal:', err);
  }
  return localGoal;
}

export async function updateGoal(id: string, updates: Partial<FinancialGoal>): Promise<FinancialGoal> {
  try {
    const res = await fetch(`${API_BASE}/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim()) {
        const data = JSON.parse(text);
        if (data.goal) return data.goal;
      }
    }
  } catch (err) {
    console.warn('Error updating goal:', err);
  }
  return { id, ...updates } as FinancialGoal;
}

export async function fetchReminders(): Promise<DailyReminder> {
  try {
    const res = await fetch(`${API_BASE}/reminders`);
    return await safeJsonParse<DailyReminder>(res, { enabled: true, time: '20:00', streakDays: 0 });
  } catch (err) {
    return { enabled: true, time: '20:00', streakDays: 0 };
  }
}

export async function saveReminders(reminder: Partial<DailyReminder>): Promise<DailyReminder> {
  const defaultReminder: DailyReminder = { enabled: true, time: '20:00', streakDays: 0, ...reminder };
  try {
    const res = await fetch(`${API_BASE}/reminders`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reminder),
    });
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim()) {
        const data = JSON.parse(text);
        if (data.reminders) return data.reminders;
      }
    }
  } catch (err) {
    console.warn('Error saving reminders:', err);
  }
  return defaultReminder;
}

export async function fetchSupabaseConfig(): Promise<SupabaseConfig> {
  const env = (import.meta as any).env || {};
  const saved = localStorage.getItem('dompetku_supabase_config');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        url: parsed.url || '',
        anonKey: parsed.anonKey || '',
        isConnected: Boolean(parsed.url && parsed.anonKey),
        lastSyncedAt: parsed.lastSyncedAt || new Date().toISOString(),
      };
    } catch {}
  }

  const envUrl = env.VITE_SUPABASE_URL || '';
  const envKey = env.VITE_SUPABASE_ANON_KEY || '';
  return {
    url: envUrl,
    anonKey: envKey,
    isConnected: Boolean(envUrl && envKey && envUrl !== 'https://your-project-id.supabase.co'),
    lastSyncedAt: new Date().toISOString(),
  };
}

export async function saveSupabaseConfig(config: { url: string; anonKey: string }): Promise<SupabaseConfig> {
  const updated: SupabaseConfig = {
    url: config.url.trim(),
    anonKey: config.anonKey.trim(),
    isConnected: Boolean(config.url.trim() && config.anonKey.trim()),
    lastSyncedAt: new Date().toISOString(),
  };
  localStorage.setItem('dompetku_supabase_config', JSON.stringify(updated));
  return updated;
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
  try {
    const res = await fetch(`${API_BASE}/ai/advisor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      try {
        const errJson = JSON.parse(text);
        if (errJson.error) throw new Error(errJson.error);
      } catch {}
      throw new Error(`Gagal menghubungi AI Server (${res.status})`);
    }
    const text = await res.text();
    if (!text || !text.trim()) throw new Error('Respon AI kosong.');
    const data = JSON.parse(text);
    if (data.error) throw new Error(data.error);
    return data.text || 'Tidak ada tanggapan dari AI.';
  } catch (err: any) {
    throw new Error(err.message || 'Layanan AI Gemini tidak dapat dijangkau saat ini.');
  }
}
