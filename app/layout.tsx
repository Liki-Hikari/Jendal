import type { Metadata } from 'next';
import './styles/globals.css';

export const metadata: Metadata = {
  title: 'JENDAL Marketplace',
  description: 'Premium multi-vendor marketplace with verified sellers.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}