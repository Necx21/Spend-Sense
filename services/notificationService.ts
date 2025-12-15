import { AppSettings } from '../types';
import { StorageService } from './storageService';

export const NotificationService = {
  requestPermission: async () => {
    if (!("Notification" in window)) return;
    
    if (Notification.permission !== "granted") {
      await Notification.requestPermission();
    }
  },

  scheduleNotifications: async () => {
    const settings = await StorageService.getSettings();
    const prefs = settings.notifications;

    if (!prefs.enabled) {
      // Clear all timers
      const existing = (window as any).notificationTimers || [];
      existing.forEach((t: any) => clearTimeout(t));
      (window as any).notificationTimers = [];
      return;
    }

    // Clear existing
    if ((window as any).notificationTimers) {
      (window as any).notificationTimers.forEach((t: any) => clearTimeout(t));
    }
    (window as any).notificationTimers = [];

    // 1. Daily Custom Reminder
    if (prefs.dailyReminder) {
        scheduleDaily(prefs.dailyTime, "📝 Log your daily expenses! Stay on track.");
    }

    // 2. Weekly Summary
    if (prefs.weeklySummary) {
        scheduleWeekly(prefs.weeklyDay, prefs.weeklyTime, "📊 Your weekly spending summary is ready.");
    }

    // 3. Random Nudges (15 times logic)
    if (prefs.randomNudges) {
        scheduleRandomNudges(15);
    }
  },

  showNotification: (title: string, body: string, isCritical: boolean = false) => {
    if (Notification.permission === "granted") {
      // Web Notification API
      const options: NotificationOptions = {
        body: body,
        icon: '/favicon.ico',
        tag: 'spendsense-notification',
        // 'requireInteraction' keeps it on screen until user clicks (good for critical)
        requireInteraction: isCritical, 
        silent: false,
      };
      
      const n = new Notification(title, options);
    }
  }
};

// --- Helpers ---

function scheduleDaily(timeStr: string, message: string) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);

    if (target.getTime() < now.getTime()) {
        target.setDate(target.getDate() + 1); // Schedule for tomorrow
    }

    const delay = target.getTime() - now.getTime();
    
    const id = setTimeout(() => {
        NotificationService.showNotification("Daily Reminder", message);
        // Reschedule for next day recursively
        scheduleDaily(timeStr, message);
    }, delay);

    (window as any).notificationTimers.push(id);
}

function scheduleWeekly(dayOfWeek: number, timeStr: string, message: string) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const now = new Date();
    const target = new Date();
    
    target.setHours(hours, minutes, 0, 0);
    
    // Adjust to next occurrence of dayOfWeek
    const currentDay = target.getDay();
    const distance = (dayOfWeek + 7 - currentDay) % 7;
    target.setDate(target.getDate() + distance);
    
    if (target.getTime() < now.getTime()) {
        target.setDate(target.getDate() + 7);
    }

    const delay = target.getTime() - now.getTime();

    const id = setTimeout(() => {
        NotificationService.showNotification("Weekly Insight", message);
        scheduleWeekly(dayOfWeek, timeStr, message);
    }, delay);
    
    (window as any).notificationTimers.push(id);
}

function scheduleRandomNudges(count: number) {
    const messages = [
      "👀 Bought a coffee? Track it!",
      "📉 Keep your budget in check.",
      "💡 Smart spenders track every penny.",
      "🤔 Have you spent money recently?",
      "💸 Every rupee counts!",
      "🚀 Stay on top of your finances.",
      "🛑 Stop and think before you buy.",
      "📝 Quick check-in: Log your expenses."
    ];
    
    // Schedule 'count' notifications randomly over the next 12 hours
    const twelveHours = 12 * 60 * 60 * 1000;
    
    for (let i = 0; i < count; i++) {
        const offset = Math.floor(Math.random() * twelveHours);
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        
        const id = setTimeout(() => {
            NotificationService.showNotification("SpendSense Nudge", randomMsg);
        }, offset);
        
        (window as any).notificationTimers.push(id);
    }
}