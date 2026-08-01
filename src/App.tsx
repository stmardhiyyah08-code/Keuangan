import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, TabType } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { ReportsView } from './components/ReportsView';
import { WalletsView } from './components/WalletsView';
import { BudgetsGoalsView } from './components/BudgetsGoalsView';
import { SettingsView } from './components/SettingsView';
import { AiAdvisorModal } from './components/AiAdvisorModal';
import { ReminderSettingsModal } from './components/ReminderSettingsModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { AuthModal } from './components/AuthModal';
import { LoginPage } from './components/LoginPage';

import {
  User,
  Transaction,
  Account,
  Category,
  Budget,
  FinancialGoal,
  DailyReminder,
  SupabaseConfig,
} from './types';

import {
  fetchUsers,
  loginUser,
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  fetchAccounts,
  createAccount,
  transferBetweenAccounts,
  fetchCategories,
  fetchBudgets,
  saveBudget,
  fetchGoals,
  createGoal,
  updateGoal,
  fetchReminders,
  saveReminders,
  fetchSupabaseConfig,
  saveSupabaseConfig,
} from './lib/api';

import { setupDailyReminderCheck, sendLocalNotification } from './lib/notifications';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // User & Auth State
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('dompetku_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // App Data States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [reminder, setReminder] = useState<DailyReminder>({
    enabled: true,
    time: '20:00',
    streakDays: 0,
  });
  const [supabaseConfig, setSupabaseConfigState] = useState<SupabaseConfig>({
    url: '',
    anonKey: '',
    isConnected: false,
  });

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('dompetku_dark_mode');
    return saved ? JSON.parse(saved) : false;
  });

  // Real-time Sync State
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modals States
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('dompetku_dark_mode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Load initial app data
  const loadAppData = async (targetUser?: User | null) => {
    setIsSyncing(true);
    try {
      const uList = await fetchUsers();
      setUsers(uList);

      let activeUser = targetUser !== undefined ? targetUser : currentUser;

      if (!activeUser) {
        const [catList, remData, spData] = await Promise.all([
          fetchCategories(),
          fetchReminders(),
          fetchSupabaseConfig(),
        ]);
        setCategories(catList);
        setReminder(remData);
        setSupabaseConfigState(spData);
        setTransactions([]);
        setAccounts([]);
        setBudgets([]);
        setGoals([]);
        return;
      }

      setCurrentUser(activeUser);
      localStorage.setItem('dompetku_current_user', JSON.stringify(activeUser));

      const [txList, accList, catList, bgtList, goalList, remData, spData] =
        await Promise.all([
          fetchTransactions(activeUser.id),
          fetchAccounts(activeUser.id),
          fetchCategories(),
          fetchBudgets(activeUser.id),
          fetchGoals(activeUser.id),
          fetchReminders(),
          fetchSupabaseConfig(),
        ]);

      setTransactions(txList);
      setAccounts(accList);
      setCategories(catList);
      setBudgets(bgtList);
      setGoals(goalList);
      setReminder(remData);
      setSupabaseConfigState(spData);
    } catch (err) {
      console.error('Error loading app data:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadAppData(currentUser);

    // Setup real-time polling sync interval
    const syncInterval = setInterval(() => {
      if (currentUser?.id) {
        fetchTransactions(currentUser.id).then((txs) => setTransactions(txs));
        fetchAccounts(currentUser.id).then((accs) => setAccounts(accs));
      }
    }, 10000);

    return () => clearInterval(syncInterval);
  }, [currentUser?.id]);

  // Setup Daily Reminder Scheduler
  useEffect(() => {
    if (reminder.enabled && reminder.time) {
      const cleanup = setupDailyReminderCheck(reminder.time, () => {
        sendLocalNotification('Waktunya Mencatat Keuangan! 📝', {
          body: 'Buka Dompetku dan catat pengeluaran atau pemasukan Anda hari ini agar catatan saldo tetap akurat!',
        });
      });
      return cleanup;
    }
  }, [reminder.enabled, reminder.time]);

  // Total balance calculation
  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

  // Handlers for Transactions
  const handleCreateTransaction = async (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    setIsSyncing(true);
    try {
      const res = await createTransaction(txData);
      setTransactions((prev) => [res.transaction, ...prev]);
      if (res.accounts) setAccounts(res.accounts);
    } catch (err) {
      console.error('Failed to create transaction:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateTransaction = async (id: string, updates: Partial<Transaction>) => {
    setIsSyncing(true);
    try {
      const updated = await updateTransaction(id, updates);
      setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
      loadAppData(currentUser); // Refresh balances
    } catch (err) {
      console.error('Failed to update transaction:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    setIsSyncing(true);
    try {
      const res = await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      if (res.accounts) setAccounts(res.accounts);
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handlers for Accounts & Transfers
  const handleCreateAccount = async (accData: Omit<Account, 'id'>) => {
    setIsSyncing(true);
    try {
      const newAcc = await createAccount(accData);
      setAccounts((prev) => [...prev, newAcc]);
    } catch (err) {
      console.error('Failed to create account:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTransfer = async (payload: {
    userId: string;
    sourceAccountId: string;
    targetAccountId: string;
    amount: number;
    description: string;
    date: string;
  }) => {
    setIsSyncing(true);
    try {
      const res = await transferBetweenAccounts(payload);
      setTransactions((prev) => [res.transaction, ...prev]);
      if (res.accounts) setAccounts(res.accounts);
    } catch (err) {
      console.error('Failed to transfer between accounts:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handlers for Budgets
  const handleSaveBudget = async (bgtData: Omit<Budget, 'id'>) => {
    setIsSyncing(true);
    try {
      const updatedBudgets = await saveBudget(bgtData);
      setBudgets(updatedBudgets);
    } catch (err) {
      console.error('Failed to save budget:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handlers for Goals
  const handleCreateGoal = async (goalData: Omit<FinancialGoal, 'id'>) => {
    setIsSyncing(true);
    try {
      const newGoal = await createGoal(goalData);
      setGoals((prev) => [...prev, newGoal]);
    } catch (err) {
      console.error('Failed to create goal:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateGoal = async (id: string, updates: Partial<FinancialGoal>) => {
    setIsSyncing(true);
    try {
      const updated = await updateGoal(id, updates);
      setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
    } catch (err) {
      console.error('Failed to update goal:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handlers for User Switching / Login / Logout
  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    loadAppData(user);
  };

  const handleLoginOrCreate = async (email: string, name?: string) => {
    const user = await loginUser(email, name);
    setCurrentUser(user);
    loadAppData(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('dompetku_current_user');
    setCurrentUser(null);
    setTransactions([]);
    setAccounts([]);
    setBudgets([]);
    setGoals([]);
  };

  // Render Full-page LoginPage if user is not logged in
  if (!currentUser) {
    return (
      <LoginPage
        onLoginOrCreate={handleLoginOrCreate}
      />
    );
  }

  // Handlers for Reminders & Supabase
  const handleSaveReminder = async (remData: Partial<DailyReminder>) => {
    const updated = await saveReminders(remData);
    setReminder(updated);
  };

  const handleSaveSupabaseConfig = async (cfg: { url: string; anonKey: string }) => {
    const updated = await saveSupabaseConfig(cfg);
    setSupabaseConfigState(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        users={users}
        onSwitchUser={handleSwitchUser}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        streakDays={reminder.streakDays || 0}
        onOpenNewTransaction={() => setActiveTab('transactions')}
        onOpenAiAdvisor={() => setIsAiModalOpen(true)}
        onOpenSupabaseConfig={() => setIsSupabaseModalOpen(true)}
        onOpenReminders={() => setIsReminderModalOpen(true)}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        totalBalance={totalBalance}
        isSyncing={isSyncing}
        onRefreshSync={() => loadAppData(currentUser)}
      />

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto flex">
        {/* Desktop Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'ai') {
              setIsAiModalOpen(true);
            } else {
              setActiveTab(tab);
            }
          }}
          streakDays={reminder.streakDays || 0}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden">
          {activeTab === 'dashboard' && (
            <DashboardView
              currentUser={currentUser}
              transactions={transactions}
              accounts={accounts}
              categories={categories}
              budgets={budgets}
              onOpenNewTransaction={() => setActiveTab('transactions')}
              onOpenAiAdvisor={() => setIsAiModalOpen(true)}
              onSelectTab={setActiveTab}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              currentUser={currentUser}
              transactions={transactions}
              accounts={accounts}
              categories={categories}
              onCreateTransaction={handleCreateTransaction}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onOpenAiScanReceipt={(imgData) => setIsAiModalOpen(true)}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              currentUser={currentUser}
              transactions={transactions}
              categories={categories}
              accounts={accounts}
            />
          )}

          {activeTab === 'wallets' && (
            <WalletsView
              currentUser={currentUser}
              accounts={accounts}
              onCreateAccount={handleCreateAccount}
              onTransfer={handleTransfer}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetsGoalsView
              currentUser={currentUser}
              budgets={budgets}
              goals={goals}
              categories={categories}
              transactions={transactions}
              onSaveBudget={handleSaveBudget}
              onCreateGoal={handleCreateGoal}
              onUpdateGoal={handleUpdateGoal}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              currentUser={currentUser}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
              supabaseConfig={supabaseConfig}
              onOpenSupabaseConfig={() => setIsSupabaseModalOpen(true)}
              reminder={reminder}
              onOpenReminders={() => setIsReminderModalOpen(true)}
              onOpenUserModal={() => setIsUserModalOpen(true)}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'ai') {
            setIsAiModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
      />

      {/* Modals */}
      <AiAdvisorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        transactions={transactions}
        accounts={accounts}
      />

      <ReminderSettingsModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        reminder={reminder}
        onSaveReminder={handleSaveReminder}
      />

      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        config={supabaseConfig}
        onSaveConfig={handleSaveSupabaseConfig}
      />

      <AuthModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        users={users}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onLoginOrCreate={handleLoginOrCreate}
        onLogout={handleLogout}
      />
    </div>
  );
}
