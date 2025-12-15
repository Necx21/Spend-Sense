import React, { useState, useEffect } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { AddTransactionScreen } from './screens/AddTransactionScreen';
import { AnalysisScreen } from './screens/AnalysisScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { BudgetScreen } from './screens/BudgetScreen';
import { AuthScreen } from './screens/AuthScreen';
import { BottomNav } from './components/BottomNav';
import { StorageService } from './services/storageService';
import { NotificationService } from './services/notificationService';
import { AuthService } from './services/authService';
import { Transaction } from './types';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTab, setCurrentTab] = useState('home');
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [key, setKey] = useState(0); 

  useEffect(() => {
    checkAuth();
    applyTheme();

    window.addEventListener('storage', applyTheme);
    return () => window.removeEventListener('storage', applyTheme);
  }, []);

  const checkAuth = async () => {
      const isAuth = await AuthService.isAuthenticated();
      setIsAuthenticated(isAuth);
      if(isAuth) {
          // Initialize Notifications only if logged in
          NotificationService.requestPermission();
          NotificationService.scheduleNotifications();
      }
  };

  const applyTheme = async () => {
      const settings = await StorageService.getSettings();
      const html = document.documentElement;
      
      // Force remove first to avoid conflicts
      html.classList.remove('dark');
      
      if (settings.theme === 'dark') {
          html.classList.add('dark');
      } else if (settings.theme === 'light') {
          // Already removed above
      } else {
          // System
          if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
              html.classList.add('dark');
          }
      }
  };

  const handleLoginSuccess = () => {
      setIsAuthenticated(true);
      applyTheme(); // Re-apply user theme on login
      NotificationService.requestPermission();
      NotificationService.scheduleNotifications();
  };

  const handleEditTransaction = (t: Transaction) => {
      setEditingTransaction(t);
      setIsAddMode(true);
  };

  const renderScreen = () => {
    switch (currentTab) {
      case 'home':
        return <HomeScreen key={key} onAddIncome={() => { setEditingTransaction(null); setIsAddMode(true); }} onEditTransaction={handleEditTransaction} />;
      case 'analysis':
        return <AnalysisScreen key={key} />;
      case 'budget':
        return <BudgetScreen key={key} />;
      case 'profile':
        return <ProfileScreen />;
      case 'add':
        return <HomeScreen key={key} onAddIncome={() => { setEditingTransaction(null); setIsAddMode(true); }} onEditTransaction={handleEditTransaction} />;
      default:
        return <HomeScreen key={key} onAddIncome={() => { setEditingTransaction(null); setIsAddMode(true); }} onEditTransaction={handleEditTransaction} />;
    }
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'add') {
      setEditingTransaction(null);
      setIsAddMode(true);
    } else {
      setCurrentTab(tab);
    }
  };

  const handleSave = () => {
      setIsAddMode(false);
      setEditingTransaction(null);
      setKey(prev => prev + 1); 
      setCurrentTab('home');
  }

  if (!isAuthenticated) {
      return (
          <div className="min-h-screen bg-black flex justify-center">
             <div className="w-full max-w-md h-[100dvh] relative shadow-2xl overflow-hidden">
                <AuthScreen onLoginSuccess={handleLoginSuccess} />
             </div>
          </div>
      );
  }

  if (isAddMode) {
      return (
          <div className="min-h-screen bg-black flex justify-center">
             <div className="w-full max-w-md h-[100dvh] bg-surface relative shadow-2xl overflow-hidden">
                <AddTransactionScreen 
                    onBack={() => { setIsAddMode(false); setEditingTransaction(null); }} 
                    onSave={handleSave} 
                    transactionToEdit={editingTransaction}
                />
             </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-black flex justify-center">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-md h-[100dvh] bg-background relative shadow-2xl overflow-hidden flex flex-col transition-colors">
        
        {/* Screen Content */}
        <div className="flex-1 overflow-hidden relative">
          {renderScreen()}
        </div>

        {/* Bottom Navigation */}
        <BottomNav currentTab={currentTab} onTabChange={handleTabChange} />
      </div>
    </div>
  );
};

export default App;