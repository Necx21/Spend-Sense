export enum TransactionType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME',
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Emoji
  budgetLimit: number;
  isCustom: boolean;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  amount: number; // Stored in INR (Base currency)
  categoryId: string;
  categoryName: string; 
  categoryIcon: string; 
  notes: string;
  date: string; // ISO Date String YYYY-MM-DD
  time: string; // HH:mm
  type: TransactionType;
  paymentMethod: 'Cash' | 'Card' | 'UPI';
}

export interface UserProfile {
  uid?: string; // Auth ID
  email?: string;
  name: string;
  username: string;
  avatarId: string; // Just an ID to pick from preset avatars
  avatarImage?: string; // Base64 string for custom image
}

export interface NotificationPreferences {
  enabled: boolean;
  dailyReminder: boolean;
  dailyTime: string; // HH:mm
  randomNudges: boolean; // New: Toggle for 15x random nudges
  weeklySummary: boolean;
  weeklyDay: number; // 0-6 (Sun-Sat)
  weeklyTime: string; // HH:mm
  budgetAlert: boolean;
  budgetThreshold: number; // Percentage (e.g., 90)
  criticalAlerts: boolean; // DND Override
}

export interface AppSettings {
  currencyCode: string; // e.g., 'INR', 'USD'
  theme: 'dark' | 'light' | 'system';
  monthlyBudget: number; // In Base Currency (INR)
  savingsGoal: number; // Added for Budget Planning
  profile: UserProfile;
  notifications: NotificationPreferences;
}

export interface Currency {
  code: string;
  symbol: string;
  rate: number; // Conversion rate relative to INR (Base 1.0)
  name: string;
}

export interface DayGroup {
  id: string; // Unique ID for the group (date, week number, etc.)
  title: string; // Display title
  totalExpense: number;
  totalIncome: number;
  transactions: Transaction[];
}

export type ViewMode = 'daily' | 'weekly' | 'monthly';

export const PAYMENT_METHODS = ['Cash', 'Card', 'UPI'] as const;