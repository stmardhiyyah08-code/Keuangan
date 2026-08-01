import React from 'react';
import {
  Settings,
  Moon,
  Sun,
  Database,
  Bell,
  Flame,
  User,
  ShieldCheck,
  Download,
  Upload,
  Sparkles,
} from 'lucide-react';
import { User as UserType, SupabaseConfig, DailyReminder } from '../types';

interface SettingsViewProps {
  currentUser: UserType;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  supabaseConfig: SupabaseConfig;
  onOpenSupabaseConfig: () => void;
  reminder: DailyReminder;
  onOpenReminders: () => void;
  onOpenUserModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  darkMode,
  onToggleDarkMode,
  supabaseConfig,
  onOpenSupabaseConfig,
  reminder,
  onOpenReminders,
  onOpenUserModal,
}) => {
  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Pengaturan & Sistem
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Kelola preferensi tampilan, notifikasi, pengingat harian, dan sinkronisasi cloud.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Profile Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 bg-white dark:bg-slate-900 border border-purple-200/80 dark:border-purple-800/50 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md shadow-purple-500/25">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {currentUser.name}
                </h3>
                <p className="text-xs text-slate-500">{currentUser.email}</p>
              </div>
            </div>
            <button
              onClick={onOpenUserModal}
              className="px-3.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-xs hover:bg-purple-100 dark:hover:bg-purple-900 transition"
            >
              Ganti Akun
            </button>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 border-t border-purple-100/60 dark:border-purple-950/40 pt-3">
            Mata Uang Utama: <strong className="text-slate-800 dark:text-slate-200">Rupiah (IDR - Rp)</strong>
          </div>
        </div>

        {/* Tampilan Dark Mode Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-500">
                {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6 text-slate-700" />}
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Mode Gelap (Dark Mode)
                </h3>
                <p className="text-xs text-slate-500">Kenyamanan mata saat malam hari</p>
              </div>
            </div>
            <button
              onClick={onToggleDarkMode}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                darkMode ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-800'
              }`}
            >
              {darkMode ? 'Mode Gelap Aktif 🌙' : 'Mode Terang ☀️'}
            </button>
          </div>
        </div>

        {/* Notifikasi Pengingat Harian */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Pengingat Transaksi Harian
                </h3>
                <p className="text-xs text-slate-500">
                  {reminder.enabled ? `Aktif jam ${reminder.time} WIB` : 'Non-aktif'}
                </p>
              </div>
            </div>
            <button
              onClick={onOpenReminders}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200"
            >
              Atur Pengingat
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Streak Pencatatan Rutin: {reminder.streakDays} Hari 🔥</span>
          </div>
        </div>

        {/* Database & Supabase Sync */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Status Database & Supabase
                </h3>
                <p className="text-xs text-slate-500">
                  {supabaseConfig.isConnected ? 'Supabase Terhubung ✅' : 'Database Lokal Aktif'}
                </p>
              </div>
            </div>
            <button
              onClick={onOpenSupabaseConfig}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-600 font-bold text-xs hover:bg-slate-200"
            >
              Konfigurasi DB
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
