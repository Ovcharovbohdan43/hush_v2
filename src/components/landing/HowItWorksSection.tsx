import { motion } from 'motion/react';
import { Shield, MousePointer, CheckCircle, Mail } from 'lucide-react';
import { useInView } from './hooks/useInView';

const steps = [
  {
    number: 1,
    icon: MousePointer,
    title: 'Click Email Field',
    description: 'Visit any website and click on an email input field',
    color: 'from-violet-500 to-purple-500',
  },
  {
    number: 2,
    icon: Shield,
    title: 'Click Hush Button',
    description: 'The Hush button appears automatically next to the field',
    color: 'from-purple-500 to-pink-500',
  },
  {
    number: 3,
    icon: Mail,
    title: 'Alias Generated',
    description: 'A unique protected email alias is instantly created and inserted',
    color: 'from-indigo-500 to-violet-500',
  },
  {
    number: 4,
    icon: CheckCircle,
    title: 'You\'re Protected',
    description: 'Your real email stays private, spam stays out of your inbox',
    color: 'from-green-500 to-emerald-500',
  },
];

export function HowItWorksSection() {
  const [ref, isInView] = useInView({ threshold: 0.1 });

  return (
    <section ref={ref} className="py-24 px-6 lg:px-8 bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-white" style={{ fontSize: '48px', fontWeight: 700 }}>
            How It Works
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto" style={{ fontSize: '18px' }}>
            Protecting your email is as simple as clicking a button. No registration, no hassle.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-purple-500/30 to-transparent -z-10" />
              )}

              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700 hover:shadow-xl hover:shadow-purple-500/20 hover:border-purple-500/50 transition-all h-full">
                {/* Step Number */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-8 h-8 bg-purple-900/50 text-purple-400 rounded-full flex items-center justify-center border border-purple-500/30" style={{ fontSize: '16px', fontWeight: 700 }}>
                    {step.number}
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`w-12 h-12 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center shadow-lg`}
                  >
                    <step.icon className="w-6 h-6 text-white" strokeWidth={2} />
                  </motion.div>
                </div>

                {/* Content */}
                <h3 className="text-white mb-2" style={{ fontSize: '18px', fontWeight: 600 }}>
                  {step.title}
                </h3>
                <p className="text-slate-300" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Timeline Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 bg-slate-800 rounded-full px-6 py-3 border border-slate-700 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
              <span className="text-slate-300" style={{ fontSize: '14px', fontWeight: 500 }}>
                Average time to protect:
              </span>
            </div>
            <span className="text-purple-400" style={{ fontSize: '20px', fontWeight: 700 }}>
              2 seconds
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}