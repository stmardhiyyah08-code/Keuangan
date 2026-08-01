import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Database storage setup
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Database Template
const DEFAULT_DB = {
  users: [
    {
      id: 'user-demo',
      name: 'Ahmad Rizky',
      email: 'ahmad.rizky@example.com',
      currency: 'IDR',
      darkMode: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'user-biz',
      name: 'Toko Berkah Usaha',
      email: 'berkah.usaha@example.com',
      currency: 'IDR',
      darkMode: true,
      createdAt: new Date().toISOString(),
    }
  ],
  accounts: [
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
      name: 'GoPay & OVO',
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
  ],
  categories: [
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
    { id: 'inc-1', name: 'Gaji Bulanan', type: 'income', icon: 'Briefcase', color: '#10B981', isDefault: true },
    { id: 'inc-2', name: 'Usaha & Bisnis', type: 'income', icon: 'Store', color: '#059669', isDefault: true },
    { id: 'inc-3', name: 'Bonus & THR', type: 'income', icon: 'Award', color: '#F59E0B', isDefault: true },
    { id: 'inc-4', name: 'Investasi & Dividen', type: 'income', icon: 'TrendingUp', color: '#6366F1', isDefault: true },
    { id: 'inc-5', name: 'Pemasukan Lainnya', type: 'income', icon: 'PlusCircle', color: '#84CC16', isDefault: true },
  ],
  transactions: [
    {
      id: 'tx-101',
      userId: 'user-demo',
      type: 'income',
      amount: 12000000,
      categoryId: 'inc-1',
      accountId: 'acc-2',
      date: '2026-08-01',
      time: '09:00',
      description: 'Gaji Bulanan Agustus 2026',
      tags: ['Gaji', 'Utama'],
      createdAt: new Date('2026-08-01T09:00:00').toISOString(),
    },
    {
      id: 'tx-102',
      userId: 'user-demo',
      type: 'expense',
      amount: 450000,
      categoryId: 'exp-2',
      accountId: 'acc-2',
      date: '2026-08-01',
      time: '14:30',
      description: 'Belanja Sembako Supermarket',
      tags: ['Sembako', 'Mingguan'],
      createdAt: new Date('2026-08-01T14:30:00').toISOString(),
    },
    {
      id: 'tx-103',
      userId: 'user-demo',
      type: 'expense',
      amount: 85000,
      categoryId: 'exp-1',
      accountId: 'acc-3',
      date: '2026-08-01',
      time: '19:15',
      description: 'Makan Malam Resto Bersama',
      tags: ['Kuliner'],
      createdAt: new Date('2026-08-01T19:15:00').toISOString(),
    },
    {
      id: 'tx-104',
      userId: 'user-demo',
      type: 'expense',
      amount: 150000,
      categoryId: 'exp-3',
      accountId: 'acc-3',
      date: '2026-07-30',
      time: '08:00',
      description: 'Isi Bensin Mobil Pertamax',
      tags: ['Bensin'],
      createdAt: new Date('2026-07-30T08:00:00').toISOString(),
    },
    {
      id: 'tx-105',
      userId: 'user-demo',
      type: 'expense',
      amount: 750000,
      categoryId: 'exp-4',
      accountId: 'acc-2',
      date: '2026-07-28',
      time: '10:00',
      description: 'Tagihan Listrik PLN & Wi-Fi',
      tags: ['Tagihan'],
      createdAt: new Date('2026-07-28T10:00:00').toISOString(),
    },
    {
      id: 'tx-106',
      userId: 'user-demo',
      type: 'income',
      amount: 2500000,
      categoryId: 'inc-2',
      accountId: 'acc-2',
      date: '2026-07-25',
      time: '16:00',
      description: 'Hasil Penjualan Side Project Website',
      tags: ['Freelance'],
      createdAt: new Date('2026-07-25T16:00:00').toISOString(),
    },
  ],
  budgets: [
    { id: 'bgt-1', userId: 'user-demo', categoryId: 'exp-1', monthlyLimit: 2500000, monthYear: '2026-08' },
    { id: 'bgt-2', userId: 'user-demo', categoryId: 'exp-2', monthlyLimit: 3000000, monthYear: '2026-08' },
    { id: 'bgt-3', userId: 'user-demo', categoryId: 'exp-3', monthlyLimit: 1000000, monthYear: '2026-08' },
    { id: 'bgt-4', userId: 'user-demo', categoryId: 'exp-5', monthlyLimit: 800000, monthYear: '2026-08' },
  ],
  goals: [
    {
      id: 'goal-1',
      userId: 'user-demo',
      title: 'Dana Darurat 6 Bulan',
      targetAmount: 50000000,
      currentAmount: 25000000,
      targetDate: '2026-12-31',
      category: 'Investasi',
      icon: 'ShieldAlert',
      color: '#2563EB',
    },
    {
      id: 'goal-2',
      userId: 'user-demo',
      title: 'Beli Laptop Kerja Baru',
      targetAmount: 18000000,
      currentAmount: 12000000,
      targetDate: '2026-10-15',
      category: 'Elektronik',
      icon: 'Laptop',
      color: '#10B981',
    },
  ],
  reminders: {
    enabled: true,
    time: '20:00',
    streakDays: 5,
    lastLoggedDate: '2026-08-01',
  },
  supabaseConfig: {
    url: '',
    anonKey: '',
    isConnected: false,
    lastSyncedAt: new Date().toISOString(),
  }
};

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2));
      return DEFAULT_DB;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading DB, resetting to defaults:', err);
    return DEFAULT_DB;
  }
}

function writeDb(dbData: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2));
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

// REST API ENDPOINTS

// 1. Health check & Sync status
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/sync/status', (req, res) => {
  const db = readDb();
  res.json({
    synced: true,
    lastSyncedAt: new Date().toISOString(),
    supabaseConnected: db.supabaseConfig?.isConnected || false,
  });
});

// 2. Users / Auth
app.get('/api/users', (req, res) => {
  const db = readDb();
  res.json(db.users);
});

app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDb();
  const user = db.users.find((u: any) => u.email.toLowerCase() === (email || '').toLowerCase());

  if (user) {
    res.json({ success: true, user });
  } else {
    // Auto register demo
    const newUser = {
      id: 'user-' + Date.now(),
      name: email.split('@')[0] || 'Pengguna Baru',
      email: email,
      currency: 'IDR',
      darkMode: false,
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    writeDb(db);
    res.json({ success: true, user: newUser });
  }
});

// 3. Transactions
app.get('/api/transactions', (req, res) => {
  const userId = (req.query.userId as string) || 'user-demo';
  const db = readDb();
  const userTxs = db.transactions.filter((t: any) => t.userId === userId);
  res.json(userTxs);
});

app.post('/api/transactions', (req, res) => {
  const newTx = { ...req.body, id: 'tx-' + Date.now(), createdAt: new Date().toISOString() };
  const db = readDb();

  // Update account balance
  const account = db.accounts.find((a: any) => a.id === newTx.accountId);
  if (account) {
    if (newTx.type === 'income') {
      account.balance += Number(newTx.amount);
    } else if (newTx.type === 'expense') {
      account.balance -= Number(newTx.amount);
    } else if (newTx.type === 'transfer' && newTx.targetAccountId) {
      account.balance -= Number(newTx.amount);
      const targetAcc = db.accounts.find((a: any) => a.id === newTx.targetAccountId);
      if (targetAcc) {
        targetAcc.balance += Number(newTx.amount);
      }
    }
  }

  // Check reminder streak update
  if (db.reminders) {
    const today = new Date().toISOString().split('T')[0];
    if (db.reminders.lastLoggedDate !== today) {
      db.reminders.streakDays = (db.reminders.streakDays || 0) + 1;
      db.reminders.lastLoggedDate = today;
    }
  }

  db.transactions.unshift(newTx);
  writeDb(db);
  res.json({ success: true, transaction: newTx, accounts: db.accounts });
});

app.put('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const index = db.transactions.findIndex((t: any) => t.id === id);
  if (index !== -1) {
    db.transactions[index] = { ...db.transactions[index], ...req.body };
    writeDb(db);
    res.json({ success: true, transaction: db.transactions[index] });
  } else {
    res.status(404).json({ error: 'Transaction not found' });
  }
});

app.delete('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const tx = db.transactions.find((t: any) => t.id === id);

  if (tx) {
    // Reverse balance effect
    const account = db.accounts.find((a: any) => a.id === tx.accountId);
    if (account) {
      if (tx.type === 'income') account.balance -= Number(tx.amount);
      if (tx.type === 'expense') account.balance += Number(tx.amount);
      if (tx.type === 'transfer' && tx.targetAccountId) {
        account.balance += Number(tx.amount);
        const targetAcc = db.accounts.find((a: any) => a.id === tx.targetAccountId);
        if (targetAcc) targetAcc.balance -= Number(tx.amount);
      }
    }
    db.transactions = db.transactions.filter((t: any) => t.id !== id);
    writeDb(db);
    res.json({ success: true, accounts: db.accounts });
  } else {
    res.status(404).json({ error: 'Transaction not found' });
  }
});

// 4. Accounts / Wallets
app.get('/api/accounts', (req, res) => {
  const userId = (req.query.userId as string) || 'user-demo';
  const db = readDb();
  res.json(db.accounts.filter((a: any) => a.userId === userId));
});

app.post('/api/accounts', (req, res) => {
  const newAccount = { ...req.body, id: 'acc-' + Date.now() };
  const db = readDb();
  db.accounts.push(newAccount);
  writeDb(db);
  res.json({ success: true, account: newAccount });
});

app.put('/api/accounts/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const index = db.accounts.findIndex((a: any) => a.id === id);
  if (index !== -1) {
    db.accounts[index] = { ...db.accounts[index], ...req.body };
    writeDb(db);
    res.json({ success: true, account: db.accounts[index] });
  } else {
    res.status(404).json({ error: 'Account not found' });
  }
});

// Account Transfer endpoint
app.post('/api/accounts/transfer', (req, res) => {
  const { userId, sourceAccountId, targetAccountId, amount, description, date } = req.body;
  const db = readDb();

  const source = db.accounts.find((a: any) => a.id === sourceAccountId);
  const target = db.accounts.find((a: any) => a.id === targetAccountId);

  if (!source || !target) {
    return res.status(400).json({ error: 'Rekening asal atau tujuan tidak ditemukan.' });
  }

  source.balance -= Number(amount);
  target.balance += Number(amount);

  const transferTx = {
    id: 'tx-' + Date.now(),
    userId: userId || 'user-demo',
    type: 'transfer',
    amount: Number(amount),
    categoryId: 'exp-10',
    accountId: sourceAccountId,
    targetAccountId: targetAccountId,
    date: date || new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    description: description || `Transfer dari ${source.name} ke ${target.name}`,
    createdAt: new Date().toISOString(),
  };

  db.transactions.unshift(transferTx);
  writeDb(db);

  res.json({ success: true, transaction: transferTx, accounts: db.accounts });
});

// 5. Categories
app.get('/api/categories', (req, res) => {
  const db = readDb();
  res.json(db.categories);
});

// 6. Budgets
app.get('/api/budgets', (req, res) => {
  const userId = (req.query.userId as string) || 'user-demo';
  const db = readDb();
  res.json(db.budgets.filter((b: any) => b.userId === userId));
});

app.post('/api/budgets', (req, res) => {
  const { userId, categoryId, monthlyLimit, monthYear } = req.body;
  const db = readDb();
  const existingIndex = db.budgets.findIndex((b: any) => b.userId === userId && b.categoryId === categoryId && b.monthYear === monthYear);

  if (existingIndex !== -1) {
    db.budgets[existingIndex].monthlyLimit = Number(monthlyLimit);
  } else {
    db.budgets.push({
      id: 'bgt-' + Date.now(),
      userId,
      categoryId,
      monthlyLimit: Number(monthlyLimit),
      monthYear: monthYear || '2026-08',
    });
  }

  writeDb(db);
  res.json({ success: true, budgets: db.budgets.filter((b: any) => b.userId === userId) });
});

// 7. Goals
app.get('/api/goals', (req, res) => {
  const userId = (req.query.userId as string) || 'user-demo';
  const db = readDb();
  res.json(db.goals.filter((g: any) => g.userId === userId));
});

app.post('/api/goals', (req, res) => {
  const newGoal = { ...req.body, id: 'goal-' + Date.now(), currentAmount: req.body.currentAmount || 0 };
  const db = readDb();
  db.goals.push(newGoal);
  writeDb(db);
  res.json({ success: true, goal: newGoal });
});

app.put('/api/goals/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const index = db.goals.findIndex((g: any) => g.id === id);
  if (index !== -1) {
    db.goals[index] = { ...db.goals[index], ...req.body };
    writeDb(db);
    res.json({ success: true, goal: db.goals[index] });
  } else {
    res.status(404).json({ error: 'Goal not found' });
  }
});

// 8. Reminders
app.get('/api/reminders', (req, res) => {
  const db = readDb();
  res.json(db.reminders || { enabled: true, time: '20:00', streakDays: 0 });
});

app.put('/api/reminders', (req, res) => {
  const db = readDb();
  db.reminders = { ...db.reminders, ...req.body };
  writeDb(db);
  res.json({ success: true, reminders: db.reminders });
});

// 9. Supabase Config
app.get('/api/supabase-config', (req, res) => {
  const db = readDb();
  res.json(db.supabaseConfig || { url: '', anonKey: '', isConnected: false });
});

app.post('/api/supabase-config', (req, res) => {
  const { url, anonKey } = req.body;
  const db = readDb();
  db.supabaseConfig = {
    url,
    anonKey,
    isConnected: Boolean(url && anonKey),
    lastSyncedAt: new Date().toISOString(),
  };
  writeDb(db);
  res.json({ success: true, supabaseConfig: db.supabaseConfig });
});

// 10. Gemini AI Financial Advisor & Receipt Scanner Endpoint
app.post('/api/ai/advisor', async (req, res) => {
  try {
    const { prompt, receiptImage, userFinancials } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY belum dikonfigurasi di Environment Secrets.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = `
      Anda adalah Penasihat Keuangan Pintar untuk aplikasi "Dompetku".
      Tugas Anda adalah memberikan saran keuangan yang praktis, realistis, dan ramah dalam bahasa Indonesia yang santun.
      
      Format respon Anda harus menggunakan Markdown yang rapi dengan bullet points, angka cetak tebal, dan emote yang relevan.
      Jika diberikan data keuangan pengguna (total pemasukan, pengeluaran, saldo, kategori pengeluaran terbesar), berikan analisis rasio 50/30/20 dan rekomendasi penghematan konkret.
      
      Jika diberikan gambar struk belanja (receiptImage), lakukan OCR / ekstraksi detail item, total belanja, tanggal, dan sarankan kategori pengeluaran yang tepat dalam format JSON parsable bila memungkinkan atau deskripsi yang terstruktur.
    `;

    let responseText = '';

    if (receiptImage) {
      // Vision model / receipt scan
      const base64Data = receiptImage.replace(/^data:image\/\w+;base64,/, '');
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
            {
              text:
                prompt ||
                'Ekstrak informasi dari struk belanja ini: Nama Toko, Tanggal, Total Belanja, dan Rekomendasi Kategori Pengeluaran.',
            },
          ],
        },
        config: { systemInstruction },
      });
      responseText = response.text || 'Gagal membaca struk belanja.';
    } else {
      // Financial advice based on user stats
      const fullPrompt = `
        Data Keuangan Pengguna Saat Ini:
        - Total Pemasukan Bulan Ini: Rp ${userFinancials?.totalIncome?.toLocaleString('id-ID') || 0}
        - Total Pengeluaran Bulan Ini: Rp ${userFinancials?.totalExpense?.toLocaleString('id-ID') || 0}
        - Total Saldo Semua Rekening: Rp ${userFinancials?.totalBalance?.toLocaleString('id-ID') || 0}
        - Kategori Pengeluaran Terbesar: ${userFinancials?.topCategory || 'Makanan'}
        
        Pertanyaan Pengguna: "${prompt}"
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: fullPrompt,
        config: { systemInstruction },
      });
      responseText = response.text || 'Gagal menghasilkan analisis AI.';
    }

    res.json({ text: responseText });
  } catch (error: any) {
    console.error('AI Advisor error:', error);
    res.status(500).json({ error: error.message || 'Terjadi kesalahan pada layanan AI Gemini.' });
  }
});

// VITE MIDDLEWARE SETUP
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server Keuangan Dompetku berjalan di http://localhost:${PORT} (atau http://127.0.0.1:${PORT})`);
  });
}

startServer();
