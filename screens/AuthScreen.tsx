import React, { useState } from 'react';
import { AuthService } from '../services/authService';
import { User, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const res = await AuthService.login(email, password);
        if (res.success) {
          onLoginSuccess();
        } else {
          setError(res.error || 'Login failed');
        }
      } else {
        const res = await AuthService.signup(name, email, password);
        if (res.success) {
          onLoginSuccess();
        } else {
          setError(res.error || 'Signup failed');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background items-center justify-center p-6 relative overflow-hidden transition-colors">
      {/* Decorative Background */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary opacity-20 blur-[100px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-secondary opacity-20 blur-[100px] rounded-full"></div>

      <div className="w-full max-w-sm z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-3xl mx-auto flex items-center justify-center mb-4 shadow-lg transform rotate-3">
             <Sparkles className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-black text-text tracking-tight mb-2">SpendSense</h1>
          <p className="text-muted font-medium">Master your money, effortlessly.</p>
        </div>

        <div className="clay-card p-8 bg-surface/50 backdrop-blur-md border border-white/5 animate-fade-in-up">
          <h2 className="text-2xl font-bold text-text mb-6 text-center">
            {isLogin ? 'Welcome Back!' : 'Create Account'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background/50 border border-transparent focus:border-primary/50 rounded-xl py-4 pl-12 pr-4 text-text outline-none font-bold transition-all"
                  required
                />
              </div>
            )}

            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={20} />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background/50 border border-transparent focus:border-primary/50 rounded-xl py-4 pl-12 pr-4 text-text outline-none font-bold transition-all"
                required
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={20} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background/50 border border-transparent focus:border-primary/50 rounded-xl py-4 pl-12 pr-4 text-text outline-none font-bold transition-all"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="text-expense text-xs font-bold text-center bg-expense/10 p-2 rounded-lg animate-pulse">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 mt-4 active:scale-95 transition-transform disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Sign Up'} <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-8">
          <p className="text-muted text-sm font-medium">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="ml-2 text-primary font-bold hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
        
        {/* Firebase Badge */}
        <div className="mt-8 flex justify-center opacity-50">
            <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full">
                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                <span className="text-[10px] font-mono text-muted uppercase">Firebase Supported</span>
            </div>
        </div>
      </div>
    </div>
  );
};
