import { Transaction, Category, AppSettings, TransactionType } from '../types';
import { DEFAULT_CATEGORIES, STORAGE_KEYS, CURRENCIES } from '../constants';

// Broadcast Channel for Real-Time Sync across tabs
const syncChannel = new BroadcastChannel('spendsense_sync');

export const StorageService = {
  // --- Sync Helpers ---
  notifyUpdate: () => {
    syncChannel.postMessage({ type: 'UPDATE' });
  },

  listenForUpdates: (callback: () => void) => {
    syncChannel.onmessage = (event) => {
      if (event.data.type === 'UPDATE') {
        callback();
      }
    };
  },

  // --- Transactions ---
  getTransactions: async (): Promise<Transaction[]> => {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  },

  saveTransaction: async (transaction: Transaction): Promise<void> => {
    const transactions = await StorageService.getTransactions();
    const index = transactions.findIndex((t) => t.id === transaction.id);
    if (index >= 0) {
      transactions[index] = transaction;
    } else {
      transactions.unshift(transaction); // Add to beginning
    }
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    StorageService.notifyUpdate();
  },

  deleteTransaction: async (id: string): Promise<void> => {
    const transactions = await StorageService.getTransactions();
    const filtered = transactions.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filtered));
    StorageService.notifyUpdate();
  },

  // --- Categories ---
  getCategories: async (): Promise<Category[]> => {
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!data) {
      // Seed default
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    }
    return JSON.parse(data);
  },

  saveCategory: async (category: Category): Promise<void> => {
    const categories = await StorageService.getCategories();
    const idx = categories.findIndex(c => c.id === category.id);
    if (idx >= 0) {
        categories[idx] = category;
    } else {
        categories.push(category);
    }
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    StorageService.notifyUpdate();
  },

  deleteCategory: async (id: string): Promise<void> => {
    const categories = await StorageService.getCategories();
    const filtered = categories.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(filtered));
    StorageService.notifyUpdate();
  },

  // --- Settings ---
  getSettings: async (): Promise<AppSettings> => {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    
    const defaultSettings: AppSettings = { 
        currencyCode: 'INR', 
        theme: 'dark', 
        monthlyBudget: 20000,
        savingsGoal: 5000,
        profile: {
            name: 'User',
            username: '@spendsense',
            avatarId: '😎'
        },
        notifications: {
            enabled: true,
            dailyReminder: true,
            dailyTime: '20:00',
            randomNudges: false,
            weeklySummary: true,
            weeklyDay: 0,
            weeklyTime: '09:00',
            budgetAlert: true,
            budgetThreshold: 90,
            criticalAlerts: false
        }
    };

    if (data) {
        try {
            const parsed = JSON.parse(data);
            // Robust merge: Ensure profile and notifications objects exist by merging with defaults
            return {
                ...defaultSettings,
                ...parsed,
                profile: { 
                    ...defaultSettings.profile, 
                    ...(parsed.profile || {}) 
                },
                notifications: { 
                    ...defaultSettings.notifications, 
                    ...(parsed.notifications || {}) 
                }
            };
        } catch (e) {
            console.error("Error parsing settings", e);
            return defaultSettings;
        }
    }
    
    return defaultSettings;
  },

  saveSettings: async (settings: AppSettings): Promise<void> => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    StorageService.notifyUpdate();
    // Dispatch local event to ensure current tab updates immediately (e.g., Theme change)
    window.dispatchEvent(new Event('storage'));
  },

  // --- Backup / Export / Import ---
  exportData: async (): Promise<string> => {
    const t = await StorageService.getTransactions();
    const c = await StorageService.getCategories();
    const s = await StorageService.getSettings();
    return JSON.stringify({ transactions: t, categories: c, settings: s });
  },

  importData: async (content: string): Promise<boolean> => {
      try {
          // 1. Try JSON Import (SpendSense Backup)
          if (content.trim().startsWith('{')) {
              const data = JSON.parse(content);
              if (data.transactions && data.categories && data.settings) {
                  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
                  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data.categories));
                  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
                  StorageService.notifyUpdate();
                  window.dispatchEvent(new Event('storage'));
                  return true;
              }
          }
          
          // 2. Try CSV Import (External File)
          // Simple Heuristic: Check for commas and newlines
          const lines = content.split('\n');
          if (lines.length > 1 && lines[0].includes(',')) {
              const newTransactions: Transaction[] = [];
              const categories = await StorageService.getCategories();
              const defaultCat = categories[0];

              // Skip header, process rows
              for (let i = 1; i < lines.length; i++) {
                  const row = lines[i].split(',').map(s => s.replace(/"/g, '').trim());
                  if (row.length < 3) continue;
                  
                  // Expecting: Date, Amount, Note/Desc ...
                  const date = row[0] || new Date().toISOString().split('T')[0];
                  const amount = parseFloat(row[1]) || 0;
                  const note = row[2] || 'Imported Entry';
                  
                  if (amount > 0) {
                      newTransactions.push({
                          id: `import_${Date.now()}_${i}`,
                          amount: amount,
                          categoryId: defaultCat.id,
                          categoryName: defaultCat.name,
                          categoryIcon: defaultCat.icon,
                          notes: note,
                          date: date,
                          time: '12:00',
                          type: TransactionType.EXPENSE,
                          paymentMethod: 'Cash'
                      });
                  }
              }

              if (newTransactions.length > 0) {
                  const current = await StorageService.getTransactions();
                  const combined = [...newTransactions, ...current];
                  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(combined));
                  StorageService.notifyUpdate();
                  window.dispatchEvent(new Event('storage'));
                  return true;
              }
          }

          return false;
      } catch (e) {
          console.error("Import failed", e);
          return false;
      }
  },

  exportToCSV: async (): Promise<string> => {
    const transactions = await StorageService.getTransactions();
    const settings = await StorageService.getSettings();
    const curr = CURRENCIES.find(c => c.code === settings.currencyCode) || CURRENCIES[0];

    // CSV Header
    const header = ['Date', 'Time', 'Type', 'Category', 'Amount (Base)', `Amount (${curr.code})`, 'Payment Method', 'Notes'];
    const rows = transactions.map(t => [
        t.date,
        t.time,
        t.type,
        t.categoryName,
        t.amount.toFixed(2),
        (t.amount * curr.rate).toFixed(2),
        t.paymentMethod,
        `"${t.notes.replace(/"/g, '""')}"` // Escape quotes
    ]);

    const csvContent = [
        header.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  },

  clearAll: async (): Promise<void> => {
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    // Keep auth session
    StorageService.notifyUpdate();
    window.dispatchEvent(new Event('storage'));
  }
};