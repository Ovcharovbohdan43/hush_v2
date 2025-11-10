import { CheckCircle2, AlertTriangle, AlertOctagon, Shield, Lock, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { useInView } from './hooks/useInView';

export function SecuritySection() {
  const [ref, isInView] = useInView({ threshold: 0.1 });

  const securityFeatures = [
    {
      icon: Lock,
      title: 'Zero Knowledge',
      description: 'We never see, store, or have access to your real email address.',
    },
    {
      icon: Eye,
      title: 'No Tracking',
      description: 'No analytics, no telemetry, no data collection. Your privacy is absolute.',
    },
    {
      icon: Shield,
      title: 'Open Source',
      description: 'Fully transparent code. Audit it yourself, trust through verification.',
    },
  ];

  return (
    <section id="security" ref={ref} className="py-24 px-6 lg:px-8 bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Risk Indicators */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-white" style={{ fontSize: '48px', fontWeight: 700 }}>
                Smart Risk Detection
              </h2>
              <p className="text-slate-300" style={{ fontSize: '18px', lineHeight: '1.6' }}>
                Hush analyzes every website in real-time and warns you about potential security risks before you share any data.
              </p>
            </div>

            {/* Risk Examples */}
            <div className="space-y-4">
              {/* Low Risk */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-slate-900 border-2 border-green-500/30 rounded-xl p-6 hover:shadow-lg hover:shadow-green-500/20 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-900/50 rounded-lg flex items-center justify-center flex-shrink-0 border border-green-500/30">
                    <CheckCircle2 className="w-6 h-6 text-green-400" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-400" style={{ fontSize: '16px', fontWeight: 600 }}>
                        Low Risk
                      </span>
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                    <p className="text-slate-300" style={{ fontSize: '14px' }}>
                      Site verified, HTTPS enabled, trusted domain
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Medium Risk */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-slate-900 border-2 border-orange-500/30 rounded-xl p-6 hover:shadow-lg hover:shadow-orange-500/20 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-900/50 rounded-lg flex items-center justify-center flex-shrink-0 border border-orange-500/30">
                    <AlertTriangle className="w-6 h-6 text-orange-400" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-orange-400" style={{ fontSize: '16px', fontWeight: 600 }}>
                        Medium Risk
                      </span>
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    </div>
                    <p className="text-slate-300" style={{ fontSize: '14px' }}>
                      Unknown domain or mixed security features
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* High Risk */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-slate-900 border-2 border-red-500/30 rounded-xl p-6 hover:shadow-lg hover:shadow-red-500/20 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-900/50 rounded-lg flex items-center justify-center flex-shrink-0 border border-red-500/30">
                    <AlertOctagon className="w-6 h-6 text-red-400" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-red-400" style={{ fontSize: '16px', fontWeight: 600 }}>
                        High Risk
                      </span>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    </div>
                    <p className="text-slate-300" style={{ fontSize: '14px' }}>
                      No HTTPS, suspicious activity, or known bad actor
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Column - Security Features */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-white" style={{ fontSize: '48px', fontWeight: 700 }}>
                Privacy You Can Trust
              </h2>
              <p className="text-slate-300" style={{ fontSize: '18px', lineHeight: '1.6' }}>
                Built with privacy as the foundation, not an afterthought.
              </p>
            </div>

            {/* Security Features List */}
            <div className="space-y-6">
              {securityFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30">
                    <feature.icon className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-white mb-2" style={{ fontSize: '18px', fontWeight: 600 }}>
                      {feature.title}
                    </h3>
                    <p className="text-slate-300" style={{ fontSize: '15px', lineHeight: '1.6' }}>
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Trust Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-gradient-to-br from-purple-950/50 to-indigo-950/50 border-2 border-purple-500/30 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-8 h-8 text-purple-400" strokeWidth={2} />
                <h4 className="text-purple-300" style={{ fontSize: '18px', fontWeight: 600 }}>
                  100% Privacy Guaranteed
                </h4>
              </div>
              <p className="text-purple-300/80" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                Your trust is our highest priority. We're committed to keeping your data private, secure, and under your control.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}