var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "10mb" }));
var DATA_DIR = import_path.default.join(process.cwd(), "data");
var DB_FILE = import_path.default.join(DATA_DIR, "db.json");
if (!import_fs.default.existsSync(DATA_DIR)) {
  import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
}
var DEFAULT_DB = {
  users: [],
  accounts: [],
  categories: [
    { id: "exp-1", name: "Makanan & Minuman", type: "expense", icon: "Utensils", color: "#EF4444", isDefault: true },
    { id: "exp-2", name: "Belanja Bulanan", type: "expense", icon: "ShoppingCart", color: "#F97316", isDefault: true },
    { id: "exp-3", name: "Transportasi & Bensin", type: "expense", icon: "Car", color: "#F59E0B", isDefault: true },
    { id: "exp-4", name: "Tagihan & Utilitas", type: "expense", icon: "Zap", color: "#10B981", isDefault: true },
    { id: "exp-5", name: "Hiburan & Hobi", type: "expense", icon: "Film", color: "#8B5CF6", isDefault: true },
    { id: "exp-6", name: "Kesehatan & Obat", type: "expense", icon: "HeartPulse", color: "#EC4899", isDefault: true },
    { id: "exp-7", name: "Pendidikan & Kursus", type: "expense", icon: "GraduationCap", color: "#3B82F6", isDefault: true },
    { id: "exp-8", name: "Cicilan & Utang", type: "expense", icon: "CreditCard", color: "#64748B", isDefault: true },
    { id: "exp-9", name: "Zakat & Sedekah", type: "expense", icon: "Gift", color: "#14B8A6", isDefault: true },
    { id: "exp-10", name: "Lain-lain", type: "expense", icon: "MoreHorizontal", color: "#94A3B8", isDefault: true },
    { id: "inc-1", name: "Gaji Bulanan", type: "income", icon: "Briefcase", color: "#10B981", isDefault: true },
    { id: "inc-2", name: "Usaha & Bisnis", type: "income", icon: "Store", color: "#059669", isDefault: true },
    { id: "inc-3", name: "Bonus & THR", type: "income", icon: "Award", color: "#F59E0B", isDefault: true },
    { id: "inc-4", name: "Investasi & Dividen", type: "income", icon: "TrendingUp", color: "#6366F1", isDefault: true },
    { id: "inc-5", name: "Pemasukan Lainnya", type: "income", icon: "PlusCircle", color: "#84CC16", isDefault: true }
  ],
  transactions: [],
  budgets: [],
  goals: [],
  reminders: {
    enabled: true,
    time: "20:00",
    streakDays: 0,
    lastLoggedDate: ""
  },
  supabaseConfig: {
    url: "",
    anonKey: "",
    isConnected: false,
    lastSyncedAt: (/* @__PURE__ */ new Date()).toISOString()
  }
};
function readDb() {
  try {
    if (!import_fs.default.existsSync(DB_FILE)) {
      import_fs.default.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2));
      return DEFAULT_DB;
    }
    const data = import_fs.default.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading DB, resetting to defaults:", err);
    return DEFAULT_DB;
  }
}
function writeDb(dbData) {
  try {
    import_fs.default.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2));
  } catch (err) {
    console.error("Error writing DB:", err);
  }
}
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get("/api/sync/status", (req, res) => {
  const db = readDb();
  res.json({
    synced: true,
    lastSyncedAt: (/* @__PURE__ */ new Date()).toISOString(),
    supabaseConnected: db.supabaseConfig?.isConnected || false
  });
});
app.get("/api/users", (req, res) => {
  const db = readDb();
  res.json(db.users);
});
app.post("/api/users/login", (req, res) => {
  const { email, name } = req.body;
  const db = readDb();
  const user = db.users.find((u) => u.email.toLowerCase() === (email || "").toLowerCase());
  if (user) {
    if (name && !user.name) user.name = name;
    res.json({ success: true, user });
  } else {
    const newUser = {
      id: "user-" + Date.now(),
      name: name || (email ? email.split("@")[0] : "Pengguna Baru"),
      email,
      currency: "IDR",
      darkMode: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.users.push(newUser);
    writeDb(db);
    res.json({ success: true, user: newUser });
  }
});
app.get("/api/transactions", (req, res) => {
  const userId = req.query.userId || "";
  const db = readDb();
  const userTxs = db.transactions.filter((t) => t.userId === userId);
  res.json(userTxs);
});
app.post("/api/transactions", (req, res) => {
  const newTx = { ...req.body, id: "tx-" + Date.now(), createdAt: (/* @__PURE__ */ new Date()).toISOString() };
  const db = readDb();
  const account = db.accounts.find((a) => a.id === newTx.accountId);
  if (account) {
    if (newTx.type === "income") {
      account.balance += Number(newTx.amount);
    } else if (newTx.type === "expense") {
      account.balance -= Number(newTx.amount);
    } else if (newTx.type === "transfer" && newTx.targetAccountId) {
      account.balance -= Number(newTx.amount);
      const targetAcc = db.accounts.find((a) => a.id === newTx.targetAccountId);
      if (targetAcc) {
        targetAcc.balance += Number(newTx.amount);
      }
    }
  }
  if (db.reminders) {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    if (db.reminders.lastLoggedDate !== today) {
      db.reminders.streakDays = (db.reminders.streakDays || 0) + 1;
      db.reminders.lastLoggedDate = today;
    }
  }
  db.transactions.unshift(newTx);
  writeDb(db);
  res.json({ success: true, transaction: newTx, accounts: db.accounts });
});
app.put("/api/transactions/:id", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const index = db.transactions.findIndex((t) => t.id === id);
  if (index !== -1) {
    db.transactions[index] = { ...db.transactions[index], ...req.body };
    writeDb(db);
    res.json({ success: true, transaction: db.transactions[index] });
  } else {
    res.status(404).json({ error: "Transaction not found" });
  }
});
app.delete("/api/transactions/:id", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const tx = db.transactions.find((t) => t.id === id);
  if (tx) {
    const account = db.accounts.find((a) => a.id === tx.accountId);
    if (account) {
      if (tx.type === "income") account.balance -= Number(tx.amount);
      if (tx.type === "expense") account.balance += Number(tx.amount);
      if (tx.type === "transfer" && tx.targetAccountId) {
        account.balance += Number(tx.amount);
        const targetAcc = db.accounts.find((a) => a.id === tx.targetAccountId);
        if (targetAcc) targetAcc.balance -= Number(tx.amount);
      }
    }
    db.transactions = db.transactions.filter((t) => t.id !== id);
    writeDb(db);
    res.json({ success: true, accounts: db.accounts });
  } else {
    res.status(404).json({ error: "Transaction not found" });
  }
});
app.get("/api/accounts", (req, res) => {
  const userId = req.query.userId || "";
  const db = readDb();
  res.json(db.accounts.filter((a) => a.userId === userId));
});
app.post("/api/accounts", (req, res) => {
  const newAccount = { ...req.body, id: "acc-" + Date.now() };
  const db = readDb();
  db.accounts.push(newAccount);
  writeDb(db);
  res.json({ success: true, account: newAccount });
});
app.put("/api/accounts/:id", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const index = db.accounts.findIndex((a) => a.id === id);
  if (index !== -1) {
    db.accounts[index] = { ...db.accounts[index], ...req.body };
    writeDb(db);
    res.json({ success: true, account: db.accounts[index] });
  } else {
    res.status(404).json({ error: "Account not found" });
  }
});
app.post("/api/accounts/transfer", (req, res) => {
  const { userId, sourceAccountId, targetAccountId, amount, description, date } = req.body;
  const db = readDb();
  const source = db.accounts.find((a) => a.id === sourceAccountId);
  const target = db.accounts.find((a) => a.id === targetAccountId);
  if (!source || !target) {
    return res.status(400).json({ error: "Rekening asal atau tujuan tidak ditemukan." });
  }
  source.balance -= Number(amount);
  target.balance += Number(amount);
  const transferTx = {
    id: "tx-" + Date.now(),
    userId: userId || "",
    type: "transfer",
    amount: Number(amount),
    categoryId: "exp-10",
    accountId: sourceAccountId,
    targetAccountId,
    date: date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    time: (/* @__PURE__ */ new Date()).toTimeString().slice(0, 5),
    description: description || `Transfer dari ${source.name} ke ${target.name}`,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.transactions.unshift(transferTx);
  writeDb(db);
  res.json({ success: true, transaction: transferTx, accounts: db.accounts });
});
app.get("/api/categories", (req, res) => {
  const db = readDb();
  res.json(db.categories);
});
app.get("/api/budgets", (req, res) => {
  const userId = req.query.userId || "";
  const db = readDb();
  res.json(db.budgets.filter((b) => b.userId === userId));
});
app.post("/api/budgets", (req, res) => {
  const { userId, categoryId, monthlyLimit, monthYear } = req.body;
  const db = readDb();
  const existingIndex = db.budgets.findIndex((b) => b.userId === userId && b.categoryId === categoryId && b.monthYear === monthYear);
  if (existingIndex !== -1) {
    db.budgets[existingIndex].monthlyLimit = Number(monthlyLimit);
  } else {
    db.budgets.push({
      id: "bgt-" + Date.now(),
      userId,
      categoryId,
      monthlyLimit: Number(monthlyLimit),
      monthYear: monthYear || "2026-08"
    });
  }
  writeDb(db);
  res.json({ success: true, budgets: db.budgets.filter((b) => b.userId === userId) });
});
app.get("/api/goals", (req, res) => {
  const userId = req.query.userId || "";
  const db = readDb();
  res.json(db.goals.filter((g) => g.userId === userId));
});
app.post("/api/goals", (req, res) => {
  const newGoal = { ...req.body, id: "goal-" + Date.now(), currentAmount: req.body.currentAmount || 0 };
  const db = readDb();
  db.goals.push(newGoal);
  writeDb(db);
  res.json({ success: true, goal: newGoal });
});
app.put("/api/goals/:id", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const index = db.goals.findIndex((g) => g.id === id);
  if (index !== -1) {
    db.goals[index] = { ...db.goals[index], ...req.body };
    writeDb(db);
    res.json({ success: true, goal: db.goals[index] });
  } else {
    res.status(404).json({ error: "Goal not found" });
  }
});
app.get("/api/reminders", (req, res) => {
  const db = readDb();
  res.json(db.reminders || { enabled: true, time: "20:00", streakDays: 0 });
});
app.put("/api/reminders", (req, res) => {
  const db = readDb();
  db.reminders = { ...db.reminders, ...req.body };
  writeDb(db);
  res.json({ success: true, reminders: db.reminders });
});
app.get("/api/supabase-config", (req, res) => {
  const db = readDb();
  res.json(db.supabaseConfig || { url: "", anonKey: "", isConnected: false });
});
app.post("/api/supabase-config", (req, res) => {
  const { url, anonKey } = req.body;
  const db = readDb();
  db.supabaseConfig = {
    url,
    anonKey,
    isConnected: Boolean(url && anonKey),
    lastSyncedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  writeDb(db);
  res.json({ success: true, supabaseConfig: db.supabaseConfig });
});
app.post("/api/ai/advisor", async (req, res) => {
  try {
    const { prompt, receiptImage, userFinancials } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY belum dikonfigurasi di Environment Secrets."
      });
    }
    const ai = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    const systemInstruction = `
      Anda adalah Penasihat Keuangan Pintar untuk aplikasi "Dompetku".
      Tugas Anda adalah memberikan saran keuangan yang praktis, realistis, dan ramah dalam bahasa Indonesia yang santun.
      
      Format respon Anda harus menggunakan Markdown yang rapi dengan bullet points, angka cetak tebal, dan emote yang relevan.
      Jika diberikan data keuangan pengguna (total pemasukan, pengeluaran, saldo, kategori pengeluaran terbesar), berikan analisis rasio 50/30/20 dan rekomendasi penghematan konkret.
      
      Jika diberikan gambar struk belanja (receiptImage), lakukan OCR / ekstraksi detail item, total belanja, tanggal, dan sarankan kategori pengeluaran yang tepat dalam format JSON parsable bila memungkinkan atau deskripsi yang terstruktur.
    `;
    let responseText = "";
    if (receiptImage) {
      const base64Data = receiptImage.replace(/^data:image\/\w+;base64,/, "");
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Data } },
            {
              text: prompt || "Ekstrak informasi dari struk belanja ini: Nama Toko, Tanggal, Total Belanja, dan Rekomendasi Kategori Pengeluaran."
            }
          ]
        },
        config: { systemInstruction }
      });
      responseText = response.text || "Gagal membaca struk belanja.";
    } else {
      const fullPrompt = `
        Data Keuangan Pengguna Saat Ini:
        - Total Pemasukan Bulan Ini: Rp ${userFinancials?.totalIncome?.toLocaleString("id-ID") || 0}
        - Total Pengeluaran Bulan Ini: Rp ${userFinancials?.totalExpense?.toLocaleString("id-ID") || 0}
        - Total Saldo Semua Rekening: Rp ${userFinancials?.totalBalance?.toLocaleString("id-ID") || 0}
        - Kategori Pengeluaran Terbesar: ${userFinancials?.topCategory || "Makanan"}
        
        Pertanyaan Pengguna: "${prompt}"
      `;
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: fullPrompt,
        config: { systemInstruction }
      });
      responseText = response.text || "Gagal menghasilkan analisis AI.";
    }
    res.json({ text: responseText });
  } catch (error) {
    console.error("AI Advisor error:", error);
    res.status(500).json({ error: error.message || "Terjadi kesalahan pada layanan AI Gemini." });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F680} Server Keuangan Dompetku berjalan di http://localhost:${PORT} (atau http://127.0.0.1:${PORT})`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
