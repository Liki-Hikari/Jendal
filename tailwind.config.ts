import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      boxShadow: {
        xs: '0 1px 2px rgba(15, 23, 42, 0.05)',
        sm: '0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)',
        md: '0 4px 6px rgba(15, 23, 42, 0.07), 0 2px 4px rgba(15, 23, 42, 0.05)',
        lg: '0 10px 15px rgba(15, 23, 42, 0.1), 0 4px 6px rgba(15, 23, 42, 0.05)',
        xl: '0 20px 25px rgba(15, 23, 42, 0.12), 0 8px 10px rgba(15, 23, 42, 0.06)',
        '2xl': '0 25px 50px rgba(15, 23, 42, 0.15)',
        premium: '0 12px 40px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
        glow: '0 0 20px rgba(59, 130, 246, 0.3)',
      },
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c3d66',
        },
        emerald: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#145231',
        },
      },
      backgroundImage: {
        'hero-gradient': `
          radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 40%),
          radial-gradient(circle at 100% 100%, rgba(34, 197, 94, 0.1) 0%, transparent 40%),
          linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)
        `,
        'auth-gradient': `
          linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)
        `,
        'button-gradient': 'linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
        sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],
        base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
        lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],
        '5xl': ['3rem', { lineHeight: '3.5rem', letterSpacing: '-0.02em' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
