'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { toast, Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Upload, ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';

const categories = [
  'Clothing', 'Electronics', 'Beauty', 'Accessories',
  'Home & Garden', 'Food & Drinks', 'Sports', 'Other',
];

export default function AddProductPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Other',
    location: '',
    quantity: '1',
    image: null as File | null,
  });
  const [preview, setPreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm({ ...form, image: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    toast.dismiss();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let imageUrl = '';
      if (form.image) {
        const fileExt = form.image.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, form.image);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }

      const { error: insertError } = await supabase.from('products').insert({
        seller_id: user.id,
        name: form.name,
        description: form.description,
        price: Number(form.price),
        category: form.category,
        location: form.location,
        quantity: Number(form.quantity),
        image_url: imageUrl,
        status: 'available',
      });

      if (insertError) throw insertError;

      toast.success('Product added successfully!');
      router.push('/seller/products');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
      <Toaster position="top-right" />

      <Link href="/seller/products" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
        <ArrowLeft size={18} /> Back to inventory
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-950 mb-2">Add New Product</h1>
        <p className="text-slate-600 mb-8">List a new item for sale in your store</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Image */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Product Image</label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors">
            {preview ? (
              <div>
                <img src={preview} alt="Preview" className="h-48 w-full object-cover rounded-md" />
                <button type="button" onClick={() => { setPreview(null); setForm({ ...form, image: null }); }} className="mt-2 text-sm text-red-600 hover:underline">Remove</button>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <Upload className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Click to upload product image</p>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
          <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g., Premium Wireless Headphones" />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
          <textarea required rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Describe your product..." />
        </div>

        {/* Price + Quantity */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Price (D) *</label>
            <input required type="number" min="1" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Quantity *</label>
            <input required type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="10" />
          </div>
        </div>

        {/* Category + Location */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Location *</label>
            <input required type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g., Banjul" />
          </div>
        </div>

        {/* Submit */}
        <button type="submit" disabled={submitting}
          className="w-full py-3 bg-emerald-700 text-white font-semibold rounded-lg hover:bg-emerald-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {submitting ? (
            <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" /> Adding...</>
          ) : (
            <><Package size={18} /> Add Product</>
          )}
        </button>
      </form>
    </div>
  );
}