import { Shield, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';

export function RiskTooltipShowcase() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-slate-800">Risk Level Indicators</h3>
        <p className="text-slate-600">
          Visual feedback for website security assessment
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Low Risk */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl border-2 border-green-200 shadow-lg shadow-green-500/10">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-green-600" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-green-700" style={{ fontSize: '14px', fontWeight: 600 }}>
                    Low Risk
                  </span>
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                </div>
                <p className="text-slate-600" style={{ fontSize: '12px' }}>
                  Site verified, HTTPS enabled
                </p>
              </div>
            </div>
          </div>

          {/* Compact Version */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-700" style={{ fontSize: '11px', fontWeight: 600 }}>
              COMPACT VERSION
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span className="text-green-700" style={{ fontSize: '12px', fontWeight: 500 }}>
                Low Risk
              </span>
            </div>
          </div>

          {/* Specs */}
          <div className="space-y-1">
            <p className="text-slate-500" style={{ fontSize: '11px' }}>
              <span className="font-medium">Color:</span> Green (#10B981)
            </p>
            <p className="text-slate-500" style={{ fontSize: '11px' }}>
              <span className="font-medium">Icon:</span> CheckCircle2
            </p>
            <p className="text-slate-500" style={{ fontSize: '11px' }}>
              <span className="font-medium">Trigger:</span> HTTPS + Verified domain
            </p>
          </div>
        </div>

        {/* Medium Risk */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl border-2 border-orange-200 shadow-lg shadow-orange-500/10">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-orange-600" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-orange-700" style={{ fontSize: '14px', fontWeight: 600 }}>
                    Medium Risk
                  </span>
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                </div>
                <p className="text-slate-600" style={{ fontSize: '12px' }}>
                  Unknown domain or mixed security
                </p>
              </div>
            </div>
          </div>

          {/* Compact Version */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-orange-700" style={{ fontSize: '11px', fontWeight: 600 }}>
              COMPACT VERSION
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
              <span className="text-orange-700" style={{ fontSize: '12px', fontWeight: 500 }}>
                Medium Risk
              </span>
            </div>
          </div>

          {/* Specs */}
          <div className="space-y-1">
            <p className="text-slate-500" style={{ fontSize: '11px' }}>
              <span className="font-medium">Color:</span> Orange (#F59E0B)
            </p>
            <p className="text-slate-500" style={{ fontSize: '11px' }}>
              <span className="font-medium">Icon:</span> AlertTriangle
            </p>
            <p className="text-slate-500" style={{ fontSize: '11px' }}>
              <span className="font-medium">Trigger:</span> New domain or mixed content
            </p>
          </div>
        </div>

        {/* High Risk */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl border-2 border-red-200 shadow-lg shadow-red-500/10">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertOctagon className="w-6 h-6 text-red-600" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-red-700" style={{ fontSize: '14px', fontWeight: 600 }}>
                    High Risk
                  </span>
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                </div>
                <p className="text-slate-600" style={{ fontSize: '12px' }}>
                  No HTTPS or suspicious activity
                </p>
              </div>
            </div>
          </div>

          {/* Compact Version */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700" style={{ fontSize: '11px', fontWeight: 600 }}>
              COMPACT VERSION
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-700" style={{ fontSize: '12px', fontWeight: 500 }}>
                High Risk
              </span>
            </div>
          </div>

          {/* Specs */}
          <div className="space-y-1">
            <p className="text-slate-500" style={{ fontSize: '11px' }}>
              <span className="font-medium">Color:</span> Red (#EF4444)
            </p>
            <p className="text-slate-500" style={{ fontSize: '11px' }}>
              <span className="font-medium">Icon:</span> AlertOctagon
            </p>
            <p className="text-slate-500" style={{ fontSize: '11px' }}>
              <span className="font-medium">Trigger:</span> No SSL or blacklisted
            </p>
          </div>
        </div>
      </div>

      {/* Tooltip Position Examples */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h4 className="text-slate-800 mb-4">Tooltip Positioning</h4>
        <p className="text-slate-600 mb-6" style={{ fontSize: '14px' }}>
          Risk tooltips appear near the Hush button when email field is detected
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Above Button */}
          <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
            <p className="text-slate-700 mb-4" style={{ fontSize: '13px', fontWeight: 500 }}>
              Position: Above Button
            </p>
            <div className="relative inline-block">
              {/* Risk Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-white border-2 border-orange-200 rounded-lg p-3 shadow-lg w-48">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-orange-600" strokeWidth={2} />
                  <span className="text-orange-700" style={{ fontSize: '12px', fontWeight: 600 }}>
                    Medium Risk
                  </span>
                </div>
                <p className="text-slate-600" style={{ fontSize: '11px' }}>
                  New domain detected
                </p>
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                  <div className="w-2 h-2 bg-white border-r-2 border-b-2 border-orange-200 rotate-45" />
                </div>
              </div>

              {/* Button */}
              <button className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Side of Button */}
          <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
            <p className="text-slate-700 mb-4" style={{ fontSize: '13px', fontWeight: 500 }}>
              Position: Left of Button
            </p>
            <div className="relative inline-block">
              {/* Risk Tooltip */}
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 bg-white border-2 border-green-200 rounded-lg p-3 shadow-lg w-44">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-green-600" strokeWidth={2} />
                  <span className="text-green-700" style={{ fontSize: '12px', fontWeight: 600 }}>
                    Low Risk
                  </span>
                </div>
                <p className="text-slate-600" style={{ fontSize: '11px' }}>
                  Site verified
                </p>
                {/* Arrow */}
                <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-1">
                  <div className="w-2 h-2 bg-white border-r-2 border-t-2 border-green-200 rotate-45" />
                </div>
              </div>

              {/* Button */}
              <button className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
