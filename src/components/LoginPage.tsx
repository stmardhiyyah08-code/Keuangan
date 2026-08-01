import React, { useState } from 'react';
import {
  Wallet,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  User,
  Mail,
  Lock,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Database,
  UserCheck,
} from 'lucide-react';

interface LoginPageProps {
  onLoginOrCreate: (email: string, name?: string) => Promise<void> | void;
  onContinueAsGuest?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginOrCreate,
  onContinueAsGuest,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Harap masukkan alamat email Anda.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    try {
      await onLoginOrCreate(email.trim(), isRegister ? name.trim() : undefined);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan saat masuk. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Dynamic Background Glow & Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-pink-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10 my-auto">
        {/* Left Side: Brand Hero Section */}
        <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-indigo-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-xs">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Dompetku v2.0 • AI Financial Assistant</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30">
                <Wallet className="w-8 h-8" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Dompetku<span className="text-emerald-400">.</span>
              </h1>
            </div>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
              Kelola dompet, anggaran bulanan, dan tabungan Anda secara cerdas dengan analisis finansial otomatis berbasis AI Gemini & Supabase Cloud.
            </p>
          </div>

          {/* Key Feature Badges */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-2.5">
              <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-slate-300">Multi-Rekening</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-2.5">
              <BarChart3 className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-xs font-bold text-slate-300">Laporan Visual</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="text-xs font-bold text-slate-300">Gemini AI OCR</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-2.5">
              <Database className="w-4 h-4 text-teal-400 shrink-0" />
              <span className="text-xs font-bold text-slate-300">Supabase Sync</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card Form */}
        <div className="lg:col-span-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Form Header / Tabs */}
          <div className="space-y-4">
            <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition ${
                  !isRegister
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Masuk / Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition ${
                  isRegister
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Daftar Akun Baru
              </button>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">
                {isRegister ? 'Buat Akun Keuangan Anda' : 'Selamat Datang Kembali!'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isRegister
                  ? 'Masukkan data Anda untuk membuat akun dan mulai mengelola saldo.'
                  : 'Masukkan email terdaftar Anda untuk masuk ke dasbor.'}
              </p>
            </div>
          </div>

          {/* Alert Error */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-800/80 text-xs font-bold text-rose-300">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Nama Lengkap / Nama Profil
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    required={isRegister}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Ahmad Rizky"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-white placeholder-slate-600 transition"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-white placeholder-slate-600 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/25 active:scale-95 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isRegister ? 'Daftar & Buka Akun' : 'Masuk ke Dasbor'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Guest / Demo Option */}
          {onContinueAsGuest && (
            <div className="pt-3 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="text-xs font-bold text-slate-400 hover:text-emerald-400 transition"
              >
                Atau lanjutkan sebagai <span className="underline">Tamu / Pengunjung Demo</span> →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
