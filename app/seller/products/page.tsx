'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { toast, Toaster } from 'react-hot-toast';
import { Plus, Package, Trash2, Check, X, Pencil } from 'lucide-react';

type Product = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  status: string;
  category: string;
  units_sold: number;
  image_url: string;
};

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<{ id: string; field: 'quantity' | 'price' } | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await (supabase
      .from('products') as any)
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });
    setProducts((data as Product[]) || []);
    setLoading(false);
  }

  const startEditing = (id: string, field: 'quantity' | 'price', currentValue: number) => {
    setEditingField({ id, field });
    setEditValue(String(currentValue));
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue('');
  };

  const saveEdit = async (productId: string) => {
    const newValue = Number(editValue);
    if (isNaN(newValue) || newValue < 0) {
      toast.error('Enter a valid number');
      return;
    }

    const field = editingField?.field;
    if (!field) return;

    const updateData: Record<string, any> = {};

    if (field === 'quantity') {
      updateData.quantity = newValue;
      updateData.status = newValue === 0 ? 'sold_out' : 'available';
    } else if (field === 'price') {
      updateData.price = newValue;
    }

    const { error } = await (supabase
      .from('products') as any)
      .update(updateData)
      .eq('id', productId);

    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success(field === 'quantity' ? 'Stock updated' : 'Price updated');
      setEditingField(null);
      loadProducts();
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Delete this product permanently?')) return;
    const { error } = await (supabase.from('products') as any).delete().eq('id', productId);
    if (error) { toast.error('Failed to delete'); } else { toast.success('Product deleted'); loadProducts(); }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Inventory</h1>
          <p className="text-slate-600 mt-1">{products.length} product(s)</p>
        </div>
        <Link
          href="/seller/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors"
        >
          <Plus size={18} /> Add Product
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-lg border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
          <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 mb-4">No products in your inventory</p>
          <Link
            href="/seller/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800"
          >
            <Plus size={18} /> Add your first product
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Product</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Category</th>
                  <th className="text-right p-4 text-sm font-medium text-slate-600">Price</th>
                  <th className="text-right p-4 text-sm font-medium text-slate-600">Stock</th>
                  <th className="text-right p-4 text-sm font-medium text-slate-600">Sold</th>
                  <th className="text-right p-4 text-sm font-medium text-slate-600">Status</th>
                  <th className="text-right p-4 text-sm font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-100 rounded flex items-center justify-center overflow-hidden shrink-0">
                          {p.image_url ? (
                            <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Package size={16} className="text-slate-400" />
                          )}
                        </div>
                        <span className="font-medium text-slate-900 text-sm">{p.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">{p.category}</td>

                    {/* Price - Editable */}
                    <td className="p-4 text-right">
                      {editingField?.id === p.id && editingField?.field === 'price' ? (
                        <div className="flex items-center gap-1 justify-end">
                          <input
                            type="number"
                            className="w-20 px-2 py-1 border border-emerald-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(p.id);
                              if (e.key === 'Escape') cancelEditing();
                            }}
                          />
                          <button onClick={() => saveEdit(p.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" title="Save">
                            <Check size={14} />
                          </button>
                          <button onClick={cancelEditing} className="p-1 text-slate-400 hover:bg-slate-50 rounded" title="Cancel">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 justify-end group">
                          <span className="font-medium text-slate-900 text-sm">D {Number(p.price).toLocaleString()}</span>
                          <button
                            onClick={() => startEditing(p.id, 'price', p.price)}
                            className="p-0.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                            title="Edit price"
                          >
                            <Pencil size={13} />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Stock - Editable */}
                    <td className="p-4 text-right">
                      {editingField?.id === p.id && editingField?.field === 'quantity' ? (
                        <div className="flex items-center gap-1 justify-end">
                          <input
                            type="number"
                            className="w-16 px-2 py-1 border border-emerald-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(p.id);
                              if (e.key === 'Escape') cancelEditing();
                            }}
                          />
                          <button onClick={() => saveEdit(p.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" title="Save">
                            <Check size={14} />
                          </button>
                          <button onClick={cancelEditing} className="p-1 text-slate-400 hover:bg-slate-50 rounded" title="Cancel">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 justify-end group">
                          <span className={`text-sm font-medium ${p.quantity < 5 ? 'text-amber-600' : 'text-slate-900'}`}>
                            {p.quantity}
                          </span>
                          <button
                            onClick={() => startEditing(p.id, 'quantity', p.quantity)}
                            className="p-0.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                            title="Edit stock"
                          >
                            <Pencil size={13} />
                          </button>
                          {p.quantity < 5 && (
                            <span className="text-xs text-amber-500 ml-1" title="Low stock">⚠</span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="p-4 text-sm text-right text-slate-600">{p.units_sold || 0}</td>

                    <td className="p-4 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status === 'available' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {p.status === 'available' ? 'Active' : 'Sold Out'}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => startEditing(p.id, 'price', p.price)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title="Edit price"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => startEditing(p.id, 'quantity', p.quantity)}
                          className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors"
                          title="Edit stock"
                        >
                          <Package size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete product"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}