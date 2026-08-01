import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  BarChart3,
  WalletCards,
  Target,
  Sparkles,
  Settings,
  Bell,
  Database,
  Flame,
} from 'lucide-react';

export type TabType = 'dashboard' | 'transactions' | 'reports' | 'wallets' | 'budgets' | 'ai' | 'settings';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  streakDays: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, streakDays }) => {
  const menuItems: { id: TabType; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'dashboard',
      label: 'Ikhtisar Utama',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'transactions',
      label: 'Daftar Transaksi',
      icon: <ReceiptText className="w-5 h-5" />,
    },
    {
      id: 'reports',
      label: 'Laporan Grafik',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      id: 'wallets',
      label: 'Dompet & Rekening',
      icon: <WalletCards className="w-5 h-5" />,
    },
    {
      id: 'budgets',
      label: 'Anggaran & Tabungan',
      icon: <Target className="w-5 h-5" />,
    },
    {
      id: 'ai',
      label: 'Penasihat AI Gemini',
      icon: <Sparkles className="w-5 h-5 text-amber-300" />,
      badge: 'AI',
    },
    {
      id: 'settings',
      label: 'Pengaturan & Cloud',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-purple-100/60 dark:border-purple-950/40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-4 shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-black uppercase tracking-wider text-purple-600/70 dark:text-purple-400/70">
          Menu Utama
        </div>

        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-purple-50/80 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-white' : 'text-purple-500 dark:text-purple-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xs'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer Widget - Daily Reminder Status */}
      <div className="mt-auto pt-6">
        <div className="p-4 rounded-3xl bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50/60 dark:from-slate-800/80 dark:via-purple-950/30 dark:to-slate-900/80 border border-purple-200/60 dark:border-purple-800/40 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-bounce" />
            <span className="font-extrabold text-xs text-slate-900 dark:text-white">
              Pengingat Harian
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3 font-medium">
            Pencatatan rutin menjaga saldo Anda tetap akurat & terpantau!
          </p>
          <div className="flex items-center justify-between text-xs font-black text-amber-700 dark:text-amber-300 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-950/60 dark:to-orange-950/60 px-3 py-2 rounded-xl border border-amber-200/80 dark:border-amber-800/50">
            <span>Streak Pencatatan:</span>
            <span className="text-orange-600 dark:text-orange-400">{streakDays} Hari 🔥</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
