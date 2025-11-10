import { Shield, Github, Twitter, Mail } from 'lucide-react';

export function Footer() {
  const footerLinks = {
    Product: [
      { name: 'Features', href: '#features' },
      { name: 'Demo', href: '#demo' },
      { name: 'Security', href: '#security' },
      { name: 'Roadmap', href: '#' },
    ],
    Support: [
      { name: 'Documentation', href: '#' },
      { name: 'FAQ', href: '#' },
      { name: 'Contact', href: '#' },
      { name: 'Report Bug', href: '#' },
    ],
    Legal: [
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Open Source', href: '#' },
    ],
  };

  return (
    <footer className="bg-slate-950 text-white pt-16 pb-8 px-6 lg:px-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-white tracking-tight" style={{ fontSize: '28px', fontWeight: 700 }}>
                Hush
              </span>
            </div>
            <p className="text-slate-400 max-w-sm" style={{ fontSize: '15px', lineHeight: '1.6' }}>
              Privacy-first email protection for everyone. Keep your real email safe from spam, tracking, and data breaches.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-4 pt-4">
              <a
                href="#"
                className="w-10 h-10 bg-slate-800 hover:bg-purple-600 rounded-lg flex items-center justify-center transition-colors border border-slate-700 hover:border-purple-500"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-slate-800 hover:bg-purple-600 rounded-lg flex items-center justify-center transition-colors border border-slate-700 hover:border-purple-500"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-slate-800 hover:bg-purple-600 rounded-lg flex items-center justify-center transition-colors border border-slate-700 hover:border-purple-500"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-white mb-4" style={{ fontSize: '16px', fontWeight: 600 }}>
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-slate-400 hover:text-purple-400 transition-colors"
                      style={{ fontSize: '14px' }}
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500" style={{ fontSize: '14px' }}>
              © 2025 Hush. All rights reserved. Built with privacy in mind.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-slate-500" style={{ fontSize: '13px' }}>
                v0.0.1 • Status: Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}