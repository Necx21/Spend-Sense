import React from 'react';
import { Home, PlusCircle, PieChart, User, WalletCards } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'budget', icon: WalletCards, label: 'Budget' },
    { id: 'add', icon: PlusCircle, label: 'Add', isPrimary: true },
    { id: 'analysis', icon: PieChart, label: 'Stats' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-md pb-safe px-6 py-2 flex justify-between items-end z-50 rounded-t-[2rem] shadow-[0_-5px_20px_rgba(0,0,0,0.05)] border-t border-white/5">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onTabChange(item.id)}
          className={`flex flex-col items-center justify-center transition-all duration-300 relative ${
            item.isPrimary ? '-mt-10' : 'pb-2'
          }`}
        >
          {item.isPrimary ? (
            <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center text-primary transform transition-transform active:scale-90 border-4 border-background shadow-lg">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md text-white">
                    <item.icon size={28} />
                </div>
            </div>
          ) : (
            <>
              <div className={`p-2 rounded-xl transition-all duration-300 ${currentTab === item.id ? 'bg-primary/10 text-primary' : 'text-muted hover:text-text'}`}>
                  <item.icon size={24} />
              </div>
              <span
                className={`text-[10px] mt-1 font-bold transition-all duration-300 ${
                  currentTab === item.id ? 'text-primary scale-110' : 'text-transparent scale-0 h-0'
                }`}
              >
                {item.label}
              </span>
            </>
          )}
        </button>
      ))}
    </div>
  );
};
