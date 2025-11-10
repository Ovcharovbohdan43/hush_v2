import { Shield } from 'lucide-react';

export function BrandKit() {
  const colors = [
    { name: 'Primary Purple', hex: '#7C3AED', usage: 'Primary actions, branding' },
    { name: 'Deep Purple', hex: '#6D28D9', usage: 'Hover states, depth' },
    { name: 'Accent Indigo', hex: '#4F46E5', usage: 'Accents, links' },
    { name: 'Success Green', hex: '#10B981', usage: 'Low risk, success states' },
    { name: 'Warning Orange', hex: '#F59E0B', usage: 'Medium risk, warnings' },
    { name: 'Danger Red', hex: '#EF4444', usage: 'High risk, errors' },
    { name: 'Slate 900', hex: '#0F172A', usage: 'Headings, primary text' },
    { name: 'Slate 600', hex: '#475569', usage: 'Body text' },
    { name: 'Slate 400', hex: '#94A3B8', usage: 'Muted text, disabled' },
    { name: 'Slate 100', hex: '#F1F5F9', usage: 'Backgrounds, subtle fills' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-slate-900">Brand Identity</h2>
        <p className="text-slate-600">Logo, colors, and typography system</p>
      </div>

      {/* Logo */}
      <div className="bg-white rounded-xl p-8 border border-slate-200">
        <h3 className="text-slate-800 mb-6">Logo & Icon</h3>
        <div className="flex items-center gap-12 flex-wrap">
          {/* Main Logo */}
          <div className="space-y-3">
            <p className="text-slate-500">Primary Logo</p>
            <div className="flex items-center gap-3 bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 rounded-xl">
              <Shield className="w-8 h-8 text-white" strokeWidth={2} />
              <span className="text-white tracking-tight" style={{ fontSize: '32px', fontWeight: 700 }}>
                Hush
              </span>
            </div>
          </div>

          {/* Icon Only */}
          <div className="space-y-3">
            <p className="text-slate-500">Icon Only</p>
            <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Shield className="w-9 h-9 text-white" strokeWidth={2.5} />
            </div>
          </div>

          {/* Light Version */}
          <div className="space-y-3">
            <p className="text-slate-500">Light Version</p>
            <div className="flex items-center gap-3 bg-white border-2 border-purple-600 px-6 py-4 rounded-xl">
              <Shield className="w-8 h-8 text-purple-600" strokeWidth={2} />
              <span className="text-purple-600 tracking-tight" style={{ fontSize: '32px', fontWeight: 700 }}>
                Hush
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Color Palette */}
      <div className="bg-white rounded-xl p-8 border border-slate-200">
        <h3 className="text-slate-800 mb-6">Color Palette</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {colors.map((color) => (
            <div key={color.hex} className="space-y-2">
              <div
                className="h-24 rounded-lg shadow-sm border border-slate-200"
                style={{ backgroundColor: color.hex }}
              />
              <div>
                <p className="text-slate-900">{color.name}</p>
                <p className="text-slate-500" style={{ fontSize: '12px' }}>{color.hex}</p>
                <p className="text-slate-400" style={{ fontSize: '11px' }}>{color.usage}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Typography */}
      <div className="bg-white rounded-xl p-8 border border-slate-200">
        <h3 className="text-slate-800 mb-6">Typography</h3>
        <div className="space-y-6">
          <div>
            <p className="text-slate-500 mb-2">Headings</p>
            <p style={{ fontSize: '32px', fontWeight: 700 }} className="text-slate-900">
              Inter Bold — 700
            </p>
            <p className="text-slate-500" style={{ fontSize: '14px' }}>
              Used for: Logo, headings (h1, h2, h3)
            </p>
          </div>
          <div>
            <p className="text-slate-500 mb-2">Body Text</p>
            <p style={{ fontSize: '16px', fontWeight: 400 }} className="text-slate-600">
              Inter Regular — 400
            </p>
            <p className="text-slate-500" style={{ fontSize: '14px' }}>
              Used for: Body copy, descriptions, helper text
            </p>
          </div>
          <div>
            <p className="text-slate-500 mb-2">Medium Weight</p>
            <p style={{ fontSize: '16px', fontWeight: 500 }} className="text-slate-700">
              Inter Medium — 500
            </p>
            <p className="text-slate-500" style={{ fontSize: '14px' }}>
              Used for: Buttons, labels, emphasis
            </p>
          </div>
        </div>
      </div>

      {/* Design Principles */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-8 border border-purple-200">
        <h3 className="text-slate-800 mb-4">Design Principles</h3>
        <div className="grid md:grid-cols-2 gap-4 text-slate-700">
          <div>
            <p className="font-medium text-purple-900">🛡️ Safety & Trust</p>
            <p className="text-slate-600" style={{ fontSize: '14px' }}>
              Convey security through calm colors and confident design
            </p>
          </div>
          <div>
            <p className="font-medium text-purple-900">🎯 Clarity First</p>
            <p className="text-slate-600" style={{ fontSize: '14px' }}>
              Every element has a clear purpose, no confusion
            </p>
          </div>
          <div>
            <p className="font-medium text-purple-900">✨ Minimal Warmth</p>
            <p className="text-slate-600" style={{ fontSize: '14px' }}>
              Clean and minimal, but friendly and approachable
            </p>
          </div>
          <div>
            <p className="font-medium text-purple-900">⚡ Speed & Efficiency</p>
            <p className="text-slate-600" style={{ fontSize: '14px' }}>
              Quick actions, no unnecessary steps
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
