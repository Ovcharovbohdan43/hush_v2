import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Shield, Save, Check } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Switch } from './components/ui/switch';
import { Alert, AlertDescription } from './components/ui/alert';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { apiClient } from './lib/api';
import { toast, Toaster } from 'sonner';
import './index.css';

function OptionsContent() {
  const { isAuthenticated, login, register, logout } = useAuth();
  const [saved, setSaved] = useState(false);
  const [limitPerDay, setLimitPerDay] = useState('10');
  const [autoInsert, setAutoInsert] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  
  // Target email state
  const [targetEmail, setTargetEmail] = useState('');
  const [targetEmailVerified, setTargetEmailVerified] = useState(false);
  const [targetEmailLoading, setTargetEmailLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    // Загружаем настройки из chrome.storage
    chrome.storage.sync.get(['limitPerDay', 'autoInsert'], (result) => {
      if (result.limitPerDay) setLimitPerDay(result.limitPerDay);
      if (result.autoInsert !== undefined) setAutoInsert(result.autoInsert);
    });
    
    // Загружаем target email если авторизованы
    if (isAuthenticated) {
      loadTargetEmail();
    }
  }, [isAuthenticated]);
  
  const loadTargetEmail = async () => {
    try {
      setTargetEmailLoading(true);
      const target = await apiClient.getTargetEmail();
      if (target.email) {
        setTargetEmail(target.email);
        setTargetEmailVerified(target.verified);
      }
    } catch (error) {
      console.error('Failed to load target email:', error);
    } finally {
      setTargetEmailLoading(false);
    }
  };
  
  const handleSaveTargetEmail = async () => {
    if (!targetEmail.trim()) {
      toast.error('Please enter a target email address');
      return;
    }
    
    try {
      setTargetEmailLoading(true);
      await apiClient.requestVerification(targetEmail.trim());
      setVerificationSent(true);
      toast.success('Verification email sent! Please check your inbox.');
      setTimeout(() => {
        setVerificationSent(false);
        loadTargetEmail();
      }, 3000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save target email');
    } finally {
      setTargetEmailLoading(false);
    }
  };

  const handleSave = async () => {
    await chrome.storage.sync.set({
      limitPerDay,
      autoInsert,
    });
    setSaved(true);
    toast.success('Settings saved!');
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({ email, password });
      }
      toast.success(isLogin ? 'Logged in!' : 'Registered!');
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-6 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-white tracking-tight text-3xl font-bold">Hush Settings</h1>
              <p className="text-purple-100 text-sm">Configure your email protection</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-b-2xl shadow-xl border border-slate-200 p-8 space-y-6">
          {/* Auth Section */}
          {!isAuthenticated ? (
            <div className="space-y-4 p-6 bg-slate-50 rounded-xl border border-slate-200">
              <h2 className="text-lg font-semibold">Authentication</h2>
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {isLogin ? 'Login' : 'Register'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsLogin(!isLogin)}
                  >
                    {isLogin ? 'Switch to Register' : 'Switch to Login'}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                <span className="text-green-800">You are logged in</span>
                <Button variant="outline" size="sm" onClick={logout}>
                  Logout
                </Button>
              </div>

              {/* Success Alert */}
              {saved && (
                <Alert className="bg-green-50 border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Settings saved successfully!
                  </AlertDescription>
                </Alert>
              )}

              {/* Limit Per Day */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="limit" className="text-slate-700 text-sm font-medium">
                    Daily Alias Limit
                  </Label>
                  <p className="text-slate-500 text-xs">
                    Maximum number of new email aliases you can create per day
                  </p>
                </div>
                <Input
                  id="limit"
                  type="number"
                  min="1"
                  max="100"
                  value={limitPerDay}
                  onChange={(e) => setLimitPerDay(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>

              {/* Auto-insert Toggle */}
              <div className="flex items-start justify-between gap-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="auto-insert" className="text-slate-700 text-sm font-medium">
                    Enable Auto-Insert
                  </Label>
                  <p className="text-slate-500 text-xs">
                    Automatically insert protected email when you focus on email input fields
                  </p>
                </div>
                <Switch
                  id="auto-insert"
                  checked={autoInsert}
                  onCheckedChange={setAutoInsert}
                  className="mt-1"
                />
              </div>

              {/* Target Email */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="target-email" className="text-slate-700 text-sm font-medium">
                    Target Email Address
                  </Label>
                  <p className="text-slate-500 text-xs">
                    Your real email address where forwarded emails will be sent. You'll need to verify this email.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      id="target-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={targetEmail}
                      onChange={(e) => setTargetEmail(e.target.value)}
                      className="h-12 rounded-xl flex-1"
                      disabled={targetEmailLoading}
                    />
                    <Button
                      onClick={handleSaveTargetEmail}
                      disabled={targetEmailLoading || !targetEmail.trim()}
                      className="h-12 px-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl"
                    >
                      {targetEmailLoading ? 'Saving...' : targetEmailVerified ? 'Update' : 'Save & Verify'}
                    </Button>
                  </div>
                  {targetEmail && (
                    <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
                      targetEmailVerified 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : verificationSent
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                    }`}>
                      {targetEmailVerified ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Email verified. Forwarding is active.</span>
                        </>
                      ) : verificationSent ? (
                        <>
                          <Shield className="w-4 h-4" />
                          <span>Verification email sent! Please check your inbox and click the verification link.</span>
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4" />
                          <span>Email not verified. Please save and verify to enable forwarding.</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </>
          )}

          {/* Footer Actions */}
          {isAuthenticated && (
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                className="text-slate-600 hover:text-slate-800 transition-colors text-sm font-medium"
                onClick={() => {
                  setLimitPerDay('10');
                  setAutoInsert(false);
                }}
              >
                Reset to Defaults
              </button>
              <Button
                onClick={handleSave}
                className="h-11 px-8 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Options() {
  return (
    <AuthProvider>
      <OptionsContent />
      <Toaster />
    </AuthProvider>
  );
}

// Инициализация React приложения
const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<Options />);
}
