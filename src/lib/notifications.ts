export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Browser tidak mendukung notifikasi web.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function sendLocalNotification(title: string, options?: NotificationOptions) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icon.png',
      badge: '/icon.png',
      ...options,
    });
  }
}

export function setupDailyReminderCheck(reminderTime: string, onReminderTrigger: () => void) {
  // reminderTime is e.g. "20:00"
  const checkInterval = setInterval(() => {
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;

    if (currentTimeStr === reminderTime) {
      const todayStr = now.toISOString().split('T')[0];
      const lastTriggered = localStorage.getItem('last_reminder_triggered_date');
      
      if (lastTriggered !== todayStr) {
        localStorage.setItem('last_reminder_triggered_date', todayStr);
        onReminderTrigger();
      }
    }
  }, 30000); // Check every 30 seconds

  return () => clearInterval(checkInterval);
}
