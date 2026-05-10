'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { motion } from 'framer-motion';
import {
  Package, DollarSign, TrendingUp, AlertCircle,
  Plus, Edit3, ShoppingBag, Store,
} from 'lucide-react';

type Product = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  status: string;
  category: string;
  units_sold: number;
  sales_total: number;
  image_url: string;
};

export default function SellerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active || !user) return;
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const { data: prods } = await supabase.from('products').select('*').eq('seller_id', user.id).order('created_at', { ascending: false });
      if (!active) return;
      setProfile(p);
      setProducts((prods as Product[]) || []);
      setLoading(false);
    }
    loadData();
    return () => { active = false; };
  }, []);

  const totalSales = products.reduce((s, p) => s + Number(p.sales_total || 0), 0);
  const totalUnitsSold = products.reduce((s, p) => s + (p.units_sold || 0), 0);
  const activeProducts = products.filter((p) => p.status === 'available').length;
  const lowStock = products.filter((p) => p.quantity > 0 && p.quantity < 5).length;
  const totalStock = products.reduce((s, p) => s + p.quantity, 0);

  const kpis = [
    { label: 'Total Revenue', value: `D ${totalSales.toLocaleString()}`, icon: DollarSign, accent: 'bg-emerald-50 text-emerald-700' },
    { label: 'Active Products', value: activeProducts.toString(), icon: Package, accent: 'bg-sky-50 text-sky-700' },
    { label: 'Total Stock', value: totalStock.toString(), icon: TrendingUp, accent: 'bg-violet-50 text-violet-700' },
    { label: 'Units Sold', value: totalUnitsSold.toString(), icon: ShoppingBag, accent: 'bg-amber-50 text-amber-700' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-white px-3 py-1.5 shadow-sm mb-4">
          <Store className="h-4 w-4 text-emerald-700" />
          <span className="text-xs font-semibold uppercase text-slate-700">Seller Dashboard</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">Welcome back, {profile?.full_name || 'Seller'}</h1>
        <p className="mt-2 text-slate-600">Manage your store and track performance</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-3" />
              <div className="h-8 bg-slate-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="bg-white rounded-lg border border-slate-200 p-5">
                <div className={`mb-3 inline-flex p-2 rounded-md ${k.accent}`}><Icon size={20} /></div>
                <p className="text-sm text-slate-600 mb-1">{k.label}</p>
                <p className="text-2xl font-bold text-slate-950">{k.value}</p>
              </div>
            );
          })}
        </motion.div>
      )}

      {lowStock > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-700 shrink-0" />
          <div><p className="font-semibold text-amber-900">Low Stock Alert</p><p className="text-sm text-amber-700">{lowStock} product(s) need restocking</p></div>
          <Link href="/seller/products" className="ml-auto text-sm font-medium text-amber-800 hover:underline">View inventory</Link>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link href="/seller/products/new" className="flex items-center gap-4 p-5 bg-white rounded-lg border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all">
          <div className="p-3 bg-emerald-50 rounded-lg"><Plus className="h-5 w-5 text-emerald-700" /></div>
          <div><p className="font-semibold text-slate-900">Add New Product</p><p className="text-sm text-slate-600">List a new item for sale</p></div>
        </Link>
        <Link href="/seller/products" className="flex items-center gap-4 p-5 bg-white rounded-lg border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all">
          <div className="p-3 bg-sky-50 rounded-lg"><Edit3 className="h-5 w-5 text-sky-700" /></div>
          <div><p className="font-semibold text-slate-900">Manage Inventory</p><p className="text-sm text-slate-600">Update stock and prices</p></div>
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Products</h2>
          <Link href="/seller/products" className="text-sm text-emerald-700 font-medium hover:underline">View all</Link>
        </div>
        {products.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 mb-2">No products yet</p>
            <Link href="/seller/products/new" className="text-emerald-600 font-medium hover:underline">Add your first product</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {products.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-slate-100 rounded-md flex items-center justify-center overflow-hidden">
                    {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : <Package size={20} className="text-slate-400" />}
                  </div>
                  <div><p className="font-medium text-slate-900">{p.name}</p><p className="text-sm text-slate-500">{p.category}</p></div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">D {Number(p.price).toLocaleString()}</p>
                  <p className="text-sm text-slate-500">Stock: {p.quantity} | Sold: {p.units_sold || 0}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}