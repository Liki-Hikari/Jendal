'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { toast, Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ShoppingBag, Search, MapPin, Package, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Product = {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category: string;
  quantity: number;
  location: string;
  seller_id: string;
  profiles: {
    full_name: string;
    verified_badge: boolean;
    location: string;
  } | null;
};

export default function SellerStorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const router = useRouter();

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: productsData } = await (supabase.from('products') as any)
        .select('*')
        .eq('status', 'available')
        .gt('quantity', 0)
        .order('created_at', { ascending: false });

      if (!active || !productsData) return;

      const sellerIds = [...new Set(productsData.map((p: any) => p.seller_id))];

      const { data: profilesData } = await (supabase.from('profiles') as any)
        .select('id, full_name, verified_badge, location')
        .in('id', sellerIds);

      const sellerMap: Record<string, any> = {};
      if (profilesData) {
        profilesData.forEach((profile: any) => {
          sellerMap[profile.id] = profile;
        });
      }

      const combined = productsData.map((p: any) => ({
        ...p,
        profiles: sellerMap[p.seller_id] || null,
      }));

      if (active) {
        setProducts(combined);
        setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))] as string[];

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || p.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Toaster position="top-right" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-slate-950 mb-2">Store</h1>
        <p className="text-slate-600">Browse all products across the marketplace</p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 p-3 animate-pulse">
              <div className="aspect-square bg-slate-200 rounded-md mb-3" />
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
          <ShoppingBag className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(p => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow group"
            >
              <div className="aspect-square bg-slate-100 relative overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="h-12 w-12 text-slate-400" />
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 bg-white/90 rounded-full text-xs font-medium text-slate-700 shadow-sm">
                    {p.category}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-slate-900 mb-1 truncate">{p.name}</h3>
                <p className="text-xl font-bold text-emerald-700 mb-2">D {p.price.toLocaleString()}</p>

                {p.profiles && (
                  <div className="flex items-center gap-2 mb-3 text-sm text-slate-600">
                    <div className="h-6 w-6 bg-emerald-100 rounded-full flex items-center justify-center text-xs font-semibold text-emerald-700">
                      {p.profiles.full_name?.charAt(0) || 'S'}
                    </div>
                    <span>{p.profiles.full_name}</span>
                    {p.profiles.verified_badge && <span className="text-emerald-500">✓</span>}
                  </div>
                )}

                <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                  <MapPin size={12} />
                  <span>{p.location}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}