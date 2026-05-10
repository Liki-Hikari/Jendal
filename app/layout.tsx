import type { Metadata } from 'next';
import './styles/globals.css';

export const metadata: Metadata = {
  title: 'JENDAL Marketplace',
  description: 'Premium multi-vendor marketplace with verified sellers.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%2316a34a"/><text x="50" y="68" font-size="60" font-weight="bold" text-anchor="middle" fill="white" font-family="Arial">J</text></svg>',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* JENDAL Logo Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <a href="/" className="flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">J</span>
                </div>
                <span className="text-xl font-bold text-slate-900">JENDAL</span>
              </a>

              <nav className="flex items-center gap-4">
                <a href="/" className="text-sm font-medium text-slate-600 hover:text-emerald-700 transition-colors">
                  Home
                </a>
              </nav>
            </div>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}