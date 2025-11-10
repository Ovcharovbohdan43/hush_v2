import { Shield } from 'lucide-react';

export function IconSizes() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-slate-900">Extension Icon Exports</h2>
        <p className="text-slate-600">Required sizes for Chrome Web Store</p>
      </div>

      <div className="bg-white rounded-xl p-8 border border-slate-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* 16x16 */}
          <div className="space-y-3">
            <div className="flex items-center justify-center bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="w-4 h-4 bg-gradient-to-br from-violet-600 to-purple-600 rounded flex items-center justify-center">
                <Shield className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-slate-900" style={{ fontSize: '14px', fontWeight: 500 }}>
                16 × 16 px
              </p>
              <p className="text-slate-500" style={{ fontSize: '12px' }}>
                Toolbar icon (small)
              </p>
            </div>
          </div>

          {/* 48x48 */}
          <div className="space-y-3">
            <div className="flex items-center justify-center bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-slate-900" style={{ fontSize: '14px', fontWeight: 500 }}>
                48 × 48 px
              </p>
              <p className="text-slate-500" style={{ fontSize: '12px' }}>
                Extension page
              </p>
            </div>
          </div>

          {/* 128x128 */}
          <div className="space-y-3">
            <div className="flex items-center justify-center bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="w-32 h-32 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/30">
                <Shield className="w-20 h-20 text-white" strokeWidth={2} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-slate-900" style={{ fontSize: '14px', fontWeight: 500 }}>
                128 × 128 px
              </p>
              <p className="text-slate-500" style={{ fontSize: '12px' }}>
                Chrome Web Store
              </p>
            </div>
          </div>

          {/* 256x256 */}
          <div className="space-y-3">
            <div className="flex items-center justify-center bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="w-32 h-32 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/40">
                <Shield className="w-20 h-20 text-white" strokeWidth={2} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-slate-900" style={{ fontSize: '14px', fontWeight: 500 }}>
                256 × 256 px
              </p>
              <p className="text-slate-500" style={{ fontSize: '12px' }}>
                High-res display
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <h4 className="text-slate-800 mb-3">Export Guidelines</h4>
          <ul className="space-y-2 text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">•</span>
              <span style={{ fontSize: '14px' }}>
                Export as PNG with transparent background for sizes 16, 48, 128
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">•</span>
              <span style={{ fontSize: '14px' }}>
                Use gradient background (violet-600 to purple-600) with white shield icon
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">•</span>
              <span style={{ fontSize: '14px' }}>
                Corner radius: 12.5% of icon size (e.g., 16px radius for 128px icon)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">•</span>
              <span style={{ fontSize: '14px' }}>
                Shield icon should be approximately 62% of icon size
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Alternative Icon Styles */}
      <div className="bg-white rounded-xl p-8 border border-slate-200">
        <h3 className="text-slate-800 mb-6">Alternative Icon Styles</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
          {/* Gradient Fill */}
          <div className="space-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg mx-auto">
              <Shield className="w-9 h-9 text-white" strokeWidth={2.5} />
            </div>
            <p className="text-center text-slate-600" style={{ fontSize: '11px' }}>
              Primary
            </p>
          </div>

          {/* Solid Fill */}
          <div className="space-y-2">
            <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg mx-auto">
              <Shield className="w-9 h-9 text-white" strokeWidth={2.5} fill="white" />
            </div>
            <p className="text-center text-slate-600" style={{ fontSize: '11px' }}>
              Filled
            </p>
          </div>

          {/* Outline */}
          <div className="space-y-2">
            <div className="w-16 h-16 bg-white border-3 border-purple-600 rounded-xl flex items-center justify-center shadow-lg mx-auto">
              <Shield className="w-9 h-9 text-purple-600" strokeWidth={2.5} />
            </div>
            <p className="text-center text-slate-600" style={{ fontSize: '11px' }}>
              Outline
            </p>
          </div>

          {/* Monochrome Light */}
          <div className="space-y-2">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-lg mx-auto border border-slate-200">
              <Shield className="w-9 h-9 text-slate-700" strokeWidth={2.5} />
            </div>
            <p className="text-center text-slate-600" style={{ fontSize: '11px' }}>
              Light
            </p>
          </div>

          {/* Monochrome Dark */}
          <div className="space-y-2">
            <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg mx-auto">
              <Shield className="w-9 h-9 text-white" strokeWidth={2.5} />
            </div>
            <p className="text-center text-slate-600" style={{ fontSize: '11px' }}>
              Dark
            </p>
          </div>

          {/* Glass Effect */}
          <div className="space-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-600/90 to-purple-600/90 backdrop-blur rounded-xl flex items-center justify-center shadow-lg mx-auto border border-white/20">
              <Shield className="w-9 h-9 text-white" strokeWidth={2.5} />
            </div>
            <p className="text-center text-slate-600" style={{ fontSize: '11px' }}>
              Glass
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
