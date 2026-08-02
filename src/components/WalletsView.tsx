import React, { useState } from 'react';
import {
  WalletCards,
  Plus,
  ArrowRightLeft,
  Building2,
  Smartphone,
  Wallet,
  TrendingUp,
  CreditCard,
  X,
  CheckCircle,
} from 'lucide-react';
import { Account, AccountType, User } from '../types';
import { formatCurrency } from '../lib/formatters';

interface WalletsViewProps {
  currentUser: User | null;
  accounts: Account[];
  onCreateAccount: (acc: Omit<Account, 'id'>) => void;
  onTransfer: (payload: {
    userId: string;
    sourceAccountId: string;
    targetAccountId: string;
    amount: number;
    description: string;
    date: string;
  }) => void;
}

export const WalletsView: React.FC<WalletsViewProps> = ({
  currentUser,
  accounts,
  onCreateAccount,
  onTransfer,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // New Account Form
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [balance, setBalance] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [color, setColor] = useState('#2563EB');

  // Transfer Form
  const [sourceAccountId, setSourceAccountId] = useState(accounts[0]?.id || '');
  const [targetAccountId, setTargetAccountId] = useState(accounts[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDesc, setTransferDesc] = useState('');

  const handleCreateAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !balance) return;

    onCreateAccount({
      userId: currentUser?.id || '',
      name,
      type,
      balance: parseFloat(balance) || 0,
      accountNumber,
      color,
      icon: type === 'bank' ? 'Building2' : type === 'e-wallet' ? 'Smartphone' : type === 'investment' ? 'TrendingUp' : 'Wallet',
    });

    setIsAddModalOpen(false);
    setName('');
    setBalance('');
    setAccountNumber('');
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);
    if (!amt || amt <= 0 || !sourceAccountId || !targetAccountId) return;

    onTransfer({
      userId: currentUser?.id || '',
      sourceAccountId,
      targetAccountId,
      amount: amt,
      description: transferDesc || 'Transfer Antar Rekening',
      date: new Date().toISOString().split('T')[0],
    });

    setIsTransferModalOpen(false);
    setTransferAmount('');
    setTransferDesc('');
  };

  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

  const getAccountIcon = (t: AccountType) => {
    switch (t) {
      case 'bank':
        return <Building2 className="w-6 h-6 text-white" />;
      case 'e-wallet':
        return <Smartphone className="w-6 h-6 text-white" />;
      case 'investment':
        return <TrendingUp className="w-6 h-6 text-white" />;
      default:
        return <Wallet className="w-6 h-6 text-white" />;
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Dompet & Rekening Bank
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Kelola saldo kas, akun bank, e-wallet, dan instrumen investasi Anda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs hover:bg-slate-200 transition"
          >
            <ArrowRightLeft className="w-4 h-4 text-blue-600" />
            <span>Transfer Antar Rekening</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Rekening Baru</span>
          </button>
        </div>
      </div>

      {/* Account Balance Summary Card */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl shadow-purple-600/20 space-y-2">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-pink-400/30 blur-3xl pointer-events-none" />
        <span className="text-xs font-black text-purple-200 uppercase tracking-widest block drop-shadow-xs">
          Total Kekayaan di Seluruh Rekening
        </span>
        <div className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-sm">
          {formatCurrency(totalBalance)}
        </div>
        <p className="text-xs text-purple-100/90 font-medium">
          Saldo diperbarui secara otomatis ketika Anda mencatat transaksi atau melakukan transfer.
        </p>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc, idx) => {
          // Vibrant card border accent colors
          const cardGradients = [
            'from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-purple-200 dark:border-purple-800/50',
            'from-teal-500/10 via-emerald-500/10 to-cyan-500/10 border-teal-200 dark:border-teal-800/50',
            'from-amber-500/10 via-orange-500/10 to-rose-500/10 border-amber-200 dark:border-amber-800/50',
            'from-fuchsia-500/10 via-pink-500/10 to-rose-500/10 border-fuchsia-200 dark:border-fuchsia-800/50',
          ];
          const grad = cardGradients[idx % cardGradients.length];

          return (
            <div
              key={acc.id}
              className={`p-6 rounded-3xl bg-gradient-to-br ${grad} bg-white dark:bg-slate-900/90 border shadow-sm hover:shadow-lg hover:scale-[1.01] transition duration-200 space-y-4 relative overflow-hidden`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 shadow-lg"
                    style={{ backgroundColor: acc.color || '#a855f7' }}
                  >
                    {getAccountIcon(acc.type)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {acc.name}
                    </h3>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 capitalize">
                      {acc.type === 'bank' ? 'Rekening Bank' : acc.type === 'e-wallet' ? 'E-Wallet' : acc.type === 'investment' ? 'Investasi' : 'Uang Tunai'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-purple-100/60 dark:border-purple-950/40">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Saldo Saat Ini</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {formatCurrency(acc.balance)}
                </div>
                {acc.accountNumber && (
                  <div className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 mt-1">
                    No: {acc.accountNumber}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add New Account */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Tambah Rekening / Dompet Baru
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccountSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                  Nama Rekening / Dompet
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Bank Mandiri / ShopeePay"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                  Jenis Akun
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AccountType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                >
                  <option value="bank">Rekening Bank</option>
                  <option value="e-wallet">E-Wallet (GoPay/OVO/Dana)</option>
                  <option value="cash">Uang Tunai (Dompet)</option>
                  <option value="investment">Investasi / Reksadana</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                  Saldo Awal (Rp)
                </label>
                <input
                  type="number"
                  required
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="Contoh: 1000000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                  Nomor Rekening / HP (Opsional)
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Contoh: 1234567890"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                  Warna Tema Rekening
                </label>
                <div className="flex items-center gap-2">
                  {['#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4'].map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition ${color === c ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md"
                >
                  Simpan Rekening
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Transfer Antar Rekening */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                <span>Transfer Antar Rekening</span>
              </h3>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                  Rekening Asal (Dikurangi)
                </label>
                <select
                  value={sourceAccountId}
                  onChange={(e) => setSourceAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                  Rekening Tujuan (Ditambah)
                </label>
                <select
                  value={targetAccountId}
                  onChange={(e) => setTargetAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                >
                  {accounts
                    .filter((a) => a.id !== sourceAccountId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatCurrency(a.balance)})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                  Nominal Transfer (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="Contoh: 500000"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-black text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                  Keterangan / Catatan
                </label>
                <input
                  type="text"
                  value={transferDesc}
                  onChange={(e) => setTransferDesc(e.target.value)}
                  placeholder="Contoh: Top-up e-wallet dari BCA"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md"
                >
                  Proses Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
