import { motion } from 'motion/react';
import { Star, Quote } from 'lucide-react';
import { useInView } from './hooks/useInView';

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Privacy Advocate',
    avatar: '👩‍💼',
    rating: 5,
    text: 'Finally, a privacy tool that actually works! Hush is simple, elegant, and does exactly what it promises. My inbox has never been cleaner.',
  },
  {
    name: 'Michael Chen',
    role: 'Software Developer',
    avatar: '👨‍💻',
    rating: 5,
    text: 'As a developer, I appreciate how lightweight and fast this extension is. The UI is beautiful and the code is clean. Highly recommended!',
  },
  {
    name: 'Emma Williams',
    role: 'Digital Marketer',
    avatar: '👩‍🎨',
    rating: 5,
    text: 'I sign up for tons of services daily. Hush helps me keep track of where I share my email and block spam instantly. Game changer!',
  },
];

export function TestimonialsSection() {
  const [ref, isInView] = useInView({ threshold: 0.1 });

  return (
    <section ref={ref} className="py-24 px-6 lg:px-8 bg-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-white" style={{ fontSize: '48px', fontWeight: 700 }}>
            Loved by Privacy Enthusiasts
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto" style={{ fontSize: '18px' }}>
            Join thousands of users protecting their privacy with Hush
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="group"
            >
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 h-full hover:shadow-xl hover:shadow-purple-500/20 hover:border-purple-500/50 transition-all relative">
                {/* Quote Icon */}
                <Quote className="absolute top-6 right-6 w-12 h-12 text-slate-700 group-hover:text-slate-600 transition-colors" />

                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>

                {/* Testimonial Text */}
                <p className="text-slate-300 mb-6 relative z-10" style={{ fontSize: '15px', lineHeight: '1.7' }}>
                  "{testimonial.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-900/50 to-purple-900/50 rounded-full flex items-center justify-center text-2xl border border-purple-500/30">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-white" style={{ fontSize: '15px', fontWeight: 600 }}>
                      {testimonial.name}
                    </p>
                    <p className="text-slate-400" style={{ fontSize: '13px' }}>
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8"
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="text-white" style={{ fontSize: '18px', fontWeight: 600 }}>
              4.9/5 Average Rating
            </p>
            <p className="text-slate-400" style={{ fontSize: '14px' }}>
              From 1,200+ reviews
            </p>
          </div>
          <div className="w-px h-16 bg-slate-700 hidden sm:block" />
          <div className="text-center">
            <p className="text-white mb-2" style={{ fontSize: '32px', fontWeight: 700 }}>
              1.2k+
            </p>
            <p className="text-slate-300" style={{ fontSize: '14px' }}>
              Active Users
            </p>
          </div>
          <div className="w-px h-16 bg-slate-700 hidden sm:block" />
          <div className="text-center">
            <p className="text-white mb-2" style={{ fontSize: '32px', fontWeight: 700 }}>
              98%
            </p>
            <p className="text-slate-300" style={{ fontSize: '14px' }}>
              Would Recommend
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}