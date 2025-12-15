import React, { useEffect, useState, useMemo } from 'react';
import { Search, Bell, Wallet, X, Calendar, Clock, AlertTriangle, Zap, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Transaction, TransactionType, AppSettings, DayGroup, ViewMode, NotificationPreferences } from '../types';
import { StorageService } from '../services/storageService';
import { CURRENCIES } from '../constants';
import { NotificationService } from '../services/notificationService';
import { formatCurrency } from '../utils/format';

interface HomeScreenProps {
    onAddIncome: () => void;
    onEditTransaction: (t: Transaction) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onAddIncome, onEditTransaction }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  
  // Notification Modal State
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences | null>(null);

  // Action Menu State
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    StorageService.listenForUpdates(loadData);
  }, []);

  const loadData = async () => {
    const txs = await StorageService.getTransactions();
    const sets = await StorageService.getSettings();
    setTransactions(txs);
    setSettings(sets);
    setNotifPrefs(sets.notifications); // Load initial prefs
    const curr = CURRENCIES.find(c => c.code === sets.currencyCode) || CURRENCIES[0];
    setCurrency(curr);
  };

  const groupedTransactions: DayGroup[] = useMemo(() => {
    const groups: { [key: string]: DayGroup } = {};
    const lowerSearch = searchTerm.toLowerCase();

    transactions.forEach((t) => {
        if (lowerSearch) {
            const matchesNote = t.notes.toLowerCase().includes(lowerSearch);
            const matchesCategory = t.categoryName.toLowerCase().includes(lowerSearch);
            const matchesDate = t.date.includes(lowerSearch);
            if (!matchesNote && !matchesCategory && !matchesDate) return;
        }

        let groupId = '';
        let groupTitle = '';
        const dateObj = new Date(t.date);

        if (viewMode === 'daily') {
            groupId = t.date;
            groupTitle = formatDateTitle(t.date);
        } else if (viewMode === 'weekly') {
            const d = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
            const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
            const year = dateObj.getFullYear();
            groupId = `${year}-W${weekNo}`;
            groupTitle = `Week ${weekNo}, ${year}`;
        } else if (viewMode === 'monthly') {
            groupId = t.date.substring(0, 7); 
            groupTitle = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        } 
        
        if (!groups[groupId]) {
            groups[groupId] = { id: groupId, title: groupTitle, totalExpense: 0, totalIncome: 0, transactions: [] };
        }
        groups[groupId].transactions.push(t);
        if (t.type === TransactionType.EXPENSE) {
            groups[groupId].totalExpense += t.amount;
        } else {
            groups[groupId].totalIncome += t.amount;
        }
    });

    return Object.values(groups).sort((a, b) => b.id.localeCompare(a.id));
  }, [transactions, searchTerm, viewMode]);

  const totalSpent = useMemo(() => {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    return transactions
      .filter(t => t.type === TransactionType.EXPENSE && t.date.startsWith(currentMonth))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalIncome = useMemo(() => {
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7);
      return transactions
      .filter(t => t.type === TransactionType.INCOME && t.date.startsWith(currentMonth))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions])

  if(!settings || !notifPrefs) return null;

  const budgetProgress = settings.monthlyBudget > 0 ? (totalSpent / settings.monthlyBudget) * 100 : 0;
  const isOverBudget = totalSpent > settings.monthlyBudget;

  function formatDateTitle(dateStr: string) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) return 'Today';
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', weekday: 'short' });
  };

  const handleAction = async (action: 'edit' | 'delete', t: Transaction) => {
      setSelectedTransactionId(null);
      if (action === 'delete') {
          if(window.confirm("Delete this transaction?")) {
            await StorageService.deleteTransaction(t.id);
            loadData();
          }
      } else {
          onEditTransaction(t);
      }
  };
  
  const handleSaveNotifications = async () => {
      if (settings && notifPrefs) {
          const newSettings = { ...settings, notifications: notifPrefs };
          await StorageService.saveSettings(newSettings);
          NotificationService.scheduleNotifications();
      }
      setShowNotifSettings(false);
  };

  const updatePref = (key: keyof NotificationPreferences, value: any) => {
      setNotifPrefs(prev => prev ? ({ ...prev, [key]: value }) : null);
  };

  return (
    <div className="flex flex-col h-full bg-background transition-colors">
      {/* Header */}
      <div className="px-6 py-6 bg-surface rounded-b-[2.5rem] shadow-clay-card z-10 transition-colors">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-xl overflow-hidden shadow-lg border-2 border-surface">
                 {settings.profile.avatarImage ? (
                     <img src={settings.profile.avatarImage} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                     <span className="text-2xl">{settings.profile.avatarId}</span>
                 )}
             </div>
            <div>
                <div className="flex items-baseline gap-2">
                    <h1 className="text-lg font-bold text-text">Hi, {settings.profile.name}</h1>
                </div>
                <p className="text-xs font-semibold text-primary">"Spend Smart, Live Better"</p>
            </div>
          </div>
          <button 
            onClick={() => setShowNotifSettings(true)}
            className="w-10 h-10 rounded-full bg-surface shadow-clay-inset flex items-center justify-center text-text relative hover:text-primary transition"
          >
            <Bell size={20} />
            {notifPrefs.enabled && <span className="absolute top-2 right-2 w-2 h-2 bg-expense rounded-full border border-surface"></span>}
          </button>
        </div>

        {/* Budget Card */}
        <div className="relative rounded-3xl p-6 overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 dark:from-surface dark:to-black shadow-xl text-white border border-white/5">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary opacity-20 rounded-full blur-3xl"></div>
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-secondary opacity-20 rounded-full blur-3xl"></div>
            
          <div className="flex justify-between items-end mb-6 relative z-10">
            <div>
                <p className="text-gray-300 text-xs font-medium mb-1 uppercase tracking-wider">Spent This Month</p>
                <h2 className={`text-4xl font-bold ${isOverBudget ? 'text-expense' : 'text-white dark:text-primary'}`}>
                    {currency.symbol}{formatCurrency(totalSpent, currency)}
                </h2>
            </div>
            <div className="text-right">
                <p className="text-income font-bold">+{currency.symbol}{formatCurrency(totalIncome, currency)}</p>
                <p className="text-gray-400 text-[10px] uppercase tracking-wider font-bold">Income</p>
            </div>
          </div>

          <div className="relative z-10">
            <div className="flex justify-between text-xs text-gray-400 mb-2 font-medium">
              <span>Limit: {currency.symbol}{formatCurrency(settings.monthlyBudget, currency)}</span>
              <span>{Math.min(budgetProgress, 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 w-full bg-white/10 dark:bg-black/40 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${isOverBudget ? 'bg-expense' : 'bg-gradient-to-r from-primary to-secondary'}`}
                style={{ width: `${Math.min(budgetProgress, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="px-4 mt-6">
        <div className="flex bg-surface p-1 rounded-2xl shadow-clay-inset overflow-x-auto no-scrollbar">
            {['daily', 'weekly', 'monthly'].map((mode) => (
                <button
                    key={mode}
                    onClick={() => setViewMode(mode as ViewMode)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all duration-300 ${
                        viewMode === mode 
                        ? 'bg-primary text-white dark:text-black shadow-md' 
                        : 'text-muted hover:text-text'
                    }`}
                >
                    {mode}
                </button>
            ))}
        </div>
      </div>

      {/* Search & Actions */}
      <div className="px-4 mt-4 flex gap-3">
        <div className="flex-1 relative bg-surface rounded-xl h-12 shadow-clay-inset border border-transparent focus-within:border-primary transition-colors">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-full bg-transparent pl-11 pr-10 text-text text-sm focus:outline-none placeholder:text-muted font-medium"
            />
            {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text">
                    <X size={16} />
                </button>
            )}
        </div>
        <button 
            onClick={onAddIncome}
            className="btn-primary w-12 h-12 flex items-center justify-center text-xl"
        >
            +
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 mt-4 space-y-6 no-scrollbar pb-24">
        {groupedTransactions.length === 0 ? (
            <div className="text-center mt-20 opacity-50">
                <div className="text-6xl mb-4 grayscale">💸</div>
                <p className="text-muted font-medium">{searchTerm ? 'No results found.' : 'No transactions found.'}</p>
                {!searchTerm && <p className="text-muted text-xs mt-2">Tap + to add one.</p>}
            </div>
        ) : (
            groupedTransactions.map((group) => (
            <div key={group.id} className="animate-fade-in-up">
                <div className="flex justify-between items-center mb-3 px-2">
                    <h3 className="text-muted text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                        <Calendar size={12} /> {group.title}
                    </h3>
                    <div className="text-[10px] font-mono font-bold bg-surface px-2 py-1 rounded-lg text-text shadow-clay-inset">
                        {group.totalExpense > 0 && <span className="text-expense mr-2">-{currency.symbol}{formatCurrency(group.totalExpense, currency)}</span>}
                        {group.totalIncome > 0 && <span className="text-income">+{currency.symbol}{formatCurrency(group.totalIncome, currency)}</span>}
                    </div>
                </div>
                <div className="space-y-3">
                {group.transactions.map((t) => (
                    <div
                    key={t.id}
                    onClick={() => setSelectedTransactionId(selectedTransactionId === t.id ? null : t.id)}
                    className={`clay-card p-4 relative overflow-hidden group transition-all cursor-pointer ${selectedTransactionId === t.id ? 'ring-2 ring-primary' : ''}`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 z-10">
                                <div className="w-12 h-12 rounded-2xl bg-surface shadow-clay-inset flex items-center justify-center text-2xl border border-white/5">
                                {t.categoryIcon}
                                </div>
                                <div>
                                <p className="text-text font-bold text-sm">{t.categoryName}</p>
                                <p className="text-muted text-xs truncate max-w-[120px] font-medium">
                                    {t.notes || t.paymentMethod}
                                </p>
                                </div>
                            </div>
                            <div className="text-right z-10">
                                <p
                                className={`font-bold text-base ${
                                    t.type === TransactionType.EXPENSE ? 'text-text' : 'text-income'
                                }`}
                                >
                                {t.type === TransactionType.EXPENSE ? '-' : '+'}
                                {currency.symbol}
                                {formatCurrency(t.amount, currency)}
                                </p>
                                <p className="text-muted text-[10px] font-medium">{t.time}</p>
                            </div>
                        </div>
                        
                        {/* Action Menu (Overlay) */}
                        {selectedTransactionId === t.id && (
                            <div className="absolute inset-0 bg-surface/90 backdrop-blur-sm z-20 flex items-center justify-center gap-4 animate-fade-in">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleAction('edit', t); }}
                                    className="flex flex-col items-center gap-1 text-primary hover:scale-110 transition-transform"
                                >
                                    <div className="w-10 h-10 rounded-full bg-surface shadow-clay-inset flex items-center justify-center">
                                        <Edit size={18} />
                                    </div>
                                    <span className="text-[10px] font-bold">Edit</span>
                                </button>
                                
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleAction('delete', t); }}
                                    className="flex flex-col items-center gap-1 text-expense hover:scale-110 transition-transform"
                                >
                                    <div className="w-10 h-10 rounded-full bg-surface shadow-clay-inset flex items-center justify-center">
                                        <Trash2 size={18} />
                                    </div>
                                    <span className="text-[10px] font-bold">Delete</span>
                                </button>

                                <button 
                                    onClick={(e) => { e.stopPropagation(); setSelectedTransactionId(null); }}
                                    className="flex flex-col items-center gap-1 text-muted hover:scale-110 transition-transform"
                                >
                                    <div className="w-10 h-10 rounded-full bg-surface shadow-clay-inset flex items-center justify-center">
                                        <X size={18} />
                                    </div>
                                    <span className="text-[10px] font-bold">Cancel</span>
                                </button>
                            </div>
                        )}
                    </div>
                ))}
                </div>
            </div>
            ))
        )}
      </div>

      {/* Advanced Notification Settings Modal */}
      {showNotifSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="clay-card w-full max-w-sm max-h-[80vh] overflow-y-auto p-6 shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-text">Notifications</h3>
              <button onClick={() => setShowNotifSettings(false)} className="p-2 hover:bg-black/5 rounded-full"><X size={20} className="text-muted" /></button>
            </div>
            
            <div className="space-y-6">
              {/* Master Toggle */}
              <div className="flex items-center justify-between">
                  <span className="font-bold text-text">Enable Notifications</span>
                   <div 
                        onClick={() => updatePref('enabled', !notifPrefs.enabled)}
                        className={`w-12 h-6 rounded-full relative transition-colors duration-200 cursor-pointer ${notifPrefs.enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                       <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${notifPrefs.enabled ? 'right-1' : 'left-1'}`}></div>
                    </div>
              </div>

              {notifPrefs.enabled && (
                  <>
                  {/* Daily Section */}
                  <div className="bg-surface shadow-clay-inset rounded-2xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-primary" />
                            <span className="font-bold text-sm text-text">Daily Nudge</span>
                        </div>
                        <input 
                            type="checkbox" 
                            checked={notifPrefs.dailyReminder}
                            onChange={(e) => updatePref('dailyReminder', e.target.checked)}
                            className="w-4 h-4 accent-primary"
                        />
                      </div>
                      {notifPrefs.dailyReminder && (
                          <div className="flex items-center justify-between mt-2 pl-6">
                              <span className="text-xs text-muted font-bold">Time</span>
                              <input 
                                type="time" 
                                value={notifPrefs.dailyTime}
                                onChange={(e) => updatePref('dailyTime', e.target.value)}
                                className="bg-background rounded-lg px-2 py-1 text-xs font-bold text-text outline-none focus:ring-1 ring-primary"
                              />
                          </div>
                      )}
                      
                      {/* Random Nudge Toggle (15x) */}
                      <div className="flex justify-between items-center mt-4 pt-2 border-t border-black/5 dark:border-white/5">
                        <div className="flex flex-col">
                            <span className="font-bold text-xs text-text">High Frequency Nudges</span>
                            <span className="text-[10px] text-muted">15x random alerts today</span>
                        </div>
                        <div 
                             onClick={() => updatePref('randomNudges', !notifPrefs.randomNudges)}
                             className={`w-8 h-4 rounded-full relative transition-colors duration-200 cursor-pointer ${notifPrefs.randomNudges ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                        >
                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-200 ${notifPrefs.randomNudges ? 'right-0.5' : 'left-0.5'}`}></div>
                        </div>
                      </div>
                  </div>

                  {/* Weekly Section */}
                  <div className="bg-surface shadow-clay-inset rounded-2xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-secondary" />
                            <span className="font-bold text-sm text-text">Weekly Report</span>
                        </div>
                        <input 
                            type="checkbox" 
                            checked={notifPrefs.weeklySummary}
                            onChange={(e) => updatePref('weeklySummary', e.target.checked)}
                            className="w-4 h-4 accent-secondary"
                        />
                      </div>
                      {notifPrefs.weeklySummary && (
                          <div className="space-y-2 mt-2 pl-6">
                              <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted font-bold">Day</span>
                                  <select 
                                    value={notifPrefs.weeklyDay}
                                    onChange={(e) => updatePref('weeklyDay', parseInt(e.target.value))}
                                    className="bg-background rounded-lg px-2 py-1 text-xs font-bold text-text outline-none"
                                  >
                                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                                          <option key={d} value={i}>{d}</option>
                                      ))}
                                  </select>
                              </div>
                              <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted font-bold">Time</span>
                                  <input 
                                    type="time" 
                                    value={notifPrefs.weeklyTime}
                                    onChange={(e) => updatePref('weeklyTime', e.target.value)}
                                    className="bg-background rounded-lg px-2 py-1 text-xs font-bold text-text outline-none focus:ring-1 ring-secondary"
                                  />
                              </div>
                          </div>
                      )}
                  </div>

                  {/* Critical / DND Override */}
                  <div className="bg-surface shadow-clay-inset rounded-2xl p-4 border border-expense/20">
                      <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                              <AlertTriangle size={16} className="text-expense" />
                              <div className="flex flex-col">
                                <span className="font-bold text-sm text-text">Critical Alerts</span>
                                <span className="text-[10px] text-muted">Try to bypass DND (OS dependent)</span>
                              </div>
                          </div>
                          <div 
                                onClick={() => updatePref('criticalAlerts', !notifPrefs.criticalAlerts)}
                                className={`w-10 h-5 rounded-full relative transition-colors duration-200 cursor-pointer ${notifPrefs.criticalAlerts ? 'bg-expense' : 'bg-gray-300 dark:bg-gray-600'}`}
                            >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-200 ${notifPrefs.criticalAlerts ? 'right-1' : 'left-1'}`}></div>
                            </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                            <Zap size={14} className="text-accent" />
                            <span className="text-[10px] font-bold text-muted">Offline Delivery Enabled</span>
                      </div>
                  </div>
                  </>
              )}

              <button 
                onClick={handleSaveNotifications}
                className="btn-primary w-full py-3 mt-4"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};