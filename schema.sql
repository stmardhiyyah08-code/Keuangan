-- ====================================================================
-- SKEMA DATABASE POSTGRESQL / SUPABASE UNTUK APLIKASI DOMPETKU (MANDIRI)
-- Dokumentasi: https://supabase.com/docs/guides/database/tables
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 2. TABEL PROFIL / PENGGUNA (PROFILES)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    currency TEXT DEFAULT 'IDR',
    dark_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger Otomatis: Buat Profil saat Pengguna mendaftar melalui Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, public.profiles.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang trigger pada tabel auth.users jika berjalan di lingkungan Supabase
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users') THEN
    CREATE OR REPLACE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- ====================================================================
-- 3. TABEL DOMPET & REKENING (ACCOUNTS)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.accounts (
    id TEXT PRIMARY KEY DEFAULT ('acc-' || extract(epoch from now())::bigint || '-' || floor(random() * 1000)::text),
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'e-wallet', 'investment', 'credit')),
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    account_number TEXT,
    icon TEXT DEFAULT 'Wallet',
    color TEXT DEFAULT '#10B981',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 4. TABEL KATEGORI TRANSAKSI (CATEGORIES)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY DEFAULT ('cat-' || extract(epoch from now())::bigint || '-' || floor(random() * 1000)::text),
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL untuk kategori bawaan global
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
    icon TEXT DEFAULT 'Tag',
    color TEXT DEFAULT '#3B82F6',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 5. TABEL CATATAN TRANSAKSI (TRANSACTIONS)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY DEFAULT ('tx-' || extract(epoch from now())::bigint || '-' || floor(random() * 1000)::text),
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    target_account_id TEXT REFERENCES public.accounts(id) ON DELETE SET NULL,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time TIME DEFAULT CURRENT_TIME,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 6. TABEL ANGGARAN BULANAN (BUDGETS)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.budgets (
    id TEXT PRIMARY KEY DEFAULT ('bgt-' || extract(epoch from now())::bigint || '-' || floor(random() * 1000)::text),
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    monthly_limit NUMERIC(15, 2) NOT NULL CHECK (monthly_limit >= 0),
    month_year TEXT NOT NULL, -- Format YYYY-MM (contoh: '2026-08')
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_category_month UNIQUE (user_id, category_id, month_year)
);

-- ====================================================================
-- 7. TABEL TARGET IMPAN KEUIANGAN (GOALS)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.goals (
    id TEXT PRIMARY KEY DEFAULT ('goal-' || extract(epoch from now())::bigint || '-' || floor(random() * 1000)::text),
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_amount NUMERIC(15, 2) NOT NULL CHECK (target_amount > 0),
    current_amount NUMERIC(15, 2) DEFAULT 0.00 CHECK (current_amount >= 0),
    target_date DATE NOT NULL,
    category TEXT DEFAULT 'Umum',
    icon TEXT DEFAULT 'Target',
    color TEXT DEFAULT '#2563EB',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 8. TABEL PENGINGAT HARIAN & STREAK (REMINDERS)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.reminders (
    user_id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    time TIME DEFAULT '20:00',
    streak_days INT DEFAULT 0,
    last_logged_date DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 9. INDEKS UNTUK PERFORMA QUERY
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON public.budgets(user_id, month_year);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);

-- ====================================================================
-- 10. TRIGGER OTOMATIS UPDATED_AT
-- ====================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER set_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER set_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER set_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER set_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS Kompatibel (Anon / Authenticated User)
DROP POLICY IF EXISTS "Public Read Categories" ON public.categories;
CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Categories User Write" ON public.categories;
CREATE POLICY "Categories User Write" ON public.categories FOR ALL USING (user_id IS NULL OR user_id = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS "Profiles Full Access" ON public.profiles;
CREATE POLICY "Profiles Full Access" ON public.profiles FOR ALL USING (true);

DROP POLICY IF EXISTS "Accounts Full Access" ON public.accounts;
CREATE POLICY "Accounts Full Access" ON public.accounts FOR ALL USING (true);

DROP POLICY IF EXISTS "Transactions Full Access" ON public.transactions;
CREATE POLICY "Transactions Full Access" ON public.transactions FOR ALL USING (true);

DROP POLICY IF EXISTS "Budgets Full Access" ON public.budgets;
CREATE POLICY "Budgets Full Access" ON public.budgets FOR ALL USING (true);

DROP POLICY IF EXISTS "Goals Full Access" ON public.goals;
CREATE POLICY "Goals Full Access" ON public.goals FOR ALL USING (true);

DROP POLICY IF EXISTS "Reminders Full Access" ON public.reminders;
CREATE POLICY "Reminders Full Access" ON public.reminders FOR ALL USING (true);

-- ====================================================================
-- 12. SEED DATA KATEGORI DEFAULT INDONESIA
-- ====================================================================
INSERT INTO public.categories (id, user_id, name, type, icon, color, is_default)
VALUES
  ('exp-1', NULL, 'Makanan & Minuman', 'expense', 'Utensils', '#EF4444', true),
  ('exp-2', NULL, 'Belanja Bulanan', 'expense', 'ShoppingCart', '#F97316', true),
  ('exp-3', NULL, 'Transportasi & Bensin', 'expense', 'Car', '#F59E0B', true),
  ('exp-4', NULL, 'Tagihan & Utilitas', 'expense', 'Zap', '#10B981', true),
  ('exp-5', NULL, 'Hiburan & Hobi', 'expense', 'Film', '#8B5CF6', true),
  ('exp-6', NULL, 'Kesehatan & Obat', 'expense', 'HeartPulse', '#EC4899', true),
  ('exp-7', NULL, 'Pendidikan & Kursus', 'expense', 'GraduationCap', '#3B82F6', true),
  ('exp-8', NULL, 'Cicilan & Utang', 'expense', 'CreditCard', '#64748B', true),
  ('exp-9', NULL, 'Zakat & Sedekah', 'expense', 'Gift', '#14B8A6', true),
  ('exp-10', NULL, 'Lain-lain', 'expense', 'MoreHorizontal', '#94A3B8', true),
  ('inc-1', NULL, 'Gaji Bulanan', 'income', 'Briefcase', '#10B981', true),
  ('inc-2', NULL, 'Usaha & Bisnis', 'income', 'Store', '#059669', true),
  ('inc-3', NULL, 'Bonus & THR', 'income', 'Award', '#F59E0B', true),
  ('inc-4', NULL, 'Investasi & Dividen', 'income', 'TrendingUp', '#6366F1', true),
  ('inc-5', NULL, 'Pemasukan Lainnya', 'income', 'PlusCircle', '#84CC16', true)
ON CONFLICT (id) DO NOTHING;
