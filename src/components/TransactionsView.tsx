import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  FileText,
  Trash2,
  Edit,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  Calendar,
  Tag,
  Upload,
  Camera,
  X,
  Sparkles,
  Receipt,
  CheckCircle,
} from 'lucide-react';
import { Transaction, Account, Category, FilterState, User } from '../types';
import { formatCurrency, formatDateIndonesian, getTodayDateString } from '../lib/formatters';
import { exportToCSV, exportToPDFReport } from '../lib/exportUtils';
import { DEFAULT_CATEGORIES } from '../lib/constants';

interface TransactionsViewProps {
  currentUser: User | null;
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onCreateTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onUpdateTransaction: (id: string, updates: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenAiScanReceipt?: (imageData: string) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  currentUser,
  transactions,
  accounts,
  categories,
  onCreateTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onOpenAiScanReceipt,
}) => {
  const effectiveCategories = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;
  const categoryMap = new Map(effectiveCategories.map((c) => [c.id, c]));
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  // Filters State
  const [filter, setFilter] = useState<FilterState>({
    search: '',
    type: 'all',
    categoryId: '',
    accountId: '',
    datePreset: 'this_month',
    startDate: '',
    endDate: '',
    sortBy: 'date_desc',
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Modal Form State
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('exp-1');
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || '');
  const [targetAccountId, setTargetAccountId] = useState<string>(accounts[1]?.id || '');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [time, setTime] = useState<string>('12:00');
  const [description, setDescription] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');

  // Selected Receipt Preview Modal State
  const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);

  // Handle Form Reset
  const resetForm = () => {
    setEditingTx(null);
    setType('expense');
    setAmount('');
    const defaultCat = effectiveCategories.find((c) => c.type === 'expense')?.id || 'exp-1';
    setCategoryId(defaultCat);
    setAccountId(accounts[0]?.id || '');
    setTargetAccountId(accounts[1]?.id || '');
    setDate(getTodayDateString());
    setTime('12:00');
    setDescription('');
    setTagsInput('');
    setReceiptUrl('');
  };

  const handleTypeChange = (newType: 'expense' | 'income' | 'transfer') => {
    setType(newType);
    if (newType !== 'transfer') {
      const validCats = effectiveCategories.filter(
        (c) => c.type === (newType === 'income' ? 'income' : 'expense')
      );
      if (validCats.length > 0) {
        setCategoryId(validCats[0].id);
      }
    }
  };

  const handleOpenNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setType(tx.type);
    setAmount(String(tx.amount));
    setCategoryId(tx.categoryId);
    setAccountId(tx.accountId);
    setTargetAccountId(tx.targetAccountId || '');
    setDate(tx.date);
    setTime(tx.time || '12:00');
    setDescription(tx.description);
    setTagsInput((tx.tags || []).join(', '));
    setReceiptUrl(tx.receiptUrl || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;

    const tagsArray = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (editingTx) {
      onUpdateTransaction(editingTx.id, {
        type,
        amount: parsedAmount,
        categoryId,
        accountId,
        targetAccountId: type === 'transfer' ? targetAccountId : undefined,
        date,
        time,
        description,
        tags: tagsArray,
        receiptUrl,
      });
    } else {
      onCreateTransaction({
        userId: currentUser.id,
        type,
        amount: parsedAmount,
        categoryId,
        accountId,
        targetAccountId: type === 'transfer' ? targetAccountId : undefined,
        date,
        time,
        description,
        tags: tagsArray,
        receiptUrl,
      });
    }

    setIsModalOpen(false);
    resetForm();
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setReceiptUrl(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filtering Logic
  const filteredTransactions = transactions.filter((t) => {
    // Type
    if (filter.type !== 'all' && t.type !== filter.type) return false;
    // Category
    if (filter.categoryId && t.categoryId !== filter.categoryId) return false;
    // Account
    if (filter.accountId && t.accountId !== filter.accountId && t.targetAccountId !== filter.accountId)
      return false;
    // Search
    if (filter.search) {
      const query = filter.search.toLowerCase();
      const matchDesc = t.description.toLowerCase().includes(query);
      const cat = categoryMap.get(t.categoryId)?.name.toLowerCase() || '';
      const matchCat = cat.includes(query);
      const matchTags = (t.tags || []).some((tag) => tag.toLowerCase().includes(query));
      if (!matchDesc && !matchCat && !matchTags) return false;
    }
    return true;
  });

  // Export handlers
  const handleExportCSV = () => {
    exportToCSV(filteredTransactions, categories, accounts);
  };

  const handleExportPDF = () => {
    exportToPDFReport(filteredTransactions, categories, accounts, currentUser, 'Daftar Transaksi Terfilter');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Kelola Transaksi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Catat, filter, dan unduh data pemasukan serta pengeluaran Anda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs hover:bg-emerald-100 transition shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-xs hover:bg-rose-100 transition shadow-xs"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>Ekspor PDF</span>
          </button>
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-extrabold text-xs shadow-md shadow-emerald-500/25 active:scale-95 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Transaksi Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              placeholder="Cari transaksi, keterangan, atau hashtag..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(['all', 'income', 'expense', 'transfer'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter({ ...filter, type: t })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                  filter.type === t
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {t === 'all' ? 'Semua' : t === 'income' ? 'Pemasukan' : t === 'expense' ? 'Pengeluaran' : 'Transfer'}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Category Filter */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">
              Filter Kategori
            </label>
            <select
              value={filter.categoryId}
              onChange={(e) => setFilter({ ...filter, categoryId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type === 'income' ? 'Pemasukan' : 'Pengeluaran'})
                </option>
              ))}
            </select>
          </div>

          {/* Account Filter */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">
              Filter Rekening/Dompet
            </label>
            <select
              value={filter.accountId}
              onChange={(e) => setFilter({ ...filter, accountId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            >
              <option value="">Semua Rekening</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatCurrency(a.balance)})
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-end">
            <button
              onClick={() =>
                setFilter({
                  search: '',
                  type: 'all',
                  categoryId: '',
                  accountId: '',
                  datePreset: 'this_month',
                  startDate: '',
                  endDate: '',
                  sortBy: 'date_desc',
                })
              }
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
            Daftar Transaksi ({filteredTransactions.length} Item)
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Tidak ada transaksi ditemukan. Silakan sesuaikan filter atau tambah transaksi baru.
            </div>
          ) : (
            filteredTransactions.map((t) => {
              const isIncome = t.type === 'income';
              const isExpense = t.type === 'expense';
              const cat = categoryMap.get(t.categoryId);
              const acc = accountMap.get(t.accountId);
              const targetAcc = t.targetAccountId ? accountMap.get(t.targetAccountId) : null;

              return (
                <div
                  key={t.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shrink-0 shadow-sm mt-0.5 sm:mt-0"
                      style={{ backgroundColor: cat?.color || '#3B82F6' }}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : isExpense ? (
                        <ArrowDownRight className="w-5 h-5" />
                      ) : (
                        <ArrowRightLeft className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {t.description || cat?.name || 'Transaksi'}
                        </span>
                        {t.receiptUrl && (
                          <button
                            onClick={() => setPreviewReceipt(t.receiptUrl!)}
                            className="p-1 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 rounded-lg hover:underline text-[10px] font-bold flex items-center gap-1"
                          >
                            <Receipt className="w-3 h-3" />
                            <span>Struk</span>
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {cat?.name || 'Umum'}
                        </span>
                        <span>•</span>
                        <span>
                          {acc?.name}
                          {targetAcc ? ` ➔ ${targetAcc.name}` : ''}
                        </span>
                        <span>•</span>
                        <span>{formatDateIndonesian(t.date)} ({t.time || '12:00'})</span>
                      </div>

                      {t.tags && t.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {t.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                    <div className="text-right">
                      <div
                        className={`font-black text-base sm:text-lg ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isExpense
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {isIncome ? '+' : isExpense ? '-' : ''}
                        {formatCurrency(t.amount)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(t)}
                        className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteTransaction(t.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Add / Edit Transaction */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                {editingTx ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                {(['expense', 'income', 'transfer'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTypeChange(t)}
                    className={`py-2 rounded-xl text-xs font-bold capitalize transition ${
                      type === t
                        ? t === 'expense'
                          ? 'bg-rose-600 text-white shadow-md'
                          : t === 'income'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                    }`}
                  >
                    {t === 'expense' ? 'Pengeluaran' : t === 'income' ? 'Pemasukan' : 'Transfer'}
                  </button>
                ))}
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                  Jumlah Nominal (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Contoh: 150000"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-lg font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category & Account */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {type !== 'transfer' && (
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                      Kategori
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                    >
                      {effectiveCategories
                        .filter((c) => c.type === (type === 'income' ? 'income' : 'expense'))
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                    {type === 'transfer' ? 'Rekening Asal' : 'Rekening / Dompet'}
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatCurrency(a.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                {type === 'transfer' && (
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                      Rekening Tujuan
                    </label>
                    <select
                      value={targetAccountId}
                      onChange={(e) => setTargetAccountId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                    >
                      {accounts
                        .filter((a) => a.id !== accountId)
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({formatCurrency(a.balance)})
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                    Waktu
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                  Keterangan / Catatan
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Belanja Bulanan di Supermarket"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                  Tag / Hashtag (pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Contoh: Kuliner, Liburan, Rutin"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              {/* Receipt Image Upload */}
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                  Lampiran Struk Belanja
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 border border-slate-200 dark:border-slate-700">
                    <Upload className="w-4 h-4" />
                    <span>{receiptUrl ? 'Ubah Gambar' : 'Unggah Struk'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  {receiptUrl && (
                    <div className="flex items-center gap-2">
                      <img
                        src={receiptUrl}
                        alt="Struk"
                        className="w-10 h-10 object-cover rounded-xl border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => setReceiptUrl('')}
                        className="text-rose-500 text-xs font-bold hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20"
                >
                  {editingTx ? 'Simpan Perubahan' : 'Catat Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Image Modal Preview */}
      {previewReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-4 space-y-3 relative">
            <button
              onClick={() => setPreviewReceipt(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Bukti Struk Transaksi
            </h3>
            <img
              src={previewReceipt}
              alt="Bukti Struk"
              className="w-full max-h-96 object-contain rounded-2xl border border-slate-200"
            />
          </div>
        </div>
      )}
    </div>
  );
};
