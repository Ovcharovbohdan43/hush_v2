import { motion } from 'motion/react';
import { useInView } from './hooks/useInView';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';

const faqs = [
  {
    question: 'How does Hush protect my email?',
    answer: 'Hush generates unique email aliases that forward to your real email address. When you use an alias, websites never see your actual email, protecting you from spam, tracking, and data breaches.',
  },
  {
    question: 'Is Hush really free?',
    answer: 'Yes! Hush is 100% free forever. We believe privacy is a fundamental right, not a premium feature. There are no hidden costs, no premium tiers, and no credit card required.',
  },
  {
    question: 'Do I need to create an account?',
    answer: 'No account needed for v0.0.1! Simply install the extension and start protecting your email immediately. Your aliases are managed locally in your browser.',
  },
  {
    question: 'What happens if an alias gets spam?',
    answer: 'You can easily delete any alias that receives spam. Once deleted, emails sent to that alias will no longer reach you, effectively blocking the spam at the source.',
  },
  {
    question: 'Does Hush collect my data?',
    answer: 'Absolutely not. Hush follows a zero-knowledge architecture. We never see, store, or have access to your real email address or any of your aliases. Your privacy is absolute.',
  },
  {
    question: 'Which browsers are supported?',
    answer: 'Currently, Hush supports Chrome and Chromium-based browsers (Edge, Brave, Opera). Support for Firefox and Safari is coming soon!',
  },
  {
    question: 'How do I manage my aliases?',
    answer: 'Click the Hush icon in your browser toolbar to see all your aliases. You can copy, manage, and delete them from the extension popup.',
  },
  {
    question: 'Can I use Hush for business?',
    answer: 'While Hush is great for personal use, we recommend using a dedicated business email solution for professional communications. A business version with team features is in our roadmap!',
  },
];

export function FAQSection() {
  const [ref, isInView] = useInView({ threshold: 0.1 });

  return (
    <section ref={ref} className="py-24 px-6 lg:px-8 bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-white" style={{ fontSize: '48px', fontWeight: 700 }}>
            Frequently Asked Questions
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto" style={{ fontSize: '18px' }}>
            Everything you need to know about Hush
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
              >
                <AccordionItem 
                  value={`item-${index}`}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-6 hover:border-purple-500/50 transition-colors"
                >
                  <AccordionTrigger className="text-white hover:text-purple-400" style={{ fontSize: '16px', fontWeight: 600 }}>
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-300" style={{ fontSize: '15px', lineHeight: '1.7' }}>
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center bg-slate-800 border border-purple-500/30 rounded-2xl p-8"
        >
          <h3 className="text-white mb-3" style={{ fontSize: '24px', fontWeight: 600 }}>
            Still have questions?
          </h3>
          <p className="text-slate-300 mb-6" style={{ fontSize: '16px' }}>
            We're here to help! Reach out to our support team anytime.
          </p>
          <a
            href="mailto:support@hush.email"
            className="inline-block px-8 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-purple-500/30 transition-all"
            style={{ fontSize: '15px', fontWeight: 500 }}
          >
            Contact Support
          </a>
        </motion.div>
      </div>
    </section>
  );
}