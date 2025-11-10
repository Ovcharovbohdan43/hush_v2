import { HeroSection } from './HeroSection';
import { FeaturesSection } from './FeaturesSection';
import { HowItWorksSection } from './HowItWorksSection';
import { DemoSection } from './DemoSection';
import { SecuritySection } from './SecuritySection';
import { TestimonialsSection } from './TestimonialsSection';
import { FAQSection } from './FAQSection';
import { CTASection } from './CTASection';
import { Footer } from './Footer';
import { Navigation } from './Navigation';
import { ScrollToTop } from './ScrollToTop';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 dark">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <DemoSection />
      <SecuritySection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
      <ScrollToTop />
    </div>
  );
}