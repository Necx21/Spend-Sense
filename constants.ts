import { Category, TransactionType, Currency } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_1', name: 'Food', icon: '🍔', budgetLimit: 5000, isCustom: false, type: TransactionType.EXPENSE },
  { id: 'cat_2', name: 'Transport', icon: '🚕', budgetLimit: 2000, isCustom: false, type: TransactionType.EXPENSE },
  { id: 'cat_3', name: 'Shopping', icon: '🛍️', budgetLimit: 3000, isCustom: false, type: TransactionType.EXPENSE },
  { id: 'cat_4', name: 'Bills', icon: '🧾', budgetLimit: 4000, isCustom: false, type: TransactionType.EXPENSE },
  { id: 'cat_5', name: 'Entertainment', icon: '🎬', budgetLimit: 1500, isCustom: false, type: TransactionType.EXPENSE },
  { id: 'cat_6', name: 'Health', icon: '💊', budgetLimit: 1000, isCustom: false, type: TransactionType.EXPENSE },
  { id: 'cat_inc_1', name: 'Salary', icon: '💰', budgetLimit: 0, isCustom: false, type: TransactionType.INCOME },
  { id: 'cat_inc_2', name: 'Freelance', icon: '💻', budgetLimit: 0, isCustom: false, type: TransactionType.INCOME },
  { id: 'cat_inc_3', name: 'Investments', icon: '📈', budgetLimit: 0, isCustom: false, type: TransactionType.INCOME },
];

export const STORAGE_KEYS = {
  TRANSACTIONS: 'spendsense_transactions',
  CATEGORIES: 'spendsense_categories',
  SETTINGS: 'spendsense_settings',
};

// 30 Emoji Options for Custom Categories
export const EMOJI_PICKER_LIST = [
    '🍔', '🍕', '🍣', '☕', '🍻', '🚕', '✈️', '⛽', '🚑', '🏋️',
    '🎬', '🎮', '📱', '📚', '🎁', '🐶', '👶', '💅', '👕', '🏠',
    '💡', '📡', '🎓', '💸', '🏦', '🔧', '🧹', '🪴', '🎰', '🏳️‍🌈'
];

// Base Currency is INR
export const CURRENCIES: Currency[] = [
  { code: 'INR', symbol: '₹', rate: 1, name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', rate: 0.012, name: 'US Dollar' },
  { code: 'EUR', symbol: '€', rate: 0.011, name: 'Euro' },
  { code: 'GBP', symbol: '£', rate: 0.0094, name: 'British Pound' },
  { code: 'JPY', symbol: '¥', rate: 1.76, name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', rate: 0.018, name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', rate: 0.016, name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'Fr', rate: 0.010, name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', rate: 0.086, name: 'Chinese Yuan' },
  { code: 'SEK', symbol: 'kr', rate: 0.12, name: 'Swedish Krona' },
  { code: 'NZD', symbol: 'NZ$', rate: 0.019, name: 'New Zealand Dollar' },
  { code: 'MXN', symbol: '$', rate: 0.20, name: 'Mexican Peso' },
  { code: 'SGD', symbol: 'S$', rate: 0.016, name: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', rate: 0.093, name: 'Hong Kong Dollar' },
  { code: 'KRW', symbol: '₩', rate: 15.80, name: 'South Korean Won' },
  // Added 15 new currencies
  { code: 'BRL', symbol: 'R$', rate: 0.060, name: 'Brazilian Real' },
  { code: 'RUB', symbol: '₽', rate: 1.15, name: 'Russian Ruble' },
  { code: 'ZAR', symbol: 'R', rate: 0.22, name: 'South African Rand' },
  { code: 'TRY', symbol: '₺', rate: 0.40, name: 'Turkish Lira' },
  { code: 'SAR', symbol: '﷼', rate: 0.045, name: 'Saudi Riyal' },
  { code: 'AED', symbol: 'dh', rate: 0.044, name: 'UAE Dirham' },
  { code: 'THB', symbol: '฿', rate: 0.40, name: 'Thai Baht' },
  { code: 'IDR', symbol: 'Rp', rate: 190, name: 'Indonesian Rupiah' },
  { code: 'MYR', symbol: 'RM', rate: 0.052, name: 'Malaysian Ringgit' },
  { code: 'PHP', symbol: '₱', rate: 0.69, name: 'Philippine Peso' },
  { code: 'VND', symbol: '₫', rate: 300, name: 'Vietnamese Dong' },
  { code: 'PLN', symbol: 'zł', rate: 0.047, name: 'Polish Zloty' },
  { code: 'ILS', symbol: '₪', rate: 0.043, name: 'Israeli New Shekel' },
  { code: 'NOK', symbol: 'kr', rate: 0.13, name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', rate: 0.082, name: 'Danish Krone' },
];

export const AVATARS = ['😎', '👻', '🤖', '🐱', '🐶', '🦊', '🐼', '🐨', '🦁', '🐯'];