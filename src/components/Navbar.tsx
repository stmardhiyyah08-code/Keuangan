import React from 'react';
import {
  Wallet,
  Plus,
  Moon,
  Sun,
  Flame,
  Database,
  Sparkles,
  RefreshCw,
  UserCheck,
  ChevronDown,
  Bell,
} from 'lucide-react';
import { User } from '../types';
import { formatCurrency } from '../lib/formatters';

interface NavbarProps {
  currentUser: User | null;
  users: User[];
  onSwitchUser: (user: User) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  streakDays: number;
  onOpenNewTransaction: () => void;
  onOpenAiAdvisor: () => void;
  onOpenSupabaseConfig: () => void;
  onOpenReminders: () => void;
  onOpenUserModal: () => void;
  totalBalance: number;
  isSyncing: boolean;
  onRefreshSync: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  darkMode,
  onToggleDarkMode,
  streakDays,
  onOpenNewTransaction,
  onOpenAiAdvisor,
  onOpenSupabaseConfig,
  onOpenReminders,
  onOpenUserModal,
  totalBalance,
  isSyncing,
  onRefreshSync,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-purple-100/80 dark:border-purple-950/50 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Logo & App Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 animate-pulse">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-300 dark:to-pink-400 bg-clip-text text-transparent">
                Dompetku
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-xs">
                PRO
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden sm:block">
              Keuangan & Laporan Real-Time
            </p>
          </div>
        </div>

        {/* Action Controls & User Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Realtime Sync Status Indicator */}
          <button
            onClick={onRefreshSync}
            title="Status Sinkronisasi Data Real-time"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-500 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          {/* Daily Streak Indicator */}
          <button
            onClick={onOpenReminders}
            title="Streak Pencatatan Transaksi Harian"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 text-amber-600 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/60 hover:scale-105 transition active:scale-95"
          >
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-bounce" />
            <span>{streakDays} Hari</span>
          </button>

          {/* AI Advisor Quick Button */}
          <button
            onClick={onOpenAiAdvisor}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-xs shadow-md shadow-purple-500/20 hover:opacity-95 hover:scale-105 active:scale-95 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Advisor</span>
          </button>

          {/* Supabase Button */}
          <button
            onClick={onOpenSupabaseConfig}
            title="Konfigurasi Supabase Cloud DB"
            className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition"
          >
            <Database className="w-4 h-4" />
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            title={darkMode ? 'Mode Terang' : 'Mode Gelap'}
            className="p-2 rounded-xl text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* Add Transaction Button */}
          <button
            onClick={onOpenNewTransaction}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/25 active:scale-95 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Transaksi Baru</span>
            <span className="sm:hidden">Catat</span>
          </button>

          {/* User Multi-Profile Dropdown Trigger */}
          <button
            onClick={onOpenUserModal}
            className="flex items-center gap-2 pl-2 pr-2 py-1 rounded-xl bg-gradient-to-r from-slate-100 to-purple-50 dark:from-slate-800 dark:to-purple-950 hover:border-purple-300 dark:hover:border-purple-700 border border-slate-200 dark:border-slate-700 transition"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-pink-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
              {currentUser ? currentUser.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">
                {currentUser ? currentUser.name : 'Daftar Akun'}
              </div>
              <div className="text-[10px] font-semibold text-purple-600 dark:text-purple-300">
                {formatCurrency(totalBalance)}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
