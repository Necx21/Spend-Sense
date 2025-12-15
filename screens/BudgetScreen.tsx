import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { Category, TransactionType, AppSettings, Transaction } from '../types';
import { CURRENCIES, EMOJI_PICKER_LIST } from '../constants';
import { Trash2, Edit2, Check, Plus, AlertCircle, Target, ArrowRight, Save, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../utils/format';

export const BudgetScreen: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [currency, setCurrency] = useState(CURRENCIES[0]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    
    // New Category
    const [newCatName, setNewCatName] = useState('');
    const [newCatIcon, setNewCatIcon] = useState('✨');
    const [newCatBudget, setNewCatBudget] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    
    // Budget Planning
    const [savingsGoal, setSavingsGoal] = useState('');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    
    useEffect(() => {
        loadData();
        StorageService.listenForUpdates(loadData);
    }, []);

    const loadData = async () => {
        const c = await StorageService.getCategories();
        const s = await StorageService.getSettings();
        const t = await StorageService.getTransactions();
        setCategories(c);
        setSettings(s);
        setTransactions(t);
        const curr = CURRENCIES.find(curr => curr.code === s.currencyCode) || CURRENCIES[0];
        setCurrency(curr);
        
        if (s.savingsGoal) {
            setSavingsGoal((s.savingsGoal * curr.rate).toFixed(0));
        }
    };

    const convertFromBase = (amount: number) => Number((amount * currency.rate).toFixed(2));
    const convertToBase = (amount: number) => amount / currency.rate;

    const handleUpdateBudget = async (id: string) => {
        const cat = categories.find(c => c.id === id);
        if(!cat) return;
        
        const newLimitInBase = convertToBase(parseFloat(editValue) || 0);
        const updatedCat = { ...cat, budgetLimit: newLimitInBase };
        
        await StorageService.saveCategory(updatedCat);
        setEditingId(null);
        loadData();
    };

    const handleDelete = async (id: string) => {
        if(confirm("Delete this category?")) {
            await StorageService.deleteCategory(id);
            loadData();
        }
    };

    const handleCreate = async () => {
        if(!newCatName) return;
        const newCat: Category = {
            id: 'custom_' + Date.now(),
            name: newCatName,
            icon: newCatIcon,
            budgetLimit: convertToBase(parseFloat(newCatBudget) || 0),
            isCustom: true,
            type: TransactionType.EXPENSE
        };
        await StorageService.saveCategory(newCat);
        setIsCreating(false);
        setNewCatName('');
        setNewCatBudget('');
        setNewCatIcon('✨');
        loadData();
    };
    
    const handleUpdateGoal = async () => {
        if (!settings) return;
        const goalInBase = convertToBase(parseFloat(savingsGoal) || 0);
        const newSettings = { ...settings, savingsGoal: goalInBase };
        await StorageService.saveSettings(newSettings);
        loadData();
    };

    const expenseCats = categories.filter(c => c.type === TransactionType.EXPENSE);

    // Calc Calculations for Goal
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyIncome = transactions
        .filter(t => t.type === TransactionType.INCOME && t.date.startsWith(currentMonth))
        .reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpense = transactions
        .filter(t => t.type === TransactionType.EXPENSE && t.date.startsWith(currentMonth))
        .reduce((sum, t) => sum + t.amount, 0);
    const currentSavings = monthlyIncome - monthlyExpense;
    const goalValue = settings?.savingsGoal || 0;
    const progress = goalValue > 0 ? (currentSavings / goalValue) * 100 : 0;

    if (!settings) return null;

    return (
        <div className="flex flex-col h-full bg-background pb-24 overflow-y-auto transition-colors">
            <div className="p-6">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-text">Budgets</h1>
                        <p className="text-muted text-xs font-bold uppercase tracking-wider">Manage Limits</p>
                    </div>
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="btn-primary w-12 h-12 flex items-center justify-center rounded-full active:scale-95"
                    >
                        <Plus size={24} />
                    </button>
                </div>

                {isCreating && (
                    <div className="mb-6 clay-card p-6 animate-fade-in relative z-20">
                        <h3 className="text-sm font-bold text-text mb-4 uppercase">New Category</h3>
                        <div className="flex gap-3 mb-4">
                            <button 
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="w-14 h-14 text-center text-3xl bg-background rounded-2xl flex items-center justify-center shadow-clay-inset active:scale-95 transition"
                            >
                                {newCatIcon}
                            </button>
                            <input 
                                type="text" 
                                placeholder="Name"
                                value={newCatName}
                                onChange={e => setNewCatName(e.target.value)}
                                className="flex-1 px-4 bg-background shadow-clay-inset rounded-2xl outline-none focus:ring-2 ring-primary text-text font-bold"
                            />
                        </div>

                        {/* Emoji Picker Grid */}
                        {showEmojiPicker && (
                            <div className="mb-4 p-2 bg-background rounded-2xl shadow-inner grid grid-cols-6 gap-2 h-32 overflow-y-auto">
                                {EMOJI_PICKER_LIST.map(emoji => (
                                    <button 
                                        key={emoji} 
                                        onClick={() => { setNewCatIcon(emoji); setShowEmojiPicker(false); }}
                                        className="text-xl p-1 hover:bg-white/10 rounded-lg"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center px-4 bg-background shadow-clay-inset rounded-2xl mb-4">
                            <span className="text-muted mr-2 font-bold">{currency.symbol}</span>
                            <input 
                                type="number" 
                                placeholder="Monthly Limit"
                                value={newCatBudget}
                                onChange={e => setNewCatBudget(e.target.value)}
                                className="w-full bg-transparent py-4 outline-none text-text font-bold"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setIsCreating(false)}
                                className="flex-1 py-3 text-muted bg-background rounded-xl font-bold"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleCreate}
                                className="btn-primary flex-1 py-3 rounded-xl font-bold"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {expenseCats.map(cat => (
                        <div key={cat.id} className="clay-card p-4 flex items-center justify-between group hover:border-primary/20 border-2 border-transparent transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-surface shadow-clay-inset flex items-center justify-center text-2xl">
                                    {cat.icon}
                                </div>
                                <div>
                                    <p className="text-text font-bold text-sm">{cat.name}</p>
                                    <div className="text-xs text-muted flex items-center gap-1 font-medium">
                                        Limit: <span className="font-bold text-primary">{currency.symbol}{formatCurrency(cat.budgetLimit, currency)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {editingId === cat.id ? (
                                    <div className="flex items-center gap-2 bg-surface shadow-clay-inset rounded-lg p-1 border border-primary/20">
                                        <input 
                                            type="number" 
                                            value={editValue}
                                            onChange={e => setEditValue(e.target.value)}
                                            className="w-16 bg-transparent text-sm text-center outline-none text-text font-bold"
                                            autoFocus
                                        />
                                        <button onClick={() => handleUpdateBudget(cat.id)} className="p-1 text-primary">
                                            <Check size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => {
                                            setEditingId(cat.id);
                                            setEditValue(convertFromBase(cat.budgetLimit).toString());
                                        }}
                                        className="p-2 text-muted hover:text-primary transition"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                )}
                                
                                {cat.isCustom && (
                                    <button 
                                        onClick={() => handleDelete(cat.id)}
                                        className="p-2 text-muted hover:text-expense transition"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* Functional Budget Planning Section */}
                <div className="mt-8 clay-card p-6 border-l-4 border-secondary">
                    <h3 className="text-lg font-bold text-text mb-2 flex items-center gap-2">
                        <Target className="text-secondary" /> Savings Goal
                    </h3>
                    <p className="text-muted text-xs mb-4 font-bold">Plan your monthly savings.</p>
                    
                    <div className="flex gap-2 mb-4">
                        <div className="flex-1 bg-surface shadow-clay-inset rounded-xl px-4 flex items-center">
                            <span className="text-muted font-bold mr-2">{currency.symbol}</span>
                            <input 
                                type="number" 
                                placeholder="Target Amount"
                                value={savingsGoal}
                                onChange={(e) => setSavingsGoal(e.target.value)}
                                className="w-full bg-transparent py-3 text-sm font-bold text-text outline-none"
                            />
                        </div>
                        <button onClick={handleUpdateGoal} className="btn-primary p-3 rounded-xl active:scale-95">
                            <Save size={20} />
                        </button>
                    </div>

                    {/* Goal Visualization */}
                    {goalValue > 0 && (
                        <div className="mt-4">
                            <div className="flex justify-between text-xs font-bold mb-2">
                                <span className="text-muted">Progress</span>
                                <span className={currentSavings >= goalValue ? "text-income" : "text-text"}>
                                    {currency.symbol}{formatCurrency(Math.max(0, currentSavings), currency)} / {currency.symbol}{formatCurrency(goalValue, currency)}
                                </span>
                            </div>
                            <div className="h-3 w-full bg-surface shadow-clay-inset rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${currentSavings >= goalValue ? 'bg-income' : 'bg-secondary'}`}
                                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                                ></div>
                            </div>
                             <p className="text-[10px] text-muted mt-2 text-right">
                                {currentSavings >= goalValue ? "🎉 Goal Reached!" : `${Math.max(0, progress).toFixed(1)}% Achieved`}
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-6 p-4 rounded-xl flex items-start gap-3 opacity-60">
                    <AlertCircle className="text-muted shrink-0 mt-0.5" size={16} />
                    <p className="text-[10px] text-muted font-bold leading-relaxed">
                        Pro Tip: Keep category budgets realistic based on your last 3 months of spending. Adjust them seasonally!
                    </p>
                </div>
            </div>
        </div>
    );
};