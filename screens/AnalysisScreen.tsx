import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import { Transaction, TransactionType } from '../types';
import { StorageService } from '../services/storageService';
import { CURRENCIES } from '../constants';
import { formatCurrency } from '../utils/format';
import { Lightbulb, TrendingUp, BookOpen, Calendar } from 'lucide-react';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#06b6d4'];

const INSIGHTS = [
    { type: 'quote', text: "Do not save what is left after spending, but spend what is left after saving.", author: "Warren Buffett" },
    { type: 'tip', text: "The 50/30/20 rule: 50% needs, 30% wants, 20% savings.", author: "Financial Wisdom" },
    { type: 'story', text: "The Latte Effect: Small daily expenses like coffee can add up to thousands per year. Tracking them helps you realize where the leaks are.", author: "Money Saving" },
    { type: 'quote', text: "A budget is telling your money where to go instead of wondering where it went.", author: "Dave Ramsey" },
    { type: 'tip', text: "Try the 24-hour rule: Wait 24 hours before making a non-essential purchase to avoid impulse buying.", author: "Smart Shopping" }
];

type AnalysisPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export const AnalysisScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<AnalysisPeriod>('monthly');
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [randomInsight, setRandomInsight] = useState(INSIGHTS[0]);

  useEffect(() => {
    StorageService.getTransactions().then(setTransactions);
    StorageService.getSettings().then(s => {
        const c = CURRENCIES.find(curr => curr.code === s.currencyCode) || CURRENCIES[0];
        setCurrency(c);
    });
    setRandomInsight(INSIGHTS[Math.floor(Math.random() * INSIGHTS.length)]);
  }, []);

  const getFilteredTransactions = () => {
      const now = new Date();
      return transactions.filter(t => {
          const d = new Date(t.date);
          if (period === 'daily') {
              return d.toDateString() === now.toDateString();
          } else if (period === 'weekly') {
              const oneWeekAgo = new Date();
              oneWeekAgo.setDate(now.getDate() - 7);
              return d >= oneWeekAgo;
          } else if (period === 'monthly') {
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          } else if (period === 'quarterly') {
              const currentQuarter = Math.floor((now.getMonth() + 3) / 3);
              const tQuarter = Math.floor((d.getMonth() + 3) / 3);
              return currentQuarter === tQuarter && d.getFullYear() === now.getFullYear();
          } else { // yearly
              return d.getFullYear() === now.getFullYear();
          }
      });
  };

  const filteredTxs = getFilteredTransactions();
  const expenseTransactions = filteredTxs.filter(t => t.type === TransactionType.EXPENSE);

  const categoryData = useMemo(() => {
    const data: {[key: string]: number} = {};
    expenseTransactions.forEach(t => {
        if (!data[t.categoryName]) data[t.categoryName] = 0;
        data[t.categoryName] += t.amount;
    });
    return Object.keys(data)
        .map(key => ({ name: key, value: data[key] })) // Keep raw value for calculations
        .sort((a,b) => b.value - a.value);
  }, [expenseTransactions]);

  const dailyData = useMemo(() => {
      // Determine number of bars based on period
      let days = 7;
      if (period === 'daily') days = 1; 
      if (period === 'monthly') days = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate(); // Days in month
      if (period === 'quarterly') days = 12; // Weeks? Let's just show last 14 days trend for simplicity or aggregate
      if (period === 'yearly') days = 12; // Months

      // Simple implementation: Always show daily trend for selected scope, or monthly for yearly
      const data = [];
      
      if (period === 'yearly') {
          for(let i=0; i<12; i++) {
            const total = expenseTransactions
                .filter(t => new Date(t.date).getMonth() === i)
                .reduce((sum, t) => sum + t.amount, 0);
            data.push({ name: new Date(0, i).toLocaleString('en', {month:'short'}), amount: total * currency.rate });
          }
      } else {
          // Default to last 7 days or days in range
          const limit = period === 'daily' ? 1 : (period === 'weekly' ? 7 : 7); 
          for(let i=limit-1; i>=0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const total = expenseTransactions
                .filter(t => t.date === dateStr)
                .reduce((sum, t) => sum + t.amount, 0);
            data.push({
                name: d.toLocaleDateString('en-US', { weekday: 'short' }),
                amount: total * currency.rate
            });
          }
      }
      return data;
  }, [expenseTransactions, currency.rate, period]);

  const maxCategory = categoryData.length > 0 ? categoryData[0] : null;
  const totalPeriodExpense = categoryData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="flex flex-col h-full bg-background pb-24 overflow-y-auto transition-colors">
        <div className="p-6">
            <h1 className="text-2xl font-bold text-text mb-6">Analytics</h1>

            {/* Insights - Moved to Top */}
            <div className="clay-card p-6 mb-6 border-l-4 border-primary relative overflow-hidden bg-surface">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-primary"><Lightbulb size={64} /></div>
                <h3 className="text-primary font-bold text-lg mb-2 flex items-center gap-2">
                    <BookOpen size={20} /> Wisdom
                </h3>
                <div className="relative z-10">
                    <p className="text-text text-sm font-medium italic mb-2">
                        "{randomInsight.text}"
                    </p>
                    <p className="text-muted text-xs font-bold uppercase text-right">— {randomInsight.author}</p>
                </div>
            </div>
            
            {/* Period Filters */}
            <div className="flex bg-surface p-1 rounded-2xl shadow-sm mb-8 overflow-x-auto no-scrollbar">
                {['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].map((p) => (
                    <button 
                        key={p}
                        onClick={() => setPeriod(p as AnalysisPeriod)}
                        className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                            period === p 
                            ? 'bg-primary text-white shadow-md' 
                            : 'text-muted hover:text-text'
                        }`}
                    >
                        {p}
                    </button>
                ))}
            </div>

            {/* Pie Chart Section */}
            <div className="clay-card p-6 mb-6">
                <h2 className="text-muted font-bold mb-4 text-xs uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={14} /> Spending Breakup
                </h2>
                
                {categoryData.length > 0 ? (
                    <div className="h-64 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                            <p className="text-[10px] text-muted font-bold uppercase">Total</p>
                            <p className="text-xl font-bold text-text">
                                {currency.symbol}{formatCurrency(totalPeriodExpense, currency)}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="h-40 flex items-center justify-center text-muted text-sm">
                        No expenses for this period.
                    </div>
                )}

                <div className="mt-4 space-y-3">
                    {categoryData.slice(0, 4).map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="text-text text-xs font-semibold">{item.name}</span>
                            </div>
                            <span className="text-text font-bold text-xs">{currency.symbol}{formatCurrency(item.value, currency)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Trend Chart */}
            <div className="clay-card p-6 mb-6">
                <h2 className="text-muted font-bold mb-6 text-xs uppercase tracking-widest">Trend</h2>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyData}>
                            <XAxis 
                                dataKey="name" 
                                tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 600}} 
                                axisLine={false}
                                tickLine={false}
                                dy={10}
                            />
                            <Tooltip 
                                cursor={{fill: 'transparent'}}
                                contentStyle={{backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 'bold'}}
                            />
                            <Bar dataKey="amount" fill="var(--primary)" radius={[4, 4, 4, 4]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Category Summary */}
            {maxCategory && (
                 <div className="p-4 rounded-2xl bg-gradient-to-r from-surface to-background border border-gray-200 dark:border-gray-800 shadow-sm">
                     <h3 className="text-muted font-bold mb-1 flex items-center gap-2 text-xs uppercase">
                         Top Spending
                     </h3>
                     <p className="text-text text-sm">
                         Most money went to <span className="text-primary font-bold">{maxCategory.name}</span> ({currency.symbol}{formatCurrency(maxCategory.value, currency)}).
                     </p>
                 </div>
            )}
        </div>
    </div>
  );
};
