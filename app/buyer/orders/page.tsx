'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { motion } from 'framer-motion';
import { Package, ShoppingBag } from 'lucide-react';

type Order = {
  id: string;
  product_id: string;
  status: string;
  quantity: number;
  unit_price: number;
  created_at: string;
  products: { name: string; image_url: string; category: string } | null;
  profiles: { full_name: string } | null;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active || !user) return;

      const { data } = await (supabase.from('orders') as any)
        .select('*, products(name, image_url, category), seller:profiles!orders_seller_id_fkey(full_name)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (active) {
        setOrders((data || []).map((o: any) => ({
          ...o,
          profiles: o.seller || null,
        })));
        setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-slate-950 mb-2">My Orders</h1>
        <p className="text-slate-600">Track your purchases and order status</p>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-lg border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
          <ShoppingBag className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 mb-2">No orders yet</p>
          <Link href="/buyer/products" className="text-emerald-600 font-medium hover:underline">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left p-4 text-sm font-medium text-slate-600">Product</th>
                <th className="text-left p-4 text-sm font-medium text-slate-600">Seller</th>
                <th className="text-right p-4 text-sm font-medium text-slate-600">Qty</th>
                <th className="text-right p-4 text-sm font-medium text-slate-600">Price</th>
                <th className="text-right p-4 text-sm font-medium text-slate-600">Status</th>
                <th className="text-right p-4 text-sm font-medium text-slate-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-b border-slate-100 last:border-0">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-100 rounded flex items-center justify-center overflow-hidden shrink-0">
                        {o.products?.image_url ? (
                          <img src={o.products.image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Package size={16} className="text-slate-400" />
                        )}
                      </div>
                      <span className="font-medium text-sm text-slate-900">{o.products?.name || 'Product'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-600">{o.profiles?.full_name || 'Seller'}</td>
                  <td className="p-4 text-sm text-right">{o.quantity}</td>
                  <td className="p-4 text-sm text-right font-medium">D {o.unit_price.toLocaleString()}</td>
                  <td className="p-4 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      o.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                      o.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' :
                      'bg-slate-50 text-slate-600'
                    }`}>{o.status}</span>
                  </td>
                  <td className="p-4 text-sm text-right text-slate-500">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}