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
  users: [],
  accounts: [],
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
  transactions: [],
  budgets: [],
  goals: [],
  reminders: {
    enabled: true,
    time: '20:00',
    streakDays: 0,
    lastLoggedDate: '',
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
  const { email, name } = req.body;
  const db = readDb();
  const user = db.users.find((u: any) => u.email.toLowerCase() === (email || '').toLowerCase());

  if (user) {
    if (name && !user.name) user.name = name;
    res.json({ success: true, user });
  } else {
    const newUser = {
      id: 'user-' + Date.now(),
      name: name || (email ? email.split('@')[0] : 'Pengguna Baru'),
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
  const userId = (req.query.userId as string) || '';
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
  const userId = (req.query.userId as string) || '';
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
    userId: userId || '',
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
  const userId = (req.query.userId as string) || '';
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
  const userId = (req.query.userId as string) || '';
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
