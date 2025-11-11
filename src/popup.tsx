import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Shield, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from './components/ui/button';
import { apiClient } from './lib/api';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { toast, Toaster } from 'sonner';
import './index.css';

function PopupContent() {
  const { isAuthenticated } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isProtected, setIsProtected] = useState(false);
  const [lastAlias, setLastAlias] = useState<string | null>(null);
  const [stats, setStats] = useState({ today: 0, total: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      const response = await apiClient.listAliases();
      const aliases = response.aliases;
      if (aliases.length > 0) {
        setLastAlias(aliases[0].address);
      }
      const today = new Date().toDateString();
      const todayAliases = aliases.filter(
        (a) => new Date(a.created_at).toDateString() === today
      ).length;
      setStats({ today: todayAliases, total: aliases.length });
    } catch (error) {
      console.error('Failed to load aliases:', error);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProtect = async () => {
    if (!isAuthenticated) {
      chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
      return;
    }

    try {
      setLoading(true);
      const alias = await apiClient.createAlias({ alias_type: 'random' });
      setLastAlias(alias.address);
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (email) => {
            const activeElement = document.activeElement as HTMLInputElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
              activeElement.value = email;
              activeElement.dispatchEvent(new Event('input', { bubbles: true }));
            }
          },
          args: [alias.address],
        });
      }
      
      setIsProtected(true);
      toast.success('Email protected!');
      loadData();
      setTimeout(() => setIsProtected(false), 3000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create alias');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSettings = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
  };

  const handleOpenDashboard = () => {
    chrome.tabs.create({ url: 'http://localhost:3000/dashboard' });
  };

  if (!isAuthenticated) {
    return (
      <div className="w-80 bg-white min-h-[420px] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-white tracking-tight text-2xl font-bold">Hush</h1>
              <p className="text-purple-100 text-xs">v0.1.0</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center px-6 py-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-violet-600" strokeWidth={2} />
            </div>
            <div className="space-y-2">
              <h2 className="text-slate-900 text-lg font-semibold">Welcome to Hush</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Protect your email with disposable aliases. Sign in to get started.
              </p>
            </div>
            <Button
              className="w-full h-11 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-purple-500/30 transition-all duration-150 mt-4"
              onClick={handleOpenSettings}
            >
              Sign In to Continue
            </Button>
          </div>
        </div>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="w-80 bg-white min-h-[420px] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-white tracking-tight text-2xl font-bold">Hush</h1>
              <p className="text-purple-100 text-xs">v0.1.0</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-lg transition-colors"
            onClick={handleOpenDashboard}
            title="Open Dashboard"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-5">
          {/* Welcome Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-slate-600 text-xs font-medium">Extension Active</span>
            </div>
            <h2 className="text-slate-900 text-base font-semibold mt-1">
              Welcome back! 👋
            </h2>
            <p className="text-slate-500 text-xs leading-relaxed">
              Create a protected email alias in one click
            </p>
          </div>

          {/* Main Action Button */}
          <div className="space-y-2">
            <Button
              className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-purple-500/30 transition-all duration-150 font-medium"
              onClick={handleProtect}
              disabled={loading}
            >
              {isProtected ? (
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  <span>Email Protected!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <span>{loading ? 'Creating...' : 'Protect Email'}</span>
                </div>
              )}
            </Button>
            <p className="text-center text-slate-400 text-xs px-2">
              Click to insert a protected email alias into the active field
            </p>
          </div>

          {/* Last Alias */}
          {lastAlias && (
            <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">
                  Last Alias
                </span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-slate-700 bg-white px-3 py-2.5 rounded-lg border border-slate-200 text-xs font-mono break-all">
                  {lastAlias}
                </code>
                <Button
                  size="sm"
                  variant={copied ? "default" : "outline"}
                  className={`h-9 w-9 p-0 flex-shrink-0 ${copied ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' : ''}`}
                  onClick={() => handleCopy(lastAlias)}
                  title={copied ? 'Copied!' : 'Copy to clipboard'}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">
                Today
              </p>
              <p className="text-purple-600 text-2xl font-bold mb-1">{stats.today}</p>
              <p className="text-slate-600 text-xs">aliases</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">
                Total
              </p>
              <p className="text-green-600 text-2xl font-bold mb-1">{stats.total}</p>
              <p className="text-slate-600 text-xs">aliases</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 px-6 py-3 bg-slate-50/50">
        <button
          className="w-full text-purple-600 hover:text-purple-700 py-2 rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium"
          onClick={handleOpenSettings}
        >
          Open Settings
        </button>
      </div>
      <Toaster />
    </div>
  );
}

function Popup() {
  return (
    <AuthProvider>
      <PopupContent />
    </AuthProvider>
  );
}

// Инициализация React приложения
const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<Popup />);
}
