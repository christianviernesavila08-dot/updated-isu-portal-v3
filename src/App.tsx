import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { signup, login } from './lib/api';
import { EvaluationForm } from './components/EvaluationForm';
import { Dashboard } from './components/Dashboard';
import { Button } from './components/ui/Button';
import { Home, LayoutDashboard, ClipboardList, LogOut, ChevronRight, User as UserIcon, Download, Menu, X, Mail, Lock, UserPlus, RefreshCcw } from 'lucide-react';
import { cn } from './lib/utils';
import { HomeView } from './components/HomeView';

interface SimpleUser {
  id: string;
  username: string;
  displayName: string;
}

export default function App() {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'form' | 'dashboard'>('home');
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [shareId, setShareId] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('isu-portal-user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('isu-portal-user');
      }
    }

    // Check for shareId in URL parameters
    const params = new URLSearchParams(window.location.search);
    const sharedLinkId = params.get('shareId');
    if (sharedLinkId) {
      setShareId(sharedLinkId);
      setActiveTab('form');
    }

    setLoading(false);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const authResponse = isSignUp
        ? await signup(usernameInput.trim().toLowerCase(), password, usernameInput.trim())
        : await login(usernameInput.trim().toLowerCase(), password);

      setUser(authResponse);
      localStorage.setItem('isu-portal-user', JSON.stringify(authResponse));
      setMessage(isSignUp ? 'Account created successfully.' : 'Signed in successfully.');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Connection error. Please try again.');
      console.error(err);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('isu-portal-user');
    setActiveTab('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-isu-green" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-6 bg-[url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80')] bg-cover bg-blend-overlay">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl border-t-[8px] border-isu-green max-w-md w-full space-y-6"
        >
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center p-1 shadow-lg ring-4 ring-isu-gold/20">
              <img src="isulogo.png" alt="ISU Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-black text-isu-green uppercase tracking-tighter">Performance Portal</h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest leading-none mt-1">ISU Assessment System</p>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Enter your username"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-isu-green transition-all"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-gray-400 uppercase">Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-isu-green transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-isu-green transition-all"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="text-[10px] font-bold text-rose-500 bg-rose-50 p-3 rounded-lg text-center uppercase tracking-wider">
                {error}
              </p>
            )}

            {message && (
              <p className="text-[10px] font-bold text-isu-green bg-isu-green/5 p-3 rounded-lg text-center uppercase tracking-wider">
                {message}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full bg-isu-green hover:bg-isu-dark-green rounded-xl h-14 text-sm font-black uppercase tracking-widest gap-3 shadow-xl shadow-isu-green/20"
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
              {isSignUp ? <UserPlus className="w-5 h-5 text-isu-gold" /> : <ChevronRight className="w-5 h-5 text-isu-gold" />}
            </Button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              className="text-[10px] font-black text-isu-green uppercase tracking-widest hover:underline"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-isu-green text-white p-4 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <img src="/isulogo.png" alt="ISU Logo" className="w-8 h-8 object-contain bg-white rounded-full p-0.5" />
          <span className="font-black text-xs uppercase tracking-tighter">ISU Portal</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar / Drawer */}
      <aside className={cn(
        "fixed inset-0 z-50 md:sticky md:top-0 md:z-30 w-72 bg-isu-green border-r border-isu-dark-green text-white flex flex-col shrink-0 h-screen shadow-2xl transition-transform duration-300 overflow-y-auto",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-8 pb-10">
          <div className="flex items-center gap-3 mb-10 border-b border-isu-dark-green pb-6 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-1 shadow-inner">
                <img src="/isulogo.png" alt="ISU Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="font-bold text-sm leading-tight text-white uppercase">Isabela State University</h1>
                <p className="text-[9px] font-bold text-isu-gold uppercase tracking-wider">Cauayan Campus</p>
              </div>
            </div>
            <button className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-5 h-5 text-white/50" />
            </button>
          </div>
          
          <nav className="space-y-1">
            <SidebarItem
              icon={<Home className="w-5 h-5" />}
              label="Home Overview"
              active={activeTab === 'home'}
              onClick={() => { setActiveTab('home'); setIsSidebarOpen(false); }}
            />
            <SidebarItem
              icon={<ClipboardList className="w-5 h-5" />}
              label="Evaluation Form"
              active={activeTab === 'form'}
              onClick={() => { setActiveTab('form'); setIsSidebarOpen(false); }}
            />
            <SidebarItem
              icon={<LayoutDashboard className="w-5 h-5" />}
              label="Management Dashboard"
              active={activeTab === 'dashboard'}
              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
            />
          </nav>

          {installPrompt && (
            <button
              onClick={handleInstall}
              className="mt-8 w-full flex items-center gap-3 px-4 py-4 rounded-xl font-black bg-isu-gold text-isu-dark-green shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest"
            >
              <Download className="w-4 h-4" /> Install ISU App
            </button>
          )}
        </div>

        <div className="mt-auto p-6 space-y-4 border-t border-isu-dark-green bg-isu-dark-green/30">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white/40" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user.displayName}</p>
              <p className="text-[9px] text-isu-gold/70 truncate uppercase font-bold tracking-widest">@{user.username}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'home' ? (
              <HomeView 
                user={user}
                onStart={() => setActiveTab('form')} 
                onDashboard={() => setActiveTab('dashboard')} 
              />
            ) : activeTab === 'form' ? (
              <EvaluationForm user={user} shareId={shareId} />
            ) : (
              <Dashboard user={user} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-4 rounded-xl font-bold transition-all text-left group",
        active
          ? "bg-isu-gold text-isu-dark-green shadow-lg shadow-black/20"
          : "text-white/60 hover:bg-white/10 hover:text-white"
      )}
    >
      <span className={cn("transition-transform group-hover:scale-110", active ? "text-isu-dark-green" : "text-isu-gold/50 group-hover:text-isu-gold")}>
        {icon}
      </span>
      <span className="text-sm tracking-tight">{label}</span>
      {active && <ChevronRight className="w-4 h-4 ml-auto" />}
    </button>
  );
}
