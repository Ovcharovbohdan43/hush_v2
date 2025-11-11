import { useState, useEffect } from 'react';
import { Shield, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from './components/ui/button';
import { apiClient } from './lib/api';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { toast, Toaster } from 'sonner';

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
      <div className="w-80 bg-white">
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
        <div className="p-6 space-y-4">
          <p className="text-slate-600 text-sm text-center">
            Please sign in to use Hush
          </p>
          <Button
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
            onClick={handleOpenSettings}
          >
            Open Settings
          </Button>
        </div>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="w-80 bg-white">
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
            className="h-7 px-2 text-white hover:bg-white/20"
            onClick={handleOpenDashboard}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-slate-600 text-xs">Extension Active</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            className="w-full h-14 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-purple-500/30"
            onClick={handleProtect}
            disabled={loading}
          >
            {isProtected ? (
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span className="text-sm font-medium">Email Protected!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {loading ? 'Creating...' : 'Protect Email'}
                </span>
              </div>
            )}
          </Button>
          <p className="text-center text-slate-500 text-xs">
            Click to insert a protected email alias
          </p>
        </div>

        {lastAlias && (
          <div className="bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs font-medium">LAST ALIAS</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-slate-700 bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs">
                {lastAlias}
              </code>
              <Button
                size="sm"
                variant={copied ? "default" : "outline"}
                className={`h-9 px-3 ${copied ? 'bg-green-500 hover:bg-green-600 text-white' : ''}`}
                onClick={() => handleCopy(lastAlias)}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-3 border border-purple-200">
            <p className="text-slate-500 text-xs font-medium">TODAY</p>
            <p className="text-purple-600 text-2xl font-bold">{stats.today}</p>
            <p className="text-slate-600 text-xs">aliases created</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200">
            <p className="text-slate-500 text-xs font-medium">TOTAL</p>
            <p className="text-green-600 text-2xl font-bold">{stats.total}</p>
            <p className="text-slate-600 text-xs">aliases created</p>
          </div>
        </div>
      </div>

      <div className="px-6 pb-4">
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

export default function Popup() {
  return (
    <AuthProvider>
      <PopupContent />
    </AuthProvider>
  );
}
