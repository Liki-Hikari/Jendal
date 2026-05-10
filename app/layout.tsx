import type { Metadata } from 'next';
import './styles/globals.css';
import { StickyHeader } from '@/components/layout/StickyHeader';

export const metadata: Metadata = {
  title: 'Jendal',
  description: 'Premium multi-vendor marketplace with verified sellers.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%2316a34a"/><text x="50" y="68" font-size="60" font-weight="bold" text-anchor="middle" fill="white" font-family="Arial">J</text></svg>',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StickyHeader />
        {children}
      </body>
    </html>
  );
}