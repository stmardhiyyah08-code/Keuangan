import React, { useState } from 'react';
import { UserCheck, Plus, X, Shield, Mail, Lock, LogIn } from 'lucide-react';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User;
  onSwitchUser: (user: User) => void;
  onLoginOrCreate: (email: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onSwitchUser,
  onLoginOrCreate,
}) => {
  const [email, setEmail] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    onLoginOrCreate(email);
    setEmail('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              Ganti Profil / Akun Pengguna
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Available User Profiles List */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Pilih Profil Terdaftar:
          </span>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  onSwitchUser(u);
                  onClose();
                }}
                className={`w-full p-3 rounded-2xl border flex items-center justify-between transition ${
                  currentUser.id === u.id
                    ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-100 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{u.name}</div>
                    <div className="text-[10px] text-slate-500">{u.email}</div>
                  </div>
                </div>
                {currentUser.id === u.id && (
                  <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-extrabold">
                    Aktif
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Login / Add Profile Form */}
        <form onSubmit={handleSubmit} className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Masuk / Tambah Profil Baru:
          </span>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email pengguna baru..."
              className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
          >
            <LogIn className="w-4 h-4" />
            <span>Masuk / Buka Profil</span>
          </button>
        </form>
      </div>
    </div>
  );
};
