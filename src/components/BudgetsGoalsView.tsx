import React, { useState } from 'react';
import {
  Target,
  PiggyBank,
  Plus,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  X,
  Laptop,
  ShieldAlert,
  Plane,
  Home,
  PlusCircle,
} from 'lucide-react';
import { Budget, FinancialGoal, Category, Transaction, User } from '../types';
import { formatCurrency, getCurrentMonthYear } from '../lib/formatters';

interface BudgetsGoalsViewProps {
  currentUser: User | null;
  budgets: Budget[];
  goals: FinancialGoal[];
  categories: Category[];
  transactions: Transaction[];
  onSaveBudget: (budget: Omit<Budget, 'id'>) => void;
  onCreateGoal: (goal: Omit<FinancialGoal, 'id'>) => void;
  onUpdateGoal: (id: string, updates: Partial<FinancialGoal>) => void;
}

export const BudgetsGoalsView: React.FC<BudgetsGoalsViewProps> = ({
  currentUser,
  budgets,
  goals,
  categories,
  transactions,
  onSaveBudget,
  onCreateGoal,
  onUpdateGoal,
}) => {
  const [activeTab, setActiveTab] = useState<'budgets' | 'goals'>('budgets');

  // Budget Modal State
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState(categories.find((c) => c.type === 'expense')?.id || '');
  const [monthlyLimit, setMonthlyLimit] = useState('');

  // Goal Modal State
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalCurrentAmount, setGoalCurrentAmount] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('2026-12-31');
  const [goalCategory, setGoalCategory] = useState('Tabungan');

  // Deposit Goal Modal State
  const [depositGoal, setDepositGoal] = useState<FinancialGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  // Map categories
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Current month expense transactions
  const currentMonthYear = getCurrentMonthYear(); // "2026-08"
  const currentMonthTxs = transactions.filter(
    (t) => t.date.startsWith(currentMonthYear) && t.type === 'expense'
  );

  const handleSaveBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(monthlyLimit);
    if (!limit || limit <= 0) return;

    onSaveBudget({
      userId: currentUser.id,
      categoryId: selectedCatId,
      monthlyLimit: limit,
      monthYear: currentMonthYear,
    });

    setIsBudgetModalOpen(false);
    setMonthlyLimit('');
  };

  const handleCreateGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(goalTargetAmount);
    if (!target || !goalTitle) return;

    onCreateGoal({
      userId: currentUser.id,
      title: goalTitle,
      targetAmount: target,
      currentAmount: parseFloat(goalCurrentAmount) || 0,
      targetDate: goalTargetDate,
      category: goalCategory,
      icon: 'PiggyBank',
      color: '#2563EB',
    });

    setIsGoalModalOpen(false);
    setGoalTitle('');
    setGoalTargetAmount('');
    setGoalCurrentAmount('');
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoal) return;
    const addAmt = parseFloat(depositAmount);
    if (!addAmt || addAmt <= 0) return;

    onUpdateGoal(depositGoal.id, {
      currentAmount: depositGoal.currentAmount + addAmt,
    });

    setDepositGoal(null);
    setDepositAmount('');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Anggaran & Target Tabungan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Tetapkan batas pengeluaran bulanan dan wujudkan impian finansial Anda.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-purple-100/60 dark:bg-purple-950/40 p-1 rounded-2xl border border-purple-200/50 dark:border-purple-800/40">
          <button
            onClick={() => setActiveTab('budgets')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'budgets'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300'
            }`}
          >
            Batas Anggaran Bulanan
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'goals'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300'
            }`}
          >
            Target Tabungan
          </button>
        </div>
      </div>

      {/* SECTION 1: BUDGETS */}
      {activeTab === 'budgets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Batas Pengeluaran Bulan Ini ({currentMonthYear})
            </span>
            <button
              onClick={() => setIsBudgetModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Atur Batas Anggaran</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories
              .filter((c) => c.type === 'expense')
              .map((cat) => {
                const budget = budgets.find((b) => b.categoryId === cat.id && b.monthYear === currentMonthYear);
                const spent = currentMonthTxs
                  .filter((t) => t.categoryId === cat.id)
                  .reduce((acc, t) => acc + t.amount, 0);

                const limit = budget ? budget.monthlyLimit : 0;
                const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
                const remaining = limit - spent;

                let statusBadge = 'Sesuai Batas';
                let statusColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
                let barColor = 'bg-emerald-500';

                if (limit > 0 && percent >= 100) {
                  statusBadge = 'Melebihi Anggaran!';
                  statusColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
                  barColor = 'bg-rose-600';
                } else if (limit > 0 && percent >= 80) {
                  statusBadge = 'Hampir Habis';
                  statusColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
                  barColor = 'bg-amber-500';
                }

                return (
                  <div
                    key={cat.id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-extrabold text-base text-slate-900 dark:text-white">
                          {cat.name}
                        </span>
                      </div>
                      {limit > 0 && (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${statusColor}`}>
                          {statusBadge}
                        </span>
                      )}
                    </div>

                    {limit > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Terpakai: {formatCurrency(spent)}</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            Batas: {formatCurrency(limit)}
                          </span>
                        </div>

                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${barColor} transition-all duration-500 rounded-full`}
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>{percent}% terpakai</span>
                          <span>
                            {remaining >= 0
                              ? `Sisa: ${formatCurrency(remaining)}`
                              : `Kelebihan: ${formatCurrency(Math.abs(remaining))}`}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span>Pengeluaran: {formatCurrency(spent)}</span>
                        <button
                          onClick={() => {
                            setSelectedCatId(cat.id);
                            setIsBudgetModalOpen(true);
                          }}
                          className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                        >
                          + Set Batas
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* SECTION 2: GOALS */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Target Tabungan & Rencana Masa Depan
            </span>
            <button
              onClick={() => setIsGoalModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Target Tabungan</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((goal) => {
              const progressPercent = Math.min(
                100,
                Math.round((goal.currentAmount / goal.targetAmount) * 100)
              );

              return (
                <div
                  key={goal.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                        <PiggyBank className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                          {goal.title}
                        </h3>
                        <span className="text-xs text-slate-400">Target: {goal.targetDate}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      {progressPercent}%
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Terkumpul: {formatCurrency(goal.currentAmount)}</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        Target: {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>

                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Sisa: {formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount))}
                    </span>
                    <button
                      onClick={() => setDepositGoal(goal)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100 transition flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Setor Tabungan</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Add Budget */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Atur Batas Anggaran Kategori
              </h3>
              <button
                onClick={() => setIsBudgetModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudgetSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                  Pilih Kategori Pengeluaran
                </label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  {categories
                    .filter((c) => c.type === 'expense')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                  Batas Maksimal Bulanan (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  placeholder="Contoh: 2500000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md"
                >
                  Simpan Batas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Goal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Buat Target Tabungan Baru
              </h3>
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoalSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                  Judul Target Tabungan
                </label>
                <input
                  type="text"
                  required
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="Contoh: Dana Darurat / Beli Laptop"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                  Target Nominal (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={goalTargetAmount}
                  onChange={(e) => setGoalTargetAmount(e.target.value)}
                  placeholder="Contoh: 15000000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                  Saldo Awal Terkumpul (Opsional)
                </label>
                <input
                  type="number"
                  value={goalCurrentAmount}
                  onChange={(e) => setGoalCurrentAmount(e.target.value)}
                  placeholder="Contoh: 2000000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                  Target Tanggal Pencapaian
                </label>
                <input
                  type="date"
                  value={goalTargetDate}
                  onChange={(e) => setGoalTargetDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md"
                >
                  Simpan Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Deposit Goal */}
      {depositGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Setor Tabungan: {depositGoal.title}
              </h3>
              <button
                onClick={() => setDepositGoal(null)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                  Jumlah Setoran Tambahan (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Contoh: 500000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-black text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDepositGoal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md"
                >
                  Konfirmasi Setoran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
