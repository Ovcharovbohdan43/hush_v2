import { Shield } from 'lucide-react';
import { useState } from 'react';

export function InlineButtonShowcase() {
  const [hoveredLight, setHoveredLight] = useState(false);
  const [hoveredDark, setHoveredDark] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-slate-800">Inline Button (Email Field Overlay)</h3>
        <p className="text-slate-600">
          32 × 32 px button that appears next to email input fields
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Light Background Example */}
        <div className="space-y-4">
          <p className="text-slate-700" style={{ fontSize: '14px', fontWeight: 500 }}>
            Light Background Version
          </p>
          <div className="bg-white p-8 rounded-xl border border-slate-200">
            {/* Mock Email Input */}
            <div className="relative">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full h-12 px-4 pr-14 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                style={{ fontSize: '14px' }}
              />
              
              {/* Hush Button */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <button
                  className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-105 transition-all duration-150 group"
                  onMouseEnter={() => setHoveredLight(true)}
                  onMouseLeave={() => setHoveredLight(false)}
                >
                  <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
                </button>

                {/* Tooltip */}
                {hoveredLight && (
                  <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-slate-900 text-white rounded-lg shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                    <p style={{ fontSize: '12px', fontWeight: 500 }}>
                      Protect email
                    </p>
                    <div className="absolute top-full right-3 -mt-1">
                      <div className="w-2 h-2 bg-slate-900 rotate-45" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Specs */}
            <div className="mt-6 pt-6 border-t border-slate-200 space-y-2">
              <p className="text-slate-500" style={{ fontSize: '12px' }}>
                <span className="font-medium">Size:</span> 32 × 32 px
              </p>
              <p className="text-slate-500" style={{ fontSize: '12px' }}>
                <span className="font-medium">Position:</span> Absolute, right: 8px
              </p>
              <p className="text-slate-500" style={{ fontSize: '12px' }}>
                <span className="font-medium">Gradient:</span> violet-600 → purple-600
              </p>
            </div>
          </div>
        </div>

        {/* Dark Background Example */}
        <div className="space-y-4">
          <p className="text-slate-700" style={{ fontSize: '14px', fontWeight: 500 }}>
            Dark Background Version
          </p>
          <div className="bg-slate-900 p-8 rounded-xl border border-slate-700">
            {/* Mock Email Input */}
            <div className="relative">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full h-12 px-4 pr-14 bg-slate-800 border-2 border-slate-700 text-white placeholder:text-slate-400 rounded-lg focus:outline-none focus:border-purple-400 transition-colors"
                style={{ fontSize: '14px' }}
              />
              
              {/* Hush Button */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <button
                  className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/40 hover:shadow-xl hover:shadow-purple-500/50 hover:scale-105 transition-all duration-150"
                  onMouseEnter={() => setHoveredDark(true)}
                  onMouseLeave={() => setHoveredDark(false)}
                >
                  <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
                </button>

                {/* Tooltip */}
                {hoveredDark && (
                  <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-white text-slate-900 rounded-lg shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                    <p style={{ fontSize: '12px', fontWeight: 500 }}>
                      Protect email
                    </p>
                    <div className="absolute top-full right-3 -mt-1">
                      <div className="w-2 h-2 bg-white rotate-45" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Specs */}
            <div className="mt-6 pt-6 border-t border-slate-700 space-y-2">
              <p className="text-slate-400" style={{ fontSize: '12px' }}>
                <span className="font-medium">Adjustment:</span> Slightly brighter gradient
              </p>
              <p className="text-slate-400" style={{ fontSize: '12px' }}>
                <span className="font-medium">Contrast:</span> Enhanced shadow for visibility
              </p>
              <p className="text-slate-400" style={{ fontSize: '12px' }}>
                <span className="font-medium">Tooltip:</span> Inverted colors (white bg)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Button States */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h4 className="text-slate-800 mb-4">Button States</h4>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="space-y-2">
            <button className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
            </button>
            <p className="text-slate-600" style={{ fontSize: '12px' }}>Default</p>
          </div>
          <div className="space-y-2">
            <button className="w-8 h-8 bg-gradient-to-br from-violet-700 to-purple-700 rounded-lg flex items-center justify-center shadow-xl shadow-purple-500/40 scale-105">
              <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
            </button>
            <p className="text-slate-600" style={{ fontSize: '12px' }}>Hover</p>
          </div>
          <div className="space-y-2">
            <button className="w-8 h-8 bg-gradient-to-br from-violet-800 to-purple-800 rounded-lg flex items-center justify-center shadow-md shadow-purple-500/20 scale-95">
              <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
            </button>
            <p className="text-slate-600" style={{ fontSize: '12px' }}>Active</p>
          </div>
          <div className="space-y-2">
            <button className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/30">
              <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
            </button>
            <p className="text-slate-600" style={{ fontSize: '12px' }}>Success</p>
          </div>
          <div className="space-y-2">
            <button className="w-8 h-8 bg-slate-300 rounded-lg flex items-center justify-center opacity-50 cursor-not-allowed">
              <Shield className="w-4 h-4 text-slate-500" strokeWidth={2.5} />
            </button>
            <p className="text-slate-600" style={{ fontSize: '12px' }}>Disabled</p>
          </div>
        </div>
      </div>
    </div>
  );
}
