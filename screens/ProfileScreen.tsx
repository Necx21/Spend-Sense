import React, { useState, useEffect, useRef } from 'react';
import { User, Settings, Download, Trash2, Moon, Sun, Smartphone, Globe, Edit3, X, Check, Camera, Cloud, FileSpreadsheet, LogOut, HardDrive, Upload, RefreshCw } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { AppSettings, UserProfile } from '../types';
import { CURRENCIES, AVATARS } from '../constants';

export const ProfileScreen: React.FC = () => {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [storageMode, setStorageMode] = useState<'local' | 'cloud'>('local');
    const [lastSynced, setLastSynced] = useState('Just now');
    
    // Edit Form State
    const [editName, setEditName] = useState('');
    const [editUsername, setEditUsername] = useState('');
    const [editAvatar, setEditAvatar] = useState('');
    const [editAvatarImage, setEditAvatarImage] = useState<string | undefined>(undefined);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const importInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadSettings();
        StorageService.listenForUpdates(() => {
            loadSettings();
            setLastSynced('Just now (Live)');
        });
    }, []);

    const loadSettings = async () => {
        const s = await StorageService.getSettings();
        setSettings(s);
        setEditName(s.profile.name);
        setEditUsername(s.profile.username);
        setEditAvatar(s.profile.avatarId);
        setEditAvatarImage(s.profile.avatarImage);
    }

    const updateSettings = async (partial: Partial<AppSettings>) => {
        if(!settings) return;
        const newSettings = { ...settings, ...partial };
        setSettings(newSettings);
        await StorageService.saveSettings(newSettings);
    }

    const handleSaveProfile = async () => {
        if(!settings) return;
        const newProfile: UserProfile = {
            name: editName,
            username: editUsername,
            avatarId: editAvatar,
            avatarImage: editAvatarImage
        };
        await updateSettings({ profile: newProfile });
        setShowEditProfile(false);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditAvatarImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target?.result as string;
            const success = await StorageService.importData(content);
            if (success) {
                alert("Data imported successfully! The app will refresh.");
                window.location.reload();
            } else {
                alert("Invalid file format. Please use a file exported from SpendSense.");
            }
        };
        reader.readAsText(file);
    };

    const exportBackup = async () => {
        const data = await StorageService.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `spendsense_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    const exportCSV = async () => {
        const csv = await StorageService.exportToCSV();
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `spendsense_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const clearData = async () => {
        if(window.confirm("ARE YOU SURE? This will wipe all your expenses permanently.")) {
            await StorageService.clearAll();
            window.location.reload();
        }
    }
    
    const handleLogout = () => {
        alert("Logged out successfully! (Simulated)");
    };

    if(!settings) return null;

  return (
    <div className="flex flex-col h-full bg-background transition-colors pb-24 overflow-y-auto">
        <div className="bg-surface pb-10 pt-12 px-6 rounded-b-[3rem] shadow-clay-card mb-6 transition-colors relative z-10">
            <div className="flex flex-col items-center justify-center text-center">
                <div className="w-28 h-28 rounded-full bg-surface shadow-clay-inset flex items-center justify-center text-5xl mb-4 border-4 border-surface overflow-hidden relative group">
                    {settings.profile.avatarImage ? (
                        <img src={settings.profile.avatarImage} className="w-full h-full object-cover" alt="Profile" />
                    ) : (
                        <span>{settings.profile.avatarId}</span>
                    )}
                    <button 
                        onClick={() => setShowEditProfile(true)}
                        className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Edit3 className="text-white" />
                    </button>
                </div>
                <h1 className="text-3xl font-bold text-text">{settings.profile.name}</h1>
                <p className="text-muted font-medium">{settings.profile.username}</p>
                
                <button 
                    onClick={() => setShowEditProfile(true)}
                    className="mt-4 bg-surface px-6 py-2 rounded-xl text-xs font-bold text-primary flex items-center gap-2 uppercase tracking-wide shadow-clay-card active:scale-95"
                >
                    <Edit3 size={14} /> Edit Profile
                </button>
            </div>
        </div>

        <div className="px-6 space-y-6">
            {/* Preferences */}
             <div className="clay-card p-5 space-y-4">
                <h3 className="text-muted text-[10px] font-bold uppercase tracking-widest mb-2">Appearance & Currency</h3>
                
                <div className="grid grid-cols-3 gap-3">
                    {['light', 'dark', 'system'].map((t) => (
                        <button 
                            key={t}
                            onClick={() => updateSettings({ theme: t as any })}
                            className={`py-3 rounded-xl text-xs font-bold capitalize flex items-center justify-center gap-1 transition-all ${
                                settings.theme === t 
                                ? 'bg-primary text-white dark:text-black shadow-md' 
                                : 'bg-surface shadow-clay-inset text-muted hover:text-primary'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                 <div className="pt-2">
                     <div className="flex items-center gap-3 mb-3">
                         <div className="w-10 h-10 rounded-xl bg-surface shadow-clay-inset flex items-center justify-center text-secondary">
                             <Globe size={20} />
                         </div>
                         <span className="text-text font-bold text-sm">Currency</span>
                    </div>
                    <div className="relative">
                        <select 
                            value={settings.currencyCode}
                            onChange={(e) => updateSettings({ currencyCode: e.target.value })}
                            className="w-full bg-surface shadow-clay-inset rounded-xl p-4 text-text outline-none appearance-none font-bold text-sm"
                        >
                            {CURRENCIES.map(c => (
                                <option key={c.code} value={c.code}>
                                    {c.symbol} {c.code} - {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Data Management */}
            <div className="clay-card p-5 space-y-4">
                <h3 className="text-muted text-[10px] font-bold uppercase tracking-widest mb-2">Data & Sync</h3>
                
                {/* Storage Toggle */}
                <div className="bg-surface shadow-clay-inset p-1 rounded-xl flex mb-2">
                     <button 
                        onClick={() => setStorageMode('local')}
                        className={`flex-1 py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            storageMode === 'local' ? 'bg-surface text-primary shadow-clay-card' : 'text-muted'
                        }`}
                     >
                         <HardDrive size={14} /> Local
                     </button>
                     <button 
                        onClick={() => setStorageMode('cloud')}
                        className={`flex-1 py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            storageMode === 'cloud' ? 'bg-surface text-secondary shadow-clay-card' : 'text-muted'
                        }`}
                     >
                         <Cloud size={14} /> Cloud
                     </button>
                </div>
                
                {storageMode === 'cloud' && (
                    <div className="flex items-center justify-center gap-2 text-[10px] text-income font-bold mb-2 animate-pulse">
                        <RefreshCw size={10} className="animate-spin" />
                        Synced across devices: {lastSynced}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={exportBackup} className="bg-surface shadow-clay-card p-4 rounded-xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform">
                         <Download size={20} className="text-primary" />
                         <span className="text-text font-bold text-xs">Backup (JSON)</span>
                    </button>

                    <button onClick={() => importInputRef.current?.click()} className="bg-surface shadow-clay-card p-4 rounded-xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform">
                         <Upload size={20} className="text-secondary" />
                         <span className="text-text font-bold text-xs">Import Data</span>
                    </button>
                    <input type="file" ref={importInputRef} onChange={handleImportData} accept=".json" className="hidden" />
                </div>

                <button onClick={exportCSV} className="w-full bg-surface shadow-clay-card p-4 rounded-xl flex items-center justify-between group active:scale-[0.98] transition-transform">
                    <div className="flex items-center gap-3">
                        <FileSpreadsheet className="text-income" size={20} />
                        <span className="text-text font-bold text-sm">Export to Excel (CSV)</span>
                    </div>
                    <Download size={16} className="text-muted" />
                </button>

                <button onClick={clearData} className="w-full bg-surface shadow-clay-card p-4 rounded-xl flex items-center justify-between group active:scale-[0.98] transition-transform">
                    <div className="flex items-center gap-3">
                        <Trash2 className="text-expense" size={20} />
                        <span className="text-expense font-bold text-sm">Reset All Data</span>
                    </div>
                </button>
            </div>

            {/* Logout Section */}
            <button 
                onClick={handleLogout}
                className="w-full bg-surface text-expense p-4 rounded-2xl flex items-center justify-center gap-2 font-bold uppercase tracking-wide active:scale-95 transition-transform shadow-clay-card"
            >
                <LogOut size={20} /> Logout
            </button>
            
            <div className="text-center pt-2 pb-6">
                <p className="text-muted text-[10px] font-mono">SpendSense v2.4 • Neon Sync</p>
            </div>
        </div>

        {/* Edit Profile Modal */}
        {showEditProfile && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                <div className="clay-card w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-fade-in-up">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-text">Edit Profile</h3>
                        <button onClick={() => setShowEditProfile(false)} className="p-2 rounded-full hover:bg-black/5"><X size={20} className="text-muted" /></button>
                    </div>

                    <div className="space-y-5">
                        <div className="flex justify-center">
                             <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-surface shadow-clay-inset overflow-hidden border-2 border-surface">
                                    {editAvatarImage ? (
                                        <img src={editAvatarImage} className="w-full h-full object-cover" alt="Preview" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl">{editAvatar}</div>
                                    )}
                                </div>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 bg-primary p-2 rounded-full shadow-lg text-white dark:text-black"
                                >
                                    <Camera size={16} />
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleImageUpload} 
                                    accept="image/*" 
                                    className="hidden" 
                                />
                             </div>
                        </div>

                        <div>
                            <label className="text-xs text-muted font-bold uppercase ml-2">Display Name</label>
                            <input 
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                className="w-full mt-1 bg-surface shadow-clay-inset p-4 rounded-xl text-text outline-none focus:ring-1 focus:ring-primary font-bold"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-muted font-bold uppercase ml-2">Avatar Emoji</label>
                            <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar mt-1">
                                {AVATARS.map(a => (
                                    <button 
                                        key={a}
                                        onClick={() => { setEditAvatar(a); setEditAvatarImage(undefined); }}
                                        className={`text-2xl p-3 rounded-xl min-w-[3rem] transition-all ${editAvatar === a && !editAvatarImage ? 'bg-primary text-white dark:text-black scale-110 shadow-md' : 'bg-surface shadow-clay-card'}`}
                                    >
                                        {a}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <button 
                            onClick={handleSaveProfile}
                            className="btn-primary w-full py-4 rounded-2xl flex items-center justify-center gap-2 mt-4 shadow-lg active:scale-95 transition-transform"
                        >
                            <Check size={20} /> SAVE CHANGES
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};