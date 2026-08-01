import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, Camera, RefreshCw, Upload, Receipt, Lightbulb } from 'lucide-react';
import Markdown from 'react-markdown';
import { askGeminiAdvisor } from '../lib/api';
import { Transaction, Account } from '../types';

interface AiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  accounts: Account[];
}

export const AiAdvisorModal: React.FC<AiAdvisorModalProps> = ({
  isOpen,
  onClose,
  transactions,
  accounts,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Compute financial totals for prompt
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthTxs = transactions.filter((t) => t.date.startsWith(currentMonthPrefix));

  const totalIncome = currentMonthTxs
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = currentMonthTxs
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

  const presetPrompts = [
    'Analisis kesehatan keuangan saya bulan ini',
    'Beri saran penghematan konkret berdasarkan pengeluaran saya',
    'Bagaimana alokasi tabungan ideal 50/30/20 untuk saya?',
  ];

  const handleSend = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt && !receiptImage) return;

    setLoading(true);
    setError(null);

    try {
      const res = await askGeminiAdvisor({
        prompt: finalPrompt || 'Scan dan ekstrak detail dari gambar struk ini.',
        receiptImage: receiptImage || undefined,
        userFinancials: {
          totalIncome,
          totalExpense,
          totalBalance,
          topCategory: 'Makanan & Belanja',
        },
      });

      setResponse(res);
    } catch (err: any) {
      setError(err.message || 'Gagal menghubungi Penasihat AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] flex flex-col my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Penasihat Keuangan AI Gemini
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Asisten pintar untuk analisis anggaran, rekomendasi, & OCR Struk
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Response Output */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[220px]">
          {response ? (
            <div className="p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/50 space-y-3">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs">
                <Bot className="w-4 h-4 text-purple-600" />
                <span>Hasil Analisis AI Gemini:</span>
              </div>
              <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed dark:prose-invert">
                <Markdown>{response}</Markdown>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
                <Lightbulb className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Tanyakan Apapun tentang Keuangan Anda
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pilih rekomendasi pertanyaan di bawah ini atau unggah foto struk belanja Anda untuk diekstrak otomatis.
                </p>
              </div>

              {/* Preset Prompts */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {presetPrompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setPrompt(p);
                      handleSend(p);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-900/50 transition border border-slate-200 dark:border-slate-700"
                  >
                    "{p}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
              {error}
            </div>
          )}

          {receiptImage && (
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={receiptImage}
                  alt="Struk"
                  className="w-12 h-12 object-cover rounded-xl border border-slate-200"
                />
                <div>
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    Struk Belanja Terpilih
                  </div>
                  <div className="text-[10px] text-slate-500">Siap dianalisis oleh OCR Gemini</div>
                </div>
              </div>
              <button
                onClick={() => setReceiptImage(null)}
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                Hapus
              </button>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="shrink-0 space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <label
              title="Unggah Gambar Struk Belanja"
              className="cursor-pointer p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
            >
              <Camera className="w-4 h-4 text-purple-600" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ketik pertanyaan keuangan Anda..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <button
              onClick={() => handleSend()}
              disabled={loading || (!prompt && !receiptImage)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menganalisis...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Kirim</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
