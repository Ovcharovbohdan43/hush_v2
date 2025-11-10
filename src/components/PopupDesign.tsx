import { Shield, Copy, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';

export function PopupDesign() {
  const [copied, setCopied] = useState(false);
  const [isProtected, setIsProtected] = useState(false);
  const lastAlias = "hidden.fox.2847@hush.email";

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProtect = () => {
    setIsProtected(true);
    setTimeout(() => setIsProtected(false), 3000);
  };

  return (
    <div className="inline-block">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        style={{ width: '320px', height: '420px' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-white tracking-tight" style={{ fontSize: '24px', fontWeight: 700 }}>
                Hush
              </h1>
              <p className="text-purple-100" style={{ fontSize: '12px' }}>
                v0.0.1
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-slate-600" style={{ fontSize: '13px' }}>
                Extension Active
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-slate-500 hover:text-slate-700"
              onClick={() => {}}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>

          {/* Main Action */}
          <div className="space-y-3">
            <Button
              className="w-full h-14 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-purple-500/30 transition-all duration-150"
              onClick={handleProtect}
            >
              {isProtected ? (
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  <span style={{ fontSize: '15px', fontWeight: 500 }}>Email Protected!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <span style={{ fontSize: '15px', fontWeight: 500 }}>Protect Email</span>
                </div>
              )}
            </Button>
            <p className="text-center text-slate-500" style={{ fontSize: '12px' }}>
              Click to insert a protected email alias
            </p>
          </div>

          {/* Last Alias */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-slate-500" style={{ fontSize: '12px', fontWeight: 500 }}>
                LAST ALIAS
              </span>
              <span className="text-slate-400" style={{ fontSize: '11px' }}>
                2 min ago
              </span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-slate-700 bg-white px-3 py-2 rounded-lg border border-slate-200" style={{ fontSize: '12px' }}>
                {lastAlias}
              </code>
              <Button
                size="sm"
                variant={copied ? "default" : "outline"}
                className={`h-9 px-3 ${copied ? 'bg-green-500 hover:bg-green-600 text-white' : ''}`}
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-3 border border-purple-200">
              <p className="text-slate-500" style={{ fontSize: '11px', fontWeight: 500 }}>
                TODAY
              </p>
              <p className="text-purple-600" style={{ fontSize: '24px', fontWeight: 700 }}>
                3
              </p>
              <p className="text-slate-600" style={{ fontSize: '12px' }}>
                aliases created
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200">
              <p className="text-slate-500" style={{ fontSize: '11px', fontWeight: 500 }}>
                TOTAL
              </p>
              <p className="text-green-600" style={{ fontSize: '24px', fontWeight: 700 }}>
                47
              </p>
              <p className="text-slate-600" style={{ fontSize: '12px' }}>
                emails protected
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-4">
          <button
            className="w-full text-purple-600 hover:text-purple-700 py-2 rounded-lg hover:bg-purple-50 transition-colors"
            style={{ fontSize: '13px', fontWeight: 500 }}
          >
            Open Settings
          </button>
        </div>
      </div>
    </div>
  );
}
