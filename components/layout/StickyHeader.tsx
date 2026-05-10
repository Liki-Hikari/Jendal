'use client';

import { useEffect, useState } from 'react';

export function StickyHeader() {
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 50) {
        setVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-20">
          <a href="/" className="flex items-center gap-3 group">
            {/* Glowing J box */}
            <div className="h-10 w-10 bg-emerald-500 rounded-lg flex items-center justify-center animate-glow">
              <span className="text-white font-bold text-xl">J</span>
            </div>
            <span className="text-xl font-bold text-slate-900">Jendal</span>
          </a>
        </div>
      </div>
    </header>
  );
}