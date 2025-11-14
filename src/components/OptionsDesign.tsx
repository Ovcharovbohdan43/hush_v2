import { Shield, Save, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Alert, AlertDescription } from './ui/alert';

export function OptionsDesign() {
  const [saved, setSaved] = useState(false);
  const [limitPerDay, setLimitPerDay] = useState('10');
  const [autoInsert, setAutoInsert] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="inline-block">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        style={{ width: '600px', height: '600px' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-white tracking-tight" style={{ fontSize: '28px', fontWeight: 700 }}>
                Hush Settings
              </h1>
              <p className="text-purple-100" style={{ fontSize: '14px' }}>
                Configure your email protection
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 overflow-y-auto" style={{ height: 'calc(600px - 90px - 80px)' }}>
          {/* Success Alert */}
          {saved && (
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Settings saved successfully! Changes will take effect immediately.
              </AlertDescription>
            </Alert>
          )}

          {/* Limit Per Day */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="limit" className="text-slate-700" style={{ fontSize: '14px', fontWeight: 500 }}>
                Daily Alias Limit
              </Label>
              <p className="text-slate-500" style={{ fontSize: '13px' }}>
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
              className="h-12 rounded-xl border-slate-300"
            />
          </div>

          {/* Auto-insert Toggle */}
          <div className="flex items-start justify-between gap-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
            <div className="space-y-1 flex-1">
              <Label htmlFor="auto-insert" className="text-slate-700" style={{ fontSize: '14px', fontWeight: 500 }}>
                Enable Auto-Insert
              </Label>
              <p className="text-slate-500" style={{ fontSize: '13px' }}>
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

          {/* Additional Options */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-slate-800 mb-4" style={{ fontSize: '16px', fontWeight: 600 }}>
              Privacy Options
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-700" style={{ fontSize: '14px', fontWeight: 500 }}>
                    Show risk warnings
                  </p>
                  <p className="text-slate-500" style={{ fontSize: '12px' }}>
                    Display security risk level for websites
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-700" style={{ fontSize: '14px', fontWeight: 500 }}>
                    Analytics & Telemetry
                  </p>
                  <p className="text-slate-500" style={{ fontSize: '12px' }}>
                    Help improve Hush by sharing anonymous usage data
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            className="text-slate-600 hover:text-slate-800 transition-colors"
            style={{ fontSize: '14px', fontWeight: 500 }}
          >
            Reset to Defaults
          </button>
          <Button
            onClick={handleSave}
            className="h-11 px-8 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-purple-500/30"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
