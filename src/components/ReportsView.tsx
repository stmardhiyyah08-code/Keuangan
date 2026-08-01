import React, { useState } from 'react';
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  FileText,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Download,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { Transaction, Category, Account, User } from '../types';
import { formatCurrency, formatDateIndonesian } from '../lib/formatters';
import { exportToCSV, exportToPDFReport } from '../lib/exportUtils';

interface ReportsViewProps {
  currentUser: User | null;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  currentUser,
  transactions,
  categories,
  accounts,
}) => {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const [period, setPeriod] = useState<'this_month' | 'last_month' | 'last_3_months' | 'this_year'>('this_month');

  // Filter transactions based on selected period
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const filteredTransactions = transactions.filter((t) => {
    const tDate = new Date(t.date);
    if (period === 'this_month') {
      return tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth;
    } else if (period === 'last_month') {
      const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
      return tDate.getFullYear() === lastMonthDate.getFullYear() && tDate.getMonth() === lastMonthDate.getMonth();
    } else if (period === 'last_3_months') {
      const threeMonthsAgo = new Date(currentYear, currentMonth - 2, 1);
      return tDate >= threeMonthsAgo;
    } else if (period === 'this_year') {
      return tDate.getFullYear() === currentYear;
    }
    return true;
  });

  // Calculate totals
  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const netCashFlow = totalIncome - totalExpense;
  const savingsRatio = totalIncome > 0 ? Math.round((netCashFlow / totalIncome) * 100) : 0;

  // Category Breakdown Data
  const categoryExpenseTotals: { [key: string]: number } = {};
  filteredTransactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const cat = categoryMap.get(t.categoryId);
      const catName = cat ? cat.name : 'Lain-lain';
      categoryExpenseTotals[catName] = (categoryExpenseTotals[catName] || 0) + t.amount;
    });

  const pieData = Object.keys(categoryExpenseTotals)
    .map((catName) => {
      const cat = categories.find((c) => c.name === catName);
      return {
        name: catName,
        value: categoryExpenseTotals[catName],
        color: cat?.color || '#3B82F6',
        percentage: totalExpense > 0 ? Math.round((categoryExpenseTotals[catName] / totalExpense) * 100) : 0,
      };
    })
    .sort((a, b) => b.value - a.value);

  // Income vs Expense Monthly Bar Chart Data
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const barChartData = [];

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

    barChartData.push({
      month: mLabel,
      Pemasukan: mIn,
      Pengeluaran: mOut,
    });
  }

  // Export handlers
  const handleExportCSV = () => {
    exportToCSV(filteredTransactions, categories, accounts, `Laporan_Grafik_${period}.csv`);
  };

  const handleExportPDF = () => {
    const periodTitles = {
      this_month: 'Bulan Ini',
      last_month: 'Bulan Lalu',
      last_3_months: '3 Bulan Terakhir',
      this_year: 'Tahun Ini',
    };
    exportToPDFReport(filteredTransactions, categories, accounts, currentUser, periodTitles[period]);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Laporan & Grafik Intuitif
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Visualisasi mendalam arus kas, pola pengeluaran, dan tren finansial Anda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold text-xs hover:bg-emerald-100 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-md shadow-blue-600/20 transition"
          >
            <FileText className="w-4 h-4" />
            <span>Cetak PDF Laporan</span>
          </button>
        </div>
      </div>

      {/* Period Selection Bar */}
      <div className="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto p-1">
          {[
            { id: 'this_month', label: 'Bulan Ini' },
            { id: 'last_month', label: 'Bulan Lalu' },
            { id: 'last_3_months', label: '3 Bulan Terakhir' },
            { id: 'this_year', label: 'Tahun Ini' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                period === p.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 px-3 font-semibold">
          Data Terfilter: {filteredTransactions.length} Transaksi
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
          <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-1">
            Total Pemasukan
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            +{formatCurrency(totalIncome)}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-pink-500/10 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800/50 shadow-sm">
          <span className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider block mb-1">
            Total Pengeluaran
          </span>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
            -{formatCurrency(totalExpense)}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/50 shadow-sm">
          <span className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block mb-1">
            Arus Kas Bersih (Rasio {savingsRatio}%)
          </span>
          <div className={`text-2xl sm:text-3xl font-black ${netCashFlow >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'}`}>
            {formatCurrency(netCashFlow)}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expense Bar Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white mb-1">
            Perbandingan Pemasukan vs Pengeluaran
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Evaluasi perbandingan arus masuk & keluar bulanan
          </p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(v) => `Rp${v / 1000000}M`}
                />
                <Tooltip
                  formatter={(val: any) => formatCurrency(Number(val))}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    color: '#FFF',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Pemasukan" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Pengeluaran" fill="#EF4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Expense Donut Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white mb-1">
              Proporsi Pengeluaran Kategori
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Persentase distribusi anggaran yang dihabiskan
            </p>

            {pieData.length > 0 ? (
              <div className="h-56 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
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
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-xs text-slate-400">
                Belum ada data pengeluaran pada periode ini.
              </div>
            )}
          </div>

          <div className="space-y-2 mt-4 max-h-40 overflow-y-auto pr-1">
            {pieData.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 font-bold">{p.percentage}%</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(p.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Expense Categories Breakdown Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h3 className="font-extrabold text-lg text-slate-900 dark:text-white mb-1">
          Rincian Pengeluaran Terbesar
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Daftar peringkat kategori dengan porsi anggaran tertinggi
        </p>

        <div className="space-y-3">
          {pieData.map((cat, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </span>
                <span className="text-slate-900 dark:text-white">
                  {formatCurrency(cat.value)} ({cat.percentage}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
