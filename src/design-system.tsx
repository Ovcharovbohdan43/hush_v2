import { BrandKit } from './components/BrandKit';
import { PopupDesign } from './components/PopupDesign';
import { OptionsDesign } from './components/OptionsDesign';
import { InlineButtonShowcase } from './components/InlineButtonShowcase';
import { RiskTooltipShowcase } from './components/RiskTooltipShowcase';
import { IconSizes } from './components/IconSizes';
import { Separator } from './components/ui/separator';
import { Button } from './components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function DesignSystem() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Landing
          </Button>
          <div className="text-center space-y-4">
            <h1 className="text-slate-900">Hush Browser Extension</h1>
            <p className="text-slate-600">Complete UI/UX Design Mockup — v0.0.1</p>
            <p className="text-slate-500">A privacy-focused email protection extension</p>
          </div>
        </div>

        <Separator />

        {/* Brand Kit */}
        <BrandKit />

        <Separator />

        {/* Icon Sizes */}
        <IconSizes />

        <Separator />

        {/* Main Screens */}
        <div className="space-y-8">
          <h2 className="text-slate-900">Extension Screens</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Popup */}
            <div className="space-y-4">
              <div>
                <h3 className="text-slate-800">Popup Window</h3>
                <p className="text-slate-600">320 × 420 px</p>
              </div>
              <PopupDesign />
            </div>

            {/* Options */}
            <div className="space-y-4">
              <div>
                <h3 className="text-slate-800">Options Page</h3>
                <p className="text-slate-600">600 × 600 px</p>
              </div>
              <OptionsDesign />
            </div>
          </div>
        </div>

        <Separator />

        {/* Components */}
        <div className="space-y-8">
          <h2 className="text-slate-900">UI Components</h2>
          
          {/* Inline Button */}
          <InlineButtonShowcase />

          <Separator className="my-8" />

          {/* Risk Tooltips */}
          <RiskTooltipShowcase />
        </div>

        {/* Developer Notes */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 space-y-4">
          <h3 className="text-slate-900">Developer Implementation Notes</h3>
          <div className="space-y-3 text-slate-700">
            <div>
              <p className="font-medium">Button States:</p>
              <ul className="list-disc list-inside text-slate-600 space-y-1 mt-2">
                <li>Default: Purple background (#7C3AED) with white text</li>
                <li>Hover: Darker purple (#6D28D9) with subtle lift (shadow)</li>
                <li>Active/Pressed: Even darker (#5B21B6) with reduced shadow</li>
                <li>Disabled: Gray (#94A3B8) with 50% opacity</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">Risk Indicators:</p>
              <ul className="list-disc list-inside text-slate-600 space-y-1 mt-2">
                <li>Low Risk: Green (#10B981) - "Site verified, HTTPS enabled"</li>
                <li>Medium Risk: Orange (#F59E0B) - "Unknown domain" or "Mixed security"</li>
                <li>High Risk: Red (#EF4444) - "No HTTPS" or "Suspicious activity"</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">Animation Guidelines:</p>
              <ul className="list-disc list-inside text-slate-600 space-y-1 mt-2">
                <li>Use subtle fade-in for tooltips (200ms)</li>
                <li>Button hover transitions: 150ms ease-in-out</li>
                <li>Success states: gentle scale animation (1.0 → 1.02)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
