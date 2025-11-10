import { Shield, ArrowRight, Chrome } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 px-6 lg:px-8 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 -z-10" />
      
      {/* Animated Background Elements */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 1 }}
        className="absolute top-20 right-10 w-96 h-96 bg-purple-600 rounded-full blur-3xl -z-10"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="absolute bottom-20 left-10 w-96 h-96 bg-violet-600 rounded-full blur-3xl -z-10"
      />

      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-purple-950/50 border border-purple-500/20 text-purple-300 px-4 py-2 rounded-full"
            >
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span style={{ fontSize: '14px', fontWeight: 500 }}>Now Available — v0.0.1</span>
            </motion.div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-white" style={{ fontSize: '56px', lineHeight: '1.1', fontWeight: 700 }}>
                Your Email,
                <br />
                <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                  Protected
                </span>
              </h1>
              <p className="text-slate-300 max-w-xl" style={{ fontSize: '20px', lineHeight: '1.6' }}>
                Shield your real email from spam, tracking, and data breaches. Generate secure aliases with one click.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="h-14 px-8 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40 transition-all group">
                <Chrome className="w-5 h-5 mr-2" />
                <span style={{ fontSize: '16px', fontWeight: 500 }}>Add to Chrome</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                className="h-14 px-8 border-2 border-slate-700 hover:border-purple-500 bg-slate-900/50 text-slate-200 hover:text-purple-300 rounded-xl"
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <span style={{ fontSize: '16px', fontWeight: 500 }}>View Demo</span>
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-4">
              <div>
                <p className="text-white" style={{ fontSize: '32px', fontWeight: 700 }}>100%</p>
                <p className="text-slate-400" style={{ fontSize: '14px' }}>Free Forever</p>
              </div>
              <div>
                <p className="text-white" style={{ fontSize: '32px', fontWeight: 700 }}>0</p>
                <p className="text-slate-400" style={{ fontSize: '14px' }}>Data Collected</p>
              </div>
              <div>
                <p className="text-white" style={{ fontSize: '32px', fontWeight: 700 }}>∞</p>
                <p className="text-slate-400" style={{ fontSize: '14px' }}>Aliases</p>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative flex items-center justify-center"
          >
            <motion.div
              animate={{
                y: [0, -20, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative"
            >
              {/* Hush Logo - Dark Theme */}
              <div className="flex items-center gap-4 bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-purple-500/30 px-12 py-8 rounded-3xl shadow-2xl">
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Shield className="w-24 h-24 text-purple-400" strokeWidth={2} />
                </motion.div>
                <span className="text-white tracking-tight" style={{ fontSize: '72px', fontWeight: 700 }}>
                  Hush
                </span>
              </div>

              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 rounded-3xl blur-2xl opacity-30 -z-10" />
            </motion.div>

            {/* Floating Elements */}
            <motion.div
              animate={{
                y: [0, -15, 0],
                rotate: [0, 5, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
              className="absolute -top-4 -right-4 bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-xl"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-slate-200" style={{ fontSize: '14px', fontWeight: 500 }}>
                  Protected
                </span>
              </div>
            </motion.div>

            <motion.div
              animate={{
                y: [0, 10, 0],
                rotate: [0, -5, 0]
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -bottom-4 -left-4 bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-xl"
            >
              <code className="text-purple-400" style={{ fontSize: '12px', fontWeight: 500 }}>
                secure@hush.email
              </code>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}