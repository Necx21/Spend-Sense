import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, CreditCard, Save, Plus, Wallet, FileText } from 'lucide-react';
import { Transaction, TransactionType, Category, PAYMENT_METHODS } from '../types';
import { StorageService } from '../services/storageService';
import { CURRENCIES } from '../constants';

interface AddTransactionScreenProps {
  onBack: () => void;
  onSave: () => void;
  transactionToEdit?: Transaction | null;
}

export const AddTransactionScreen: React.FC<AddTransactionScreenProps> = ({ onBack, onSave, transactionToEdit }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().substring(0, 5));
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [customPayment, setCustomPayment] = useState('');
  const [currencyRate, setCurrencyRate] = useState(1);
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [showCustomPayment, setShowCustomPayment] = useState(false);

  // New Category State
  const [showNewCatModal, setShowNewCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🌟');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const all = await StorageService.getCategories();
    setCategories(all);
    const settings = await StorageService.getSettings();
    const curr = CURRENCIES.find(c => c.code === settings.currencyCode) || CURRENCIES[0];
    setCurrencyRate(curr.rate);
    setCurrencySymbol(curr.symbol);

    // Initial Selection or Edit Mode population
    if (transactionToEdit) {
        setType(transactionToEdit.type);
        // Convert back to display currency for editing
        const dispAmount = (transactionToEdit.amount * curr.rate).toFixed(2);
        setAmount(dispAmount);
        setNotes(transactionToEdit.notes);
        setDate(transactionToEdit.date);
        setTime(transactionToEdit.time);
        setSelectedCategory(transactionToEdit.categoryId);
        
        if (PAYMENT_METHODS.includes(transactionToEdit.paymentMethod as any)) {
            setPaymentMethod(transactionToEdit.paymentMethod);
        } else {
            setPaymentMethod('');
            setShowCustomPayment(true);
            setCustomPayment(transactionToEdit.paymentMethod);
        }
    } else {
        const first = all.find(c => c.type === TransactionType.EXPENSE);
        if(first) setSelectedCategory(first.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !selectedCategory) return;

    const category = categories.find((c) => c.id === selectedCategory);
    if (!category) return;

    // Fix precision: Store accurately in base currency
    const amountInBase = parseFloat(amount) / currencyRate;
    const finalMethod = showCustomPayment ? customPayment : paymentMethod;

    const newTransaction: Transaction = {
      id: transactionToEdit ? transactionToEdit.id : Date.now().toString(), // Preserve ID if editing
      amount: amountInBase,
      categoryId: category.id,
      categoryName: category.name,
      categoryIcon: category.icon,
      notes: notes,
      date: date,
      time: time,
      type: type,
      paymentMethod: finalMethod as any,
    };

    await StorageService.saveTransaction(newTransaction);
    onSave();
  };

  const handleCreateCategory = async () => {
    if (!newCatName) return;
    const newCat: Category = {
        id: `custom_${Date.now()}`,
        name: newCatName,
        icon: newCatIcon,
        budgetLimit: 0,
        isCustom: true,
        type: type
    };
    await StorageService.saveCategory(newCat);
    setCategories([...categories, newCat]);
    setSelectedCategory(newCat.id);
    setShowNewCatModal(false);
    setNewCatName('');
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <div className="flex flex-col h-full bg-background animate-fade-in pb-24 transition-colors">
      {/* Header */}
      <div className="flex items-center p-6 border-b border-gray-100 dark:border-white/5">
        <button onClick={onBack} className="bg-surface p-3 rounded-xl text-muted hover:text-text transition active:scale-95 shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <h1 className="ml-4 text-2xl font-bold text-text">{transactionToEdit ? 'Edit Entry' : 'Add Entry'}</h1>
      </div>

      {/* Type Toggle */}
      <div className="px-6 pt-4">
        <div className="bg-surface p-2 rounded-2xl flex shadow-sm">
          <button
            onClick={() => {
                setType(TransactionType.EXPENSE);
                const first = categories.find(c => c.type === TransactionType.EXPENSE);
                if(first) setSelectedCategory(first.id);
            }}
            className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              type === TransactionType.EXPENSE
                ? 'bg-expense text-white shadow-md'
                : 'text-muted hover:text-text'
            }`}
          >
            Expense
          </button>
          <button
            onClick={() => {
                setType(TransactionType.INCOME);
                const first = categories.find(c => c.type === TransactionType.INCOME);
                if(first) setSelectedCategory(first.id);
            }}
            className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              type === TransactionType.INCOME
                ? 'bg-income text-white shadow-md'
                : 'text-muted hover:text-text'
            }`}
          >
            Income
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 space-y-6 mt-6">
        {/* Amount */}
        <div className="space-y-2">
          <label className="text-muted text-xs font-bold uppercase ml-1">Amount ({currencySymbol})</label>
          <div className="relative clay-card rounded-2xl overflow-hidden group focus-within:ring-2 ring-primary">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted">
              {currencySymbol}
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent py-6 pl-14 pr-6 text-4xl font-bold text-text focus:outline-none placeholder:text-muted"
              autoFocus
              required
              step="any"
            />
          </div>
        </div>

        {/* Category Grid */}
        <div className="space-y-2">
          <label className="text-muted text-xs font-bold uppercase ml-1">Category</label>
          <div className="grid grid-cols-4 gap-3">
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200 active:scale-95 ${
                  selectedCategory === cat.id
                    ? 'bg-surface shadow-md border-primary transform -translate-y-1'
                    : 'bg-surface border-transparent opacity-60 hover:opacity-100 hover:bg-gray-50 dark:hover:bg-black/20'
                }`}
              >
                <span className="text-2xl mb-1">{cat.icon}</span>
                <span className="text-[10px] text-text truncate w-full text-center font-bold">
                  {cat.name}
                </span>
              </button>
            ))}
             <button
                type="button"
                onClick={() => setShowNewCatModal(true)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <Plus className="text-muted mb-1" size={24} />
                <span className="text-[10px] text-muted font-bold">Custom</span>
              </button>
          </div>
        </div>

        {/* Details Section */}
        <div className="space-y-5 clay-card p-6">
          {/* Custom Date & Time Inputs */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-xs text-muted font-bold uppercase flex items-center gap-1">
                <Calendar size={12} /> Date
              </label>
              <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-background rounded-xl p-3 text-text font-bold outline-none focus:ring-1 ring-primary appearance-none relative z-10"
                  />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-xs text-muted font-bold uppercase flex items-center gap-1">
                <Clock size={12} /> Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-background rounded-xl p-3 text-text font-bold outline-none focus:ring-1 ring-primary"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="text-xs text-muted font-bold uppercase flex items-center gap-1">
              <CreditCard size={12} /> Payment Method
            </label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => { setPaymentMethod(method); setShowCustomPayment(false); }}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all active:scale-95 ${
                    paymentMethod === method && !showCustomPayment
                      ? 'bg-surface border-primary text-primary shadow-sm'
                      : 'bg-background border-transparent text-muted hover:text-text'
                  }`}
                >
                  {method}
                </button>
              ))}
              <button
                  type="button"
                  onClick={() => setShowCustomPayment(true)}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all active:scale-95 ${
                    showCustomPayment
                      ? 'bg-surface border-primary text-primary shadow-sm'
                      : 'bg-background border-transparent text-muted hover:text-text'
                  }`}
                >
                  Custom
              </button>
            </div>
            {showCustomPayment && (
                <input 
                    type="text" 
                    value={customPayment}
                    onChange={(e) => setCustomPayment(e.target.value)}
                    placeholder="Enter method name (e.g. Bitcoin)"
                    className="w-full mt-2 bg-background p-3 rounded-xl text-text font-bold text-sm outline-none focus:ring-1 ring-primary animate-fade-in"
                />
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs text-muted font-bold uppercase flex items-center gap-1">
                <FileText size={12} /> Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Description..."
              className="w-full bg-background rounded-xl p-3 text-text font-bold outline-none placeholder:text-muted"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn-primary w-full py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform"
        >
          <Save size={20} />
          <span className="font-bold uppercase tracking-wider">{transactionToEdit ? 'Update Entry' : 'Save Entry'}</span>
        </button>
      </form>

      {/* New Category Modal Overlay */}
      {showNewCatModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <div className="bg-surface w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border border-white/10 animate-fade-in-up">
                  <h3 className="text-lg font-bold text-text mb-4">New Category</h3>
                  <div className="flex gap-3 mb-4">
                      <input 
                        className="w-16 h-16 text-center text-3xl bg-background rounded-2xl outline-none focus:ring-2 ring-primary"
                        value={newCatIcon}
                        onChange={e => setNewCatIcon(e.target.value)}
                        maxLength={2}
                      />
                      <input 
                        className="flex-1 px-4 bg-background rounded-2xl outline-none focus:ring-2 ring-primary text-text font-bold"
                        placeholder="Category Name"
                        value={newCatName}
                        onChange={e => setNewCatName(e.target.value)}
                        autoFocus
                      />
                  </div>
                  <div className="flex gap-3">
                      <button 
                        onClick={() => setShowNewCatModal(false)}
                        className="flex-1 py-3 text-muted bg-background rounded-xl font-bold hover:bg-black/5"
                        type="button"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={handleCreateCategory}
                        className="btn-primary flex-1 py-3 rounded-xl font-bold"
                        type="button"
                      >
                          Create
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};