import React, { useState } from 'react';
import { Bell, Flame, CheckCircle2, Clock, X, Volume2 } from 'lucide-react';
import { DailyReminder } from '../types';
import { requestNotificationPermission, sendLocalNotification } from '../lib/notifications';

interface ReminderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminder: DailyReminder;
  onSaveReminder: (reminder: Partial<DailyReminder>) => void;
}

export const ReminderSettingsModal: React.FC<ReminderSettingsModalProps> = ({
  isOpen,
  onClose,
  reminder,
  onSaveReminder,
}) => {
  const [enabled, setEnabled] = useState(reminder.enabled);
  const [time, setTime] = useState(reminder.time || '20:00');
  const [permissionGranted, setPermissionGranted] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    if (granted) {
      sendLocalNotification('Pengingat Dompetku Aktif 🔔', {
        body: 'Anda akan menerima notifikasi harian untuk mencatat transaksi keuangan!',
      });
    }
  };

  const handleSave = () => {
    onSaveReminder({ enabled, time });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              Pengingat Pencatatan Harian
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Streak Stats Card */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flame className="w-8 h-8 text-amber-500 fill-amber-500 animate-bounce" />
            <div>
              <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                Streak Pencatatan Rutin
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Konsistensi mencatat setiap hari
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-amber-700 dark:text-amber-400">
            {reminder.streakDays} Hari 🔥
          </div>
        </div>

        {/* Toggle & Time Setting */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Aktifkan Notifikasi Harian
            </span>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
              Waktu Pengingat Setiap Hari
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Browser Permission Button */}
          {!permissionGranted && (
            <button
              type="button"
              onClick={handleRequestPermission}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <Volume2 className="w-4 h-4" />
              <span>Izinkan Notifikasi Browser Web</span>
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md"
          >
            Simpan Pengaturan
          </button>
        </div>
      </div>
    </div>
  );
};
