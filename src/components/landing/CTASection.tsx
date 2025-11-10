import { Chrome, ArrowRight, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { useInView } from './hooks/useInView';

export function CTASection() {
  const [ref, isInView] = useInView({ threshold: 0.1 });

  return (
    <section ref={ref} className="py-24 px-6 lg:px-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600" />
      
      {/* Animated Background Pattern */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, -90, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
      />

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center space-y-8"
        >
          {/* Headline */}
          <div className="space-y-4">
            <h2 className="text-white" style={{ fontSize: '56px', fontWeight: 700, lineHeight: '1.1' }}>
              Ready to Take Control?
            </h2>
            <p className="text-purple-100 max-w-2xl mx-auto" style={{ fontSize: '20px', lineHeight: '1.6' }}>
              Join thousands protecting their privacy with Hush. Install in seconds, protect forever.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="h-16 px-10 bg-white text-purple-600 hover:bg-purple-50 rounded-xl shadow-2xl hover:shadow-white/20 transition-all group">
              <Chrome className="w-6 h-6 mr-3" />
              <span style={{ fontSize: '18px', fontWeight: 600 }}>Add to Chrome — It's Free</span>
              <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-8 pt-8"
          >
            <div className="text-center">
              <p className="text-white" style={{ fontSize: '36px', fontWeight: 700 }}>
                <span className="inline-flex items-center gap-2">
                  <Download className="w-8 h-8" />
                  1.2k+
                </span>
              </p>
              <p className="text-purple-200" style={{ fontSize: '14px' }}>
                Active Users
              </p>
            </div>
            <div className="text-center">
              <p className="text-white" style={{ fontSize: '36px', fontWeight: 700 }}>
                ⭐ 4.9
              </p>
              <p className="text-purple-200" style={{ fontSize: '14px' }}>
                Chrome Store Rating
              </p>
            </div>
            <div className="text-center">
              <p className="text-white" style={{ fontSize: '36px', fontWeight: 700 }}>
                47k+
              </p>
              <p className="text-purple-200" style={{ fontSize: '14px' }}>
                Emails Protected
              </p>
            </div>
          </motion.div>

          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex items-center justify-center gap-2 text-purple-200"
          >
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span style={{ fontSize: '14px' }}>
              Free Forever • No Credit Card • No Registration Required
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}