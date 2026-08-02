import React from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Receipt,
  Flame,
  ShieldCheck,
  Building2,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Transaction, Account, Category, Budget, User } from '../types';
import { formatCurrency, formatDateIndonesian } from '../lib/formatters';

interface DashboardViewProps {
  currentUser: User | null;
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  budgets: Budget[];
  onOpenNewTransaction: () => void;
  onSelectTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  transactions,
  accounts,
  categories,
  budgets,
  onOpenNewTransaction,
  onSelectTab,
}) => {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  // Calculate totals
  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

  // Filter current month transactions
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const currentMonthTxs = transactions.filter((t) => t.date.startsWith(currentMonthPrefix));

  const currentMonthIncome = currentMonthTxs
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const currentMonthExpense = currentMonthTxs
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const netSavings = currentMonthIncome - currentMonthExpense;
  const savingsRate = currentMonthIncome > 0 ? Math.round((netSavings / currentMonthIncome) * 100) : 0;

  // Financial Health Status
  let healthLabel = 'Sangat Sehat 🌟';
  let healthColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300';
  if (savingsRate < 0) {
    healthLabel = 'Defisit (Pengeluaran > Pemasukan) ⚠️';
    healthColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300';
  } else if (savingsRate < 20) {
    healthLabel = 'Waspada (Tabungan Rendah) 📊';
    healthColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300';
  }

  // Monthly Cashflow Trend chart data
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const chartData = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(now.getMonth() - i);
    const mPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const mLabel = monthNames[d.getMonth()];

    const mIn = transactions
      .filter((t) => t.date.startsWith(mPrefix) && t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);

    const mOut = transactions
      .filter((t) => t.date.startsWith(mPrefix) && t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);

    chartData.push({
      month: mLabel,
      Pemasukan: mIn,
      Pengeluaran: mOut,
    });
  }

  // Category Expense Donut Chart data
  const categoryExpenseTotals: { [key: string]: number } = {};
  currentMonthTxs
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const cat = categoryMap.get(t.categoryId);
      const catName = cat ? cat.name : 'Lain-lain';
      categoryExpenseTotals[catName] = (categoryExpenseTotals[catName] || 0) + t.amount;
    });

  const pieData = Object.keys(categoryExpenseTotals).map((catName) => {
    const cat = categories.find((c) => c.name === catName);
    return {
      name: catName,
      value: categoryExpenseTotals[catName],
      color: cat?.color || '#3B82F6',
    };
  });

  // Check budget limits warnings
  const budgetAlerts = budgets.map((b) => {
    const spent = currentMonthTxs
      .filter((t) => t.categoryId === b.categoryId && t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    const category = categoryMap.get(b.categoryId);
    const percent = b.monthlyLimit > 0 ? Math.round((spent / b.monthlyLimit) * 100) : 0;
    return {
      category,
      monthlyLimit: b.monthlyLimit,
      spent,
      percent,
    };
  }).filter((b) => b.percent >= 75);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 sm:p-8 shadow-xl shadow-purple-600/20">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-pink-500/30 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 rounded-full bg-indigo-500/30 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-white/20 backdrop-blur-md text-white shadow-xs">
                Halo, {currentUser?.name || 'Pengguna'} 👋
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-black border ${healthColor}`}>
                {healthLabel}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-xs">
              Ringkasan Keuangan Anda
            </h1>
            <p className="text-purple-100/90 text-sm leading-relaxed font-medium">
              Pantau arus kas, batas anggaran, dan tabungan Anda secara real-time dari satu tempat yang nyaman.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenNewTransaction}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-teal-500/30 active:scale-95 hover:scale-105 transition"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Catat Transaksi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Budget Alerts Banner if any */}
      {budgetAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-black text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 animate-bounce" />
            <span>Peringatan Anggaran Bulanan!</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {budgetAlerts.map((ba, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/50 backdrop-blur-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">{ba.category?.name}</span>
                <span className={`font-black ${ba.percent >= 100 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {ba.percent}% Terpakai ({formatCurrency(ba.spent)} / {formatCurrency(ba.monthlyLimit)})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Saldo */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-indigo-100 dark:border-indigo-950/50 shadow-sm hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Total Saldo Semua Rekening
            </span>
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
            {formatCurrency(totalBalance)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Tersebar di {accounts.length} Rekening/Dompet</span>
          </div>
        </div>

        {/* Pemasukan Bulan Ini */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-emerald-100 dark:border-emerald-950/50 shadow-sm hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Pemasukan Bulan Ini
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300 shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight mb-1">
            +{formatCurrency(currentMonthIncome)}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
            <span>Pemasukan Terverifikasi</span>
          </div>
        </div>

        {/* Pengeluaran Bulan Ini */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-rose-100 dark:border-rose-950/50 shadow-sm hover:shadow-lg hover:border-rose-300 dark:hover:border-rose-700 transition duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Pengeluaran Bulan Ini
            </span>
            <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300 shadow-xs">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight mb-1">
            -{formatCurrency(currentMonthExpense)}
          </div>
          <div className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5 stroke-[3]" />
            <span>Total Pengeluaran Rutin</span>
          </div>
        </div>

        {/* Rasio Tabungan */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-purple-100 dark:border-purple-950/50 shadow-sm hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700 transition duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              Sisa/Tabungan Bersih
            </span>
            <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300 shadow-xs">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-black tracking-tight mb-1 ${netSavings >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-rose-600'}`}>
            {formatCurrency(netSavings)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center justify-between">
            <span>Rasio Tabungan:</span>
            <span className="font-black text-purple-600 dark:text-purple-400">{savingsRate}%</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Arus Kas Chart */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-purple-100/60 dark:border-purple-950/40 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                Tren Arus Kas 6 Bulan Terakhir
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Perbandingan pemasukan vs pengeluaran bulanan
              </p>
            </div>
            <button
              onClick={() => onSelectTab('reports')}
              className="text-xs font-black text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
            >
              <span>Lihat Detail Laporan</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EC4899" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#EC4899" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `Rp${val / 1000000}JT`}
                />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), '']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    color: '#FFF',
                    borderRadius: '16px',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Pemasukan"
                  stroke="#10B981"
                  strokeWidth={3.5}
                  fillOpacity={1}
                  fill="url(#incomeGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="Pengeluaran"
                  stroke="#EC4899"
                  strokeWidth={3.5}
                  fillOpacity={1}
                  fill="url(#expenseGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut Chart */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-purple-100/60 dark:border-purple-950/40 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white mb-1">
              Pengeluaran per Kategori
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4">
              Distribusi pengeluaran bulan ini
            </p>

            {pieData.length > 0 ? (
              <div className="h-52 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => formatCurrency(Number(val))}
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        color: '#FFF',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-52 flex items-center justify-center text-xs text-slate-400 font-medium">
                Belum ada pengeluaran dicatat bulan ini.
              </div>
            )}
          </div>

          <div className="space-y-2 mt-2 max-h-36 overflow-y-auto pr-1">
            {pieData.slice(0, 4).map((p, i) => (
              <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shadow-xs" style={{ backgroundColor: p.color }} />
                  <span className="font-bold text-slate-700 dark:text-slate-200">{p.name}</span>
                </div>
                <span className="font-black text-slate-900 dark:text-white">{formatCurrency(p.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-purple-100/60 dark:border-purple-950/40 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
              Transaksi Terakhir
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Aktivitas pencatatan keuangan terbaru Anda
            </p>
          </div>
          <button
            onClick={() => onSelectTab('transactions')}
            className="text-xs font-black text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
          >
            <span>Lihat Semua ({transactions.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-purple-50 dark:divide-purple-950/40">
          {transactions.slice(0, 5).map((t) => {
            const isIncome = t.type === 'income';
            const isExpense = t.type === 'expense';
            const cat = categoryMap.get(t.categoryId);
            const acc = accountMap.get(t.accountId);

            return (
              <div key={t.id} className="py-3 flex items-center justify-between gap-3 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 px-2 rounded-2xl transition">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shrink-0 shadow-md`}
                    style={{ backgroundColor: cat?.color || '#a855f7' }}
                  >
                    {isIncome ? <ArrowUpRight className="w-5 h-5 stroke-[2.5]" /> : isExpense ? <ArrowDownRight className="w-5 h-5 stroke-[2.5]" /> : <Wallet className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {t.description || cat?.name || 'Transaksi'}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>{cat?.name}</span>
                      <span>•</span>
                      <span>{acc?.name}</span>
                      <span>•</span>
                      <span>{formatDateIndonesian(t.date)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-black text-sm sm:text-base ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : isExpense ? 'text-pink-600 dark:text-pink-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                    {isIncome ? '+' : isExpense ? '-' : ''}
                    {formatCurrency(t.amount)}
                  </div>
                  {t.tags && t.tags.length > 0 && (
                    <div className="text-[10px] text-purple-600 dark:text-purple-400 font-extrabold uppercase">
                      #{t.tags.join(', #')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
