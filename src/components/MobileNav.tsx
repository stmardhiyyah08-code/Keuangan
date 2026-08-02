import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  BarChart3,
  WalletCards,
  Target,
  Settings,
} from 'lucide-react';
import { TabType } from './Sidebar';

interface MobileNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Ikhtisar', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'transactions', label: 'Transaksi', icon: <ReceiptText className="w-5 h-5" /> },
    { id: 'reports', label: 'Grafik', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'wallets', label: 'Dompet', icon: <WalletCards className="w-5 h-5" /> },
    { id: 'budgets', label: 'Anggaran', icon: <Target className="w-5 h-5" /> },
    { id: 'settings', label: 'Pengaturan', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800/90 px-1 py-1.5 flex items-center justify-around shadow-2xl">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-1.5 sm:px-2.5 rounded-xl transition-all duration-150 ${
              isActive
                ? 'text-purple-600 dark:text-purple-400 font-extrabold scale-105 bg-purple-50/80 dark:bg-purple-950/40'
                : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className={isActive ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500'}>
              {tab.icon}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
