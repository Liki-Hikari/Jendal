'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { motion } from 'framer-motion';
import {
  ShoppingBag, Package, MessageCircle,
  Store, ArrowRight,
} from 'lucide-react';

export default function BuyerDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active || !user) return;

      const { data: p } = await (supabase.from('profiles') as any).select('*').eq('id', user.id).single();
      if (active) setProfile(p);

      const { data: ords } = await (supabase.from('orders') as any)
        .select('*, products(name, image_url)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (active) setOrders(ords || []);

      const { count } = await (supabase.from('products') as any)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'available')
        .gt('quantity', 0);
      if (active) setProductCount(count || 0);

      const { data: msgs } = await (supabase.from('messages') as any)
        .select('*')
        .eq('recipient_id', user.id);
      if (active) setUnreadMessages(msgs?.length || 0);

      if (active) setLoading(false);
    }
    load();
    return () => { active = false; };
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-white px-3 py-1.5 shadow-sm mb-4">
          <Store className="h-4 w-4 text-emerald-700" />
          <span className="text-xs font-semibold uppercase text-slate-700">Buyer Dashboard</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">Welcome back, {profile?.full_name || 'Buyer'}</h1>
        <p className="mt-2 text-slate-600">Discover products and manage your orders</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-3" />
              <div className="h-8 bg-slate-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Available Products', value: productCount, icon: ShoppingBag, accent: 'bg-emerald-50 text-emerald-700' },
            { label: 'My Orders', value: orders.length, icon: Package, accent: 'bg-sky-50 text-sky-700' },
            { label: 'Messages', value: unreadMessages, icon: MessageCircle, accent: 'bg-violet-50 text-violet-700' },
          ].map(k => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="bg-white rounded-lg border border-slate-200 p-5">
                <div className={`mb-3 inline-flex p-2 rounded-md ${k.accent}`}><Icon size={20} /></div>
                <p className="text-sm text-slate-600 mb-1">{k.label}</p>
                <p className="text-2xl font-bold text-slate-950">{k.value}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link href="/buyer/products" className="flex items-center gap-4 p-5 bg-white rounded-lg border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all">
          <div className="p-3 bg-emerald-50 rounded-lg"><ShoppingBag className="h-5 w-5 text-emerald-700" /></div>
          <div><p className="font-semibold text-slate-900">Store</p><p className="text-sm text-slate-600">Browse products from trusted sellers</p></div>
          <ArrowRight className="ml-auto h-5 w-5 text-slate-400" />
        </Link>
        <Link href="/buyer/messages" className="flex items-center gap-4 p-5 bg-white rounded-lg border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all">
          <div className="p-3 bg-sky-50 rounded-lg"><MessageCircle className="h-5 w-5 text-sky-700" /></div>
          <div><p className="font-semibold text-slate-900">Messages</p><p className="text-sm text-slate-600">Chat with sellers</p></div>
          <ArrowRight className="ml-auto h-5 w-5 text-slate-400" />
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
          <Link href="/buyer/orders" className="text-sm text-emerald-700 font-medium hover:underline">View all</Link>
        </div>
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 mb-2">No orders yet</p>
            <Link href="/buyer/products" className="text-emerald-600 font-medium hover:underline">Start shopping</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-100 rounded flex items-center justify-center overflow-hidden">
                    {o.products?.image_url ? <img src={o.products.image_url} alt="" className="h-full w-full object-cover" /> : <Package size={16} className="text-slate-400" />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{o.products?.name || 'Product'}</p>
                    <p className="text-xs text-slate-500">Qty: {o.quantity}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${o.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{o.status}</span>
                  <p className="text-xs text-slate-500 mt-1">{new Date(o.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}