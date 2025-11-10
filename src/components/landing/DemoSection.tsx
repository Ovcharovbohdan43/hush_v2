import { motion } from 'motion/react';
import { PopupDesign } from '../PopupDesign';
import { OptionsDesign } from '../OptionsDesign';
import { Shield } from 'lucide-react';
import { useInView } from './hooks/useInView';
import { useState } from 'react';

export function DemoSection() {
  const [ref, isInView] = useInView({ threshold: 0.1 });
  const [activeDemo, setActiveDemo] = useState<'popup' | 'options'>('popup');

  return (
    <section id="demo" ref={ref} className="py-24 px-6 lg:px-8 bg-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-white" style={{ fontSize: '48px', fontWeight: 700 }}>
            See It In Action
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto" style={{ fontSize: '18px' }}>
            Experience the clean, intuitive interface designed for maximum privacy and minimal friction.
          </p>
        </motion.div>

        {/* Demo Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center gap-4 mb-12"
        >
          <button
            onClick={() => setActiveDemo('popup')}
            className={`px-6 py-3 rounded-xl transition-all ${
              activeDemo === 'popup'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                : 'bg-slate-800 text-slate-300 hover:text-purple-400 border border-slate-700'
            }`}
            style={{ fontSize: '15px', fontWeight: 500 }}
          >
            Extension Popup
          </button>
          <button
            onClick={() => setActiveDemo('options')}
            className={`px-6 py-3 rounded-xl transition-all ${
              activeDemo === 'options'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                : 'bg-slate-800 text-slate-300 hover:text-purple-400 border border-slate-700'
            }`}
            style={{ fontSize: '15px', fontWeight: 500 }}
          >
            Settings Page
          </button>
        </motion.div>

        {/* Demo Display */}
        <div className="flex justify-center">
          <motion.div
            key={activeDemo}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            {activeDemo === 'popup' ? <PopupDesign /> : <OptionsDesign />}
          </motion.div>
        </div>

        {/* Inline Button Demo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20"
        >
          <h3 className="text-center text-white mb-8" style={{ fontSize: '32px', fontWeight: 600 }}>
            Works on Any Website
          </h3>
          
          <div className="max-w-2xl mx-auto bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-xl">
            <div className="space-y-4">
              <label className="block text-slate-300" style={{ fontSize: '14px', fontWeight: 500 }}>
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full h-14 px-4 pr-16 bg-slate-900 border-2 border-slate-600 text-white rounded-xl focus:outline-none focus:border-purple-500 transition-colors placeholder:text-slate-500"
                  style={{ fontSize: '16px' }}
                />
                
                {/* Hush Button */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring" }}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all group relative"
                  >
                    <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-slate-900 text-white rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-slate-700">
                      <p style={{ fontSize: '12px', fontWeight: 500 }}>
                        Protect email
                      </p>
                      <div className="absolute top-full right-3 -mt-1">
                        <div className="w-2 h-2 bg-slate-900 rotate-45" />
                      </div>
                    </div>
                  </motion.button>
                </motion.div>
              </div>
              <p className="text-slate-400 text-center" style={{ fontSize: '13px' }}>
                Click the Hush button to insert a protected email alias
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}