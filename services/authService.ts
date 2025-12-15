import { UserProfile } from '../types';
import { StorageService } from './storageService';
import { auth } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';

export const AuthService = {
  
  isAuthenticated: async (): Promise<boolean> => {
    // 1. Check Real Firebase Auth
    if (auth) {
        return new Promise((resolve) => {
            const unsubscribe = auth.onAuthStateChanged((user) => {
                unsubscribe();
                resolve(!!user);
            });
        });
    }
    // 2. Fallback to Mock Session
    const session = localStorage.getItem('spendsense_session');
    return !!session;
  },

  getCurrentUser: async (): Promise<UserProfile | null> => {
    // 1. Check Real Firebase User
    if (auth && auth.currentUser) {
        const u = auth.currentUser;
        // Sync local settings name if needed
        const settings = await StorageService.getSettings();
        if (settings.profile.uid !== u.uid) {
            settings.profile.uid = u.uid;
            settings.profile.email = u.email || '';
            settings.profile.name = u.displayName || 'User';
            await StorageService.saveSettings(settings);
        }
        return settings.profile;
    }

    // 2. Fallback Mock User
    const settings = await StorageService.getSettings();
    return settings.profile;
  },

  login: async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (auth) {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    } else {
        // MOCK MODE
        await new Promise(r => setTimeout(r, 1000));
        if (email && password.length >= 6) {
            localStorage.setItem('spendsense_session', 'valid_token');
            return { success: true };
        }
        return { success: false, error: 'Mock Login: Use a password longer than 6 chars. (Add Firebase keys to disable mock mode)' };
    }
  },

  signup: async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (auth) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: name });
            
            // Initialize Settings for this real user
            const settings = await StorageService.getSettings();
            settings.profile.name = name;
            settings.profile.email = email;
            settings.profile.uid = userCredential.user.uid;
            await StorageService.saveSettings(settings);

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    } else {
        // MOCK MODE
        await new Promise(r => setTimeout(r, 1500));
        if (email && password.length >= 6) {
            localStorage.setItem('spendsense_session', 'valid_token');
            const settings = await StorageService.getSettings();
            settings.profile.name = name;
            settings.profile.email = email;
            settings.profile.uid = 'user_' + Date.now();
            await StorageService.saveSettings(settings);
            return { success: true };
        }
        return { success: false, error: 'Mock Signup Failed. (Add Firebase keys to disable mock mode)' };
    }
  },

  logout: async () => {
    if (auth) {
        await signOut(auth);
    }
    localStorage.removeItem('spendsense_session');
    window.location.reload();
  }
};