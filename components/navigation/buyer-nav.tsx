'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid3X3, ShoppingCart, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const buyerNavItems = [
  { href: '/buyer', label: 'Home', icon: Home },
  { href: '/buyer/messages', label: 'Messages', icon: MessageCircle },
];

export function BuyerNavigation() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-6">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-slate-900">Jendal Marketplace</h1>
        <p className="text-sm text-slate-500 mt-1">Buyer Dashboard</p>
      </div>
      <ul className="space-y-2">
        {buyerNavItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                pathname === item.href
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function BuyerMobileNavigation() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2">
      <ul className="flex justify-around">
        {buyerNavItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium transition-colors',
                pathname === item.href
                  ? 'text-emerald-700'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}