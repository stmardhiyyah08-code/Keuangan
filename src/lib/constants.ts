import { Category, Account } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  // Pengeluaran (Expense)
  { id: 'exp-1', name: 'Makanan & Minuman', type: 'expense', icon: 'Utensils', color: '#EF4444', isDefault: true },
  { id: 'exp-2', name: 'Belanja Bulanan', type: 'expense', icon: 'ShoppingCart', color: '#F97316', isDefault: true },
  { id: 'exp-3', name: 'Transportasi & Bensin', type: 'expense', icon: 'Car', color: '#F59E0B', isDefault: true },
  { id: 'exp-4', name: 'Tagihan & Utilitas', type: 'expense', icon: 'Zap', color: '#10B981', isDefault: true },
  { id: 'exp-5', name: 'Hiburan & Hobi', type: 'expense', icon: 'Film', color: '#8B5CF6', isDefault: true },
  { id: 'exp-6', name: 'Kesehatan & Obat', type: 'expense', icon: 'HeartPulse', color: '#EC4899', isDefault: true },
  { id: 'exp-7', name: 'Pendidikan & Kursus', type: 'expense', icon: 'GraduationCap', color: '#3B82F6', isDefault: true },
  { id: 'exp-8', name: 'Cicilan & Utang', type: 'expense', icon: 'CreditCard', color: '#64748B', isDefault: true },
  { id: 'exp-9', name: 'Zakat & Sedekah', type: 'expense', icon: 'Gift', color: '#14B8A6', isDefault: true },
  { id: 'exp-10', name: 'Lain-lain', type: 'expense', icon: 'MoreHorizontal', color: '#94A3B8', isDefault: true },

  // Pemasukan (Income)
  { id: 'inc-1', name: 'Gaji Bulanan', type: 'income', icon: 'Briefcase', color: '#10B981', isDefault: true },
  { id: 'inc-2', name: 'Usaha & Bisnis', type: 'income', icon: 'Store', color: '#059669', isDefault: true },
  { id: 'inc-3', name: 'Bonus & THR', type: 'income', icon: 'Award', color: '#F59E0B', isDefault: true },
  { id: 'inc-4', name: 'Investasi & Dividen', type: 'income', icon: 'TrendingUp', color: '#6366F1', isDefault: true },
  { id: 'inc-5', name: 'Transfer Masuk', type: 'income', icon: 'ArrowDownLeft', color: '#06B6D4', isDefault: true },
  { id: 'inc-6', name: 'Pemasukan Lainnya', type: 'income', icon: 'PlusCircle', color: '#84CC16', isDefault: true },
];

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-1',
    userId: 'user-demo',
    name: 'Uang Tunai (Dompet)',
    type: 'cash',
    balance: 1250000,
    icon: 'Wallet',
    color: '#10B981',
    isDefault: true,
  },
  {
    id: 'acc-2',
    userId: 'user-demo',
    name: 'Bank BCA',
    type: 'bank',
    balance: 18500000,
    icon: 'Building2',
    color: '#2563EB',
    accountNumber: '8820194812',
  },
  {
    id: 'acc-3',
    userId: 'user-demo',
    name: 'GoPay / OVO',
    type: 'e-wallet',
    balance: 850000,
    icon: 'Smartphone',
    color: '#06B6D4',
    accountNumber: '081234567890',
  },
  {
    id: 'acc-4',
    userId: 'user-demo',
    name: 'Bibit (Reksadana)',
    type: 'investment',
    balance: 25000000,
    icon: 'TrendingUp',
    color: '#8B5CF6',
  },
];
