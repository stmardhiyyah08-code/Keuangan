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
import { getSupabaseClient } from './supabase';
import { DEFAULT_CATEGORIES } from './constants';

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

// --------------------------------------------------------------------
// 1. USER & AUTHENTICATION
// --------------------------------------------------------------------
export async function fetchUsers(): Promise<User[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data) {
        return data.map((p: any) => ({
          id: p.id,
          name: p.name,
          email: p.email,
          currency: p.currency || 'IDR',
          darkMode: p.dark_mode || false,
          createdAt: p.created_at,
        }));
      }
    } catch (e) {
      console.warn('Supabase fetchUsers error:', e);
    }
  }

  try {
    const res = await fetch(`${API_BASE}/users`);
    return await safeJsonParse<User[]>(res, []);
  } catch (err) {
    console.warn('API error, returning empty users list:', err);
    return [];
  }
}

export async function loginUser(email: string, name?: string): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const displayName = name ? name.trim() : cleanEmail.split('@')[0];

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .single();

      if (existing) {
        return {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          currency: existing.currency || 'IDR',
          darkMode: existing.dark_mode || false,
          createdAt: existing.created_at,
        };
      }

      const newId = 'user-' + Date.now();
      const { data: created, error } = await supabase
        .from('profiles')
        .insert([{ id: newId, email: cleanEmail, name: displayName, currency: 'IDR' }])
        .select()
        .single();

      if (!error && created) {
        return {
          id: created.id,
          name: created.name,
          email: created.email,
          currency: created.currency || 'IDR',
          darkMode: created.dark_mode || false,
          createdAt: created.created_at,
        };
      }
    } catch (e) {
      console.warn('Supabase loginUser failed, fallback to local:', e);
    }
  }

  try {
    const res = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, name: displayName }),
    });

    if (res.ok) {
      const text = await res.text();
      if (text && text.trim()) {
        const data = JSON.parse(text);
        if (data && data.user) return data.user;
      }
    }
  } catch (err) {
    console.warn('Login server failed, generating local session:', err);
  }

  return {
    id: 'user-' + Date.now(),
    name: displayName,
    email: cleanEmail,
    currency: 'IDR',
    darkMode: false,
    createdAt: new Date().toISOString(),
  };
}

// --------------------------------------------------------------------
// 2. ACCOUNTS / WALLETS
// --------------------------------------------------------------------
export async function fetchAccounts(userId: string): Promise<Account[]> {
  if (!userId) return [];

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId);

      if (!error && data) {
        let mapped = data.map((a: any) => ({
          id: a.id,
          userId: a.user_id,
          name: a.name,
          type: a.type,
          balance: Number(a.balance),
          accountNumber: a.account_number,
          icon: a.icon,
          color: a.color,
          isDefault: a.is_default,
        }));

        if (mapped.length === 0) {
          // Initialize default initial accounts for new user in Supabase
          const initAccs = [
            { id: 'acc-1-' + Date.now(), user_id: userId, name: 'Uang Tunai (Dompet)', type: 'cash', balance: 0, icon: 'Wallet', color: '#10B981', is_default: true },
            { id: 'acc-2-' + Date.now(), user_id: userId, name: 'Bank BCA', type: 'bank', balance: 0, icon: 'Building2', color: '#2563EB' }
          ];
          await supabase.from('accounts').insert(initAccs);
          return initAccs.map((a) => ({
            id: a.id,
            userId: a.user_id,
            name: a.name,
            type: a.type as any,
            balance: a.balance,
            icon: a.icon,
            color: a.color,
            isDefault: a.is_default,
          }));
        }

        return mapped;
      }
    } catch (e) {
      console.warn('Supabase fetchAccounts error:', e);
    }
  }

  try {
    const res = await fetch(`${API_BASE}/accounts?userId=${encodeURIComponent(userId)}`);
    const accs = await safeJsonParse<Account[]>(res, []);
    if (accs.length === 0) {
      // Auto-create initial default account for new local user
      const defaultAcc = await createAccount({
        userId,
        name: 'Uang Tunai (Dompet)',
        type: 'cash',
        balance: 0,
        icon: 'Wallet',
        color: '#10B981',
        isDefault: true,
      });
      return [defaultAcc];
    }
    return accs;
  } catch (err) {
    console.warn('Error fetching accounts:', err);
    return [];
  }
}

export async function createAccount(acc: Omit<Account, 'id'>): Promise<Account> {
  const newId = 'acc-' + Date.now();
  const localAcc: Account = { ...acc, id: newId };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert([{
          id: newId,
          user_id: acc.userId,
          name: acc.name,
          type: acc.type,
          balance: acc.balance,
          account_number: acc.accountNumber,
          icon: acc.icon,
          color: acc.color,
          is_default: acc.isDefault,
        }])
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          userId: data.user_id,
          name: data.name,
          type: data.type,
          balance: Number(data.balance),
          accountNumber: data.account_number,
          icon: data.icon,
          color: data.color,
          isDefault: data.is_default,
        };
      }
    } catch (e) {
      console.warn('Supabase createAccount error:', e);
    }
  }

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

// --------------------------------------------------------------------
// 3. TRANSACTIONS
// --------------------------------------------------------------------
export async function fetchTransactions(userId: string): Promise<Transaction[]> {
  if (!userId) return [];

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (!error && data) {
        return data.map((t: any) => ({
          id: t.id,
          userId: t.user_id,
          accountId: t.account_id,
          targetAccountId: t.target_account_id,
          categoryId: t.category_id,
          type: t.type,
          amount: Number(t.amount),
          date: t.date,
          time: t.time,
          description: t.description,
          tags: t.tags || [],
          createdAt: t.created_at,
        }));
      }
    } catch (e) {
      console.warn('Supabase fetchTransactions error:', e);
    }
  }

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
  const newId = 'tx-' + Date.now();
  const localTx: Transaction = {
    ...tx,
    id: newId,
    createdAt: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          id: newId,
          user_id: tx.userId,
          account_id: tx.accountId,
          target_account_id: tx.targetAccountId,
          category_id: tx.categoryId,
          type: tx.type,
          amount: tx.amount,
          date: tx.date,
          time: tx.time,
          description: tx.description,
          tags: tx.tags,
        }])
        .select()
        .single();

      if (!error && data) {
        // Fetch updated accounts
        const updatedAccounts = await fetchAccounts(tx.userId);
        return {
          transaction: {
            id: data.id,
            userId: data.user_id,
            accountId: data.account_id,
            targetAccountId: data.target_account_id,
            categoryId: data.category_id,
            type: data.type,
            amount: Number(data.amount),
            date: data.date,
            time: data.time,
            description: data.description,
            tags: data.tags || [],
            createdAt: data.created_at,
          },
          accounts: updatedAccounts,
        };
      }
    } catch (e) {
      console.warn('Supabase createTransaction error:', e);
    }
  }

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
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const dbUpdates: any = {};
      if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.date !== undefined) dbUpdates.date = updates.date;
      if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
      if (updates.accountId !== undefined) dbUpdates.account_id = updates.accountId;

      const { data, error } = await supabase
        .from('transactions')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          userId: data.user_id,
          accountId: data.account_id,
          targetAccountId: data.target_account_id,
          categoryId: data.category_id,
          type: data.type,
          amount: Number(data.amount),
          date: data.date,
          time: data.time,
          description: data.description,
          tags: data.tags || [],
          createdAt: data.created_at,
        };
      }
    } catch (e) {
      console.warn('Supabase updateTransaction error:', e);
    }
  }

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
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('transactions').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase deleteTransaction error:', e);
    }
  }

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

// --------------------------------------------------------------------
// 4. CATEGORIES
// --------------------------------------------------------------------
export async function fetchCategories(): Promise<Category[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('categories').select('*');
      if (!error && data && data.length > 0) {
        return data.map((c: any) => ({
          id: c.id,
          userId: c.user_id,
          name: c.name,
          type: c.type,
          icon: c.icon,
          color: c.color,
          isDefault: c.is_default,
        }));
      }
    } catch (e) {
      console.warn('Supabase fetchCategories error:', e);
    }
  }

  try {
    const res = await fetch(`${API_BASE}/categories`);
    const list = await safeJsonParse<Category[]>(res, []);
    if (list && list.length > 0) return list;
  } catch (err) {
    console.warn('Error fetching categories from API:', err);
  }

  return DEFAULT_CATEGORIES;
}

// --------------------------------------------------------------------
// 5. BUDGETS
// --------------------------------------------------------------------
export async function fetchBudgets(userId: string): Promise<Budget[]> {
  if (!userId) return [];

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId);

      if (!error && data) {
        return data.map((b: any) => ({
          id: b.id,
          userId: b.user_id,
          categoryId: b.category_id,
          monthlyLimit: Number(b.monthly_limit),
          monthYear: b.month_year,
        }));
      }
    } catch (e) {
      console.warn('Supabase fetchBudgets error:', e);
    }
  }

  try {
    const res = await fetch(`${API_BASE}/budgets?userId=${encodeURIComponent(userId)}`);
    return await safeJsonParse<Budget[]>(res, []);
  } catch (err) {
    return [];
  }
}

export async function saveBudget(budget: Omit<Budget, 'id'>): Promise<Budget[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const newId = 'bgt-' + Date.now();
      await supabase.from('budgets').upsert([{
        id: newId,
        user_id: budget.userId,
        category_id: budget.categoryId,
        monthly_limit: budget.monthlyLimit,
        month_year: budget.monthYear,
      }]);
      return await fetchBudgets(budget.userId);
    } catch (e) {
      console.warn('Supabase saveBudget error:', e);
    }
  }

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

// --------------------------------------------------------------------
// 6. GOALS
// --------------------------------------------------------------------
export async function fetchGoals(userId: string): Promise<FinancialGoal[]> {
  if (!userId) return [];

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId);

      if (!error && data) {
        return data.map((g: any) => ({
          id: g.id,
          userId: g.user_id,
          title: g.title,
          targetAmount: Number(g.target_amount),
          currentAmount: Number(g.current_amount),
          targetDate: g.target_date,
          category: g.category,
          icon: g.icon,
          color: g.color,
        }));
      }
    } catch (e) {
      console.warn('Supabase fetchGoals error:', e);
    }
  }

  try {
    const res = await fetch(`${API_BASE}/goals?userId=${encodeURIComponent(userId)}`);
    return await safeJsonParse<FinancialGoal[]>(res, []);
  } catch (err) {
    return [];
  }
}

export async function createGoal(goal: Omit<FinancialGoal, 'id'>): Promise<FinancialGoal> {
  const newId = 'goal-' + Date.now();
  const localGoal: FinancialGoal = { ...goal, id: newId };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('goals')
        .insert([{
          id: newId,
          user_id: goal.userId,
          title: goal.title,
          target_amount: goal.targetAmount,
          current_amount: goal.currentAmount,
          target_date: goal.targetDate,
          category: goal.category,
          icon: goal.icon,
          color: goal.color,
        }])
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          userId: data.user_id,
          title: data.title,
          targetAmount: Number(data.target_amount),
          currentAmount: Number(data.current_amount),
          targetDate: data.target_date,
          category: data.category,
          icon: data.icon,
          color: data.color,
        };
      }
    } catch (e) {
      console.warn('Supabase createGoal error:', e);
    }
  }

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
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const dbUpdates: any = {};
      if (updates.currentAmount !== undefined) dbUpdates.current_amount = updates.currentAmount;
      if (updates.targetAmount !== undefined) dbUpdates.target_amount = updates.targetAmount;
      if (updates.title !== undefined) dbUpdates.title = updates.title;

      const { data, error } = await supabase
        .from('goals')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          userId: data.user_id,
          title: data.title,
          targetAmount: Number(data.target_amount),
          currentAmount: Number(data.current_amount),
          targetDate: data.target_date,
          category: data.category,
          icon: data.icon,
          color: data.color,
        };
      }
    } catch (e) {
      console.warn('Supabase updateGoal error:', e);
    }
  }

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

// --------------------------------------------------------------------
// 7. REMINDERS & CONFIG
// --------------------------------------------------------------------
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
