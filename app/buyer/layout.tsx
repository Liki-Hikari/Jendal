'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import {
  LayoutDashboard,
  ShoppingBag,
  MessageCircle,
  Package,
  LogOut,
  Store,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { href: '/buyer', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/buyer/products', label: 'Store', icon: ShoppingBag },
  { href: '/buyer/orders', label: 'My Orders', icon: Package },
  { href: '/buyer/messages', label: 'Messages', icon: MessageCircle },
];

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      const { data } = await (supabase.from('profiles') as any).select('*').eq('id', user.id).single();
      if (!data || data.role !== 'buyer') { router.push('/'); return; }
      setProfile(data);
    }
    loadProfile();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#f7faf8] flex">
      {/* Mobile toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg border border-slate-200 shadow-sm"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200 flex flex-col
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-100">
          <Link href="/buyer" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
            <div className="h-10 w-10 bg-emerald-700 rounded-lg flex items-center justify-center">
              <Store className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900">JENDAL</p>
              <p className="text-xs text-slate-500">Buyer Portal</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-emerald-700">
                {profile?.full_name?.charAt(0) || 'B'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{profile?.full_name || 'Buyer'}</p>
              <p className="text-xs text-slate-500">Buyer Account</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/20" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Page content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}