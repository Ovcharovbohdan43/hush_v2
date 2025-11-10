import { Shield, Zap, Lock, Eye, Copy, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { useInView } from './hooks/useInView';

const features = [
  {
    icon: Shield,
    title: 'One-Click Protection',
    description: 'Generate secure email aliases instantly. No complex setup, just click and protect.',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Seamlessly integrates with any website. Auto-detects email fields and protects in milliseconds.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Lock,
    title: 'Privacy First',
    description: 'Your real email stays hidden. Zero data collection, zero tracking, zero compromises.',
    gradient: 'from-indigo-500 to-violet-500',
  },
  {
    icon: Eye,
    title: 'Risk Detection',
    description: 'Smart security analysis shows you the safety level of every website before you share data.',
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    icon: Copy,
    title: 'Alias Management',
    description: 'Keep track of all your protected emails. Copy, manage, and organize with ease.',
    gradient: 'from-violet-500 to-indigo-500',
  },
  {
    icon: AlertTriangle,
    title: 'Spam Shield',
    description: 'Block spam at the source. Delete compromised aliases and keep your inbox clean.',
    gradient: 'from-purple-500 to-violet-500',
  },
];

export function FeaturesSection() {
  const [ref, isInView] = useInView({ threshold: 0.1 });

  return (
    <section id="features" ref={ref} className="py-24 px-6 lg:px-8 bg-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-white" style={{ fontSize: '48px', fontWeight: 700 }}>
            Everything You Need
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto" style={{ fontSize: '18px' }}>
            Powerful privacy protection packed into a simple, beautiful browser extension.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 h-full hover:shadow-xl hover:shadow-purple-500/20 hover:border-purple-500/50 transition-all duration-300">
                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6 shadow-lg`}
                >
                  <feature.icon className="w-7 h-7 text-white" strokeWidth={2} />
                </motion.div>

                {/* Content */}
                <h3 className="text-white mb-3" style={{ fontSize: '20px', fontWeight: 600 }}>
                  {feature.title}
                </h3>
                <p className="text-slate-300" style={{ fontSize: '15px', lineHeight: '1.6' }}>
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <p className="text-slate-300 mb-4" style={{ fontSize: '16px' }}>
            And much more coming soon...
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-slate-400" style={{ fontSize: '14px' }}>
              Actively developed • Open to feedback
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}