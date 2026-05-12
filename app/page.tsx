'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthPanel from '@/components/auth/AuthPanel';
import { motion } from 'framer-motion';
import {
  BadgeCheck,
  PackageCheck,
  ShoppingBag,
  Store,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { isAdminEmail } from '@/lib/admin';

const highlights = [
  {
    title: 'For Gambian retailers',
    description: 'Open a storefront for clothes, accessories, electronics, beauty products, and everyday goods.',
    icon: PackageCheck,
  },
  {
    title: 'For local buyers',
    description: 'Find trusted sellers across The Gambia and keep purchases in one clean marketplace account.',
    icon: BadgeCheck,
  },
];

type MetricState = {
  sellers: number | null;
  buyers: number | null;
  orders: number | null;
};

type MarketplaceStats = {
  sellers_count: number;
  buyers_count: number;
  orders_count: number;
};

function formatCount(value: number | null) {
  if (value === null) {
    return '--';
  }

  return new Intl.NumberFormat('en-US').format(value);
}

export default function HomePage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<MetricState>({ sellers: null, buyers: null, orders: null });

  useEffect(() => {
    let ignore = false;
    
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && !ignore) {
        const { data: profile } = await supabase.from('profiles')
          .select('role, approved')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          if (profile.role === 'admin' || isAdminEmail(user.email)) {
            router.replace('/admin');
          } else if (profile.role === 'buyer') {
            router.replace('/buyer');
          } else if (profile.role === 'seller' && profile.approved) {
            router.replace('/seller');
          } else {
            router.replace('/pending-approval');
          }
        }
      }
    }
    
    checkAuth();
    
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadMetrics() {
      const { data: statsResponse, error: statsError } = await (supabase.rpc as any)('get_marketplace_stats');
      const stats = Array.isArray(statsResponse) ? statsResponse[0] : statsResponse;

      if (!statsError && stats) {
        if (!active) {
          return;
        }

        const marketplaceStats = stats as MarketplaceStats;
        setMetrics({
          sellers: marketplaceStats.sellers_count ?? 0,
          buyers: marketplaceStats.buyers_count ?? 0,
          orders: marketplaceStats.orders_count ?? 0,
        });
        return;
      }

     const [sellerResult, buyerResult, orderResult] = await Promise.all([
  (supabase.from('profiles') as any).select('id', { count: 'exact', head: true }).eq('role', 'seller'),
  (supabase.from('profiles') as any).select('id', { count: 'exact', head: true }).eq('role', 'buyer'),
  (supabase.from('orders') as any).select('id', { count: 'exact', head: true }),
]);

      if (!active) {
        return;
      }

      setMetrics({
        sellers: sellerResult.count ?? 0,
        buyers: buyerResult.count ?? 0,
        orders: orderResult.count ?? 0,
      });
    }

    loadMetrics();

    return () => {
      active = false;
    };
  }, []);

  const metricCards = [
    { label: 'Sellers onboarded', value: formatCount(metrics.sellers), icon: Store, accent: 'bg-emerald-50 text-emerald-700' },
    { label: 'Buyer accounts', value: formatCount(metrics.buyers), icon: TrendingUp, accent: 'bg-sky-50 text-sky-700' },
    { label: 'Orders tracked', value: formatCount(metrics.orders), icon: ShoppingBag, accent: 'bg-amber-50 text-amber-700' },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7faf8] pt-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(22,163,74,0.10),transparent_32%),radial-gradient(circle_at_78%_14%,rgba(245,158,11,0.10),transparent_28%),linear-gradient(135deg,#ffffff_0%,#f7faf8_54%,#eef7f1_100%)]" />
        <div className="absolute left-0 top-0 h-full w-full bg-[linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:72px_72px] opacity-35" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-5 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,500px)] lg:px-10 lg:py-12">
        <section className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl space-y-6"
          >
            <div className="inline-flex w-fit items-center gap-2 rounded-md border border-emerald-200 bg-white px-3 py-1.5 shadow-sm">
              <Zap className="h-4 w-4 text-emerald-700" />
              <span className="text-xs font-semibold uppercase text-slate-700">Built for The Gambia</span>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                The marketplace for Gambian shops and shoppers.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Jendal helps local retailers sell online and gives buyers a clean place to discover clothing, accessories, electronics, and trusted stores across The Gambia.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="grid max-w-3xl gap-3 sm:grid-cols-3"
          >
            {metricCards.map((stat) => {
              const Icon = stat.icon;

              return (
                <div key={stat.label} className="rounded-lg border border-white/80 bg-white/90 p-4 shadow-sm backdrop-blur">
                  <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-md ${stat.accent}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-2xl font-bold text-slate-950">{stat.value}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{stat.label}</p>
                </div>
              );
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid max-w-3xl gap-4 sm:grid-cols-2"
          >
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="rounded-lg border border-white/80 bg-white/90 p-5 shadow-sm backdrop-blur">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-slate-950">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              );
            })}
          </motion.div>
        </section>

        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full"
        >
          <AuthPanel />
        </motion.section>
      </div>
    </main>
  );
}