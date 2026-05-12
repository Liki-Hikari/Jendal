'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  CheckCircle2,
  Clock3,
  LogOut,
  Package,
  RefreshCw,
  ShieldCheck,
  Store,
  Trash2,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase-client';
import { isAdminEmail } from '@/lib/admin';

type AdminProfile = {
  id: string;
  full_name: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin';
  approved: boolean;
  disabled: boolean;
  created_at: string | null;
};

type AdminProduct = {
  id: string;
  seller_id: string;
  seller_name: string | null;
  seller_email: string | null;
  name: string;
  category: string;
  price: number;
  quantity: number;
  status: 'available' | 'sold_out';
  image_url: string;
  created_at: string | null;
};

type ConfirmAction =
  | { type: 'delete-account'; profile: AdminProfile }
  | { type: 'delete-product'; product: AdminProduct }
  | null;

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-GM', {
    style: 'currency',
    currency: 'GMD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AdminPage() {
  const [adminEmail, setAdminEmail] = useState('');
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [sellerFilter, setSellerFilter] = useState<'all' | 'pending' | 'enabled' | 'disabled'>('all');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);

  const sellers = useMemo(() => profiles.filter((profile) => profile.role === 'seller'), [profiles]);
  const buyers = useMemo(() => profiles.filter((profile) => profile.role === 'buyer'), [profiles]);
  const pendingSellers = useMemo(() => sellers.filter((seller) => !seller.approved && !seller.disabled), [sellers]);
  const approvedSellers = useMemo(() => sellers.filter((seller) => seller.approved && !seller.disabled), [sellers]);
  const disabledAccounts = useMemo(() => profiles.filter((profile) => profile.disabled), [profiles]);

  const filteredSellers = useMemo(() => {
    switch (sellerFilter) {
      case 'pending':
        return pendingSellers;
      case 'enabled':
        return approvedSellers;
      case 'disabled':
        return sellers.filter((seller) => seller.disabled);
      default:
        return sellers;
    }
  }, [sellerFilter, sellers, pendingSellers, approvedSellers]);

  const loadAdminData = useCallback(async (showRefreshState = false) => {
    if (showRefreshState) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !isAdminEmail(user.email)) {
      toast.error('Admin access required.');
      window.location.href = '/';
      return;
    }

    setAdminEmail(user.email ?? '');

    const [profilesResult, productsResult] = await Promise.all([
      (supabase.rpc as any)('admin_list_profiles'),
      (supabase.rpc as any)('admin_list_products'),
    ]);

    if (profilesResult.error) {
      toast.error(`Unable to load accounts: ${profilesResult.error.message}`);
    } else {
      setProfiles((profilesResult.data ?? []) as AdminProfile[]);
    }

    if (productsResult.error) {
      toast.error(`Unable to load products: ${productsResult.error.message}`);
    } else {
      setProducts((productsResult.data ?? []) as AdminProduct[]);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const runAdminAction = async (id: string, action: () => Promise<{ error: { message: string } | null }>, successMessage: string) => {
    setWorkingId(id);
    toast.dismiss();

    const { error } = await action();

    if (error) {
      toast.error(error.message);
      setWorkingId(null);
      return;
    }

    toast.success(successMessage);
    await loadAdminData(true);
    setWorkingId(null);
  };

  const sendBroadcast = async () => {
    const trimmed = broadcastMessage.trim();
    if (!trimmed) {
      toast.error('Please type a broadcast message first.');
      return;
    }

    setBroadcastSending(true);
    toast.dismiss();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      toast.error('Unable to send broadcast. Please sign in again.');
      setBroadcastSending(false);
      return;
    }

    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      recipient_id: null,
      product_id: null,
      subject: 'Admin broadcast',
      body: trimmed,
      broadcast: true,
    } as any);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Broadcast sent to all users.');
      setBroadcastMessage('');
    }

    setBroadcastSending(false);
  };

  const approveSeller = async (seller: AdminProfile) => {
    await runAdminAction(
      seller.id,
      () => (supabase.rpc as any)('admin_set_profile_approved', { target_profile_id: seller.id, next_approved: true }),
      `${seller.full_name} can now sell.`,
    );
  };

  const toggleDisabled = async (profile: AdminProfile) => {
    await runAdminAction(
      profile.id,
      () => (supabase.rpc as any)('admin_set_profile_disabled', { target_profile_id: profile.id, next_disabled: !profile.disabled }),
      profile.disabled ? `${profile.full_name} has been enabled.` : `${profile.full_name} has been disabled.`,
    );
  };

  const deleteAccount = async (profile: AdminProfile) => {
    await runAdminAction(
      profile.id,
      () => (supabase.rpc as any)('admin_delete_account', { target_profile_id: profile.id }),
      `${profile.full_name} was deleted.`,
    );
    setConfirmAction(null);
  };

  const deleteProduct = async (product: AdminProduct) => {
    await runAdminAction(
      product.id,
      () => (supabase.rpc as any)('admin_delete_product', { target_product_id: product.id }),
      `${product.name} was deleted.`,
    );
    setConfirmAction(null);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-sm">
          <RefreshCw className="h-4 w-4 animate-spin text-emerald-700" />
          Loading admin dashboard...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 sm:px-6 lg:px-10">
      <Toaster position="top-right" />

      <div className="mx-auto max-w-7xl space-y-5">
        <nav className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Link href="/admin" className="rounded-full bg-slate-900 px-3 py-1 text-white transition hover:bg-slate-800">
              Admin dashboard
            </Link>
            <span className="text-slate-400">/</span>
            <Link href="/buyer" className="rounded-full border border-slate-200 px-3 py-1 text-slate-700 transition hover:bg-slate-50">
              Store
            </Link>
          </div>
          <div className="text-sm text-slate-500">Quick access between store and admin tools.</div>
        </nav>

        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between"
        >
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
              <span className="text-xs font-semibold uppercase text-emerald-800">Admin workspace</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">Jendal control panel</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Approve retailers, manage accounts, disable bad actors, and remove products from the marketplace.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={() => loadAdminData(true)} disabled={refreshing} className="gap-2 rounded-md">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button type="button" variant="secondary" onClick={signOut} className="gap-2 rounded-md">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </motion.header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: 'Pending sellers', value: pendingSellers.length, icon: Clock3 },
            { label: 'Approved sellers', value: approvedSellers.length, icon: CheckCircle2 },
            { label: 'Buyers', value: buyers.length, icon: Users },
            { label: 'Products', value: products.length, icon: Package },
            { label: 'Disabled', value: disabledAccounts.length, icon: Ban },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <div key={stat.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-slate-950">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <p className="text-3xl font-bold text-slate-950">{stat.value}</p>
                <p className="mt-1 text-sm font-medium text-slate-500">{stat.label}</p>
              </div>
            );
          })}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50">
                <Store className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-950">Broadcast message</h2>
                <p className="text-sm text-slate-500">Send a short announcement to every user in the marketplace.</p>
              </div>
            </div>
            <textarea
              value={broadcastMessage}
              onChange={(event) => setBroadcastMessage(event.target.value)}
              rows={4}
              className="min-h-[120px] w-full rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Write your announcement here..."
            />
            <div className="flex items-center justify-end">
              <Button type="button" onClick={sendBroadcast} disabled={broadcastSending || !broadcastMessage.trim()} className="gap-2 rounded-md">
                {broadcastSending ? 'Sending...' : 'Send to all users'}
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50">
                <Store className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-950">Seller accounts</h2>
                <p className="text-sm text-slate-500">Approve, enable, disable, or remove seller accounts.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant={sellerFilter === 'all' ? 'secondary' : 'outline'} onClick={() => setSellerFilter('all')} className="rounded-md">
                All sellers ({sellers.length})
              </Button>
              <Button type="button" variant={sellerFilter === 'pending' ? 'secondary' : 'outline'} onClick={() => setSellerFilter('pending')} className="rounded-md">
                Pending ({pendingSellers.length})
              </Button>
              <Button type="button" variant={sellerFilter === 'enabled' ? 'secondary' : 'outline'} onClick={() => setSellerFilter('enabled')} className="rounded-md">
                Enabled ({approvedSellers.length})
              </Button>
              <Button type="button" variant={sellerFilter === 'disabled' ? 'secondary' : 'outline'} onClick={() => setSellerFilter('disabled')} className="rounded-md">
                Disabled ({sellers.filter((seller) => seller.disabled).length})
              </Button>
            </div>
          </div>

          {sellers.length === 0 ? (
            <EmptyState title="No seller accounts" description="Seller accounts appear here when users sign up as sellers." />
          ) : filteredSellers.length === 0 ? (
            <EmptyState title="No sellers in this filter" description="Try another filter or refresh the dashboard." />
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredSellers.map((profile) => (
                <div key={profile.id} className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-950">{profile.full_name}</p>
                      <StatusBadge profile={profile} />
                    </div>
                    <p className="mt-1 break-all text-sm text-slate-600">{profile.email}</p>
                    <p className="mt-2 text-xs font-medium text-slate-400">
                      Seller account · Joined {profile.created_at ? new Date(profile.created_at).toLocaleString() : 'recently'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {profile.role === 'seller' && !profile.approved && !profile.disabled && (
                      <Button
                        type="button"
                        onClick={() => approveSeller(profile)}
                        disabled={workingId === profile.id}
                        className="gap-2 rounded-md bg-emerald-600 hover:bg-emerald-700"
                      >
                        {workingId === profile.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Approve
                      </Button>
                    )}
                    <Button type="button" variant="outline" onClick={() => toggleDisabled(profile)} disabled={workingId === profile.id} className="gap-2 rounded-md">
                      <Ban className="h-4 w-4" />
                      {profile.disabled ? 'Enable' : 'Disable'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setConfirmAction({ type: 'delete-account', profile })}
                      className="gap-2 rounded-md border-red-200 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100">
                <Users className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-950">Buyer accounts</h2>
                <p className="text-sm text-slate-500">View buyer accounts and disable or delete invalid profiles.</p>
              </div>
            </div>
          </div>

          {buyers.length === 0 ? (
            <EmptyState title="No buyer accounts" description="Buyer profiles will appear here after customer signup." />
          ) : (
            <div className="divide-y divide-slate-200">
              {buyers.map((profile) => (
                <div key={profile.id} className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-950">{profile.full_name}</p>
                      <StatusBadge profile={profile} />
                    </div>
                    <p className="mt-1 break-all text-sm text-slate-600">{profile.email}</p>
                    <p className="mt-2 text-xs font-medium text-slate-400">
                      Buyer account · Joined {profile.created_at ? new Date(profile.created_at).toLocaleString() : 'recently'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => toggleDisabled(profile)} disabled={workingId === profile.id} className="gap-2 rounded-md">
                      <Ban className="h-4 w-4" />
                      {profile.disabled ? 'Enable' : 'Disable'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setConfirmAction({ type: 'delete-account', profile })}
                      className="gap-2 rounded-md border-red-200 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 p-5 sm:p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100">
              <Package className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-950">Products</h2>
              <p className="text-sm text-slate-500">Remove products that should not appear in the buyer store.</p>
            </div>
          </div>

          {products.length === 0 ? (
            <EmptyState title="No products yet" description="Retailer products will appear here after sellers add inventory." />
          ) : (
            <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-2">
              {products.map((product) => (
                <div key={product.id} className="grid gap-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-[96px_minmax(0,1fr)]">
                  <div className="relative h-24 overflow-hidden rounded-md bg-slate-100">
                    <Image src={product.image_url} alt={product.name} fill unoptimized sizes="96px" className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{product.name}</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {product.category} · {formatCurrency(product.price)} · {product.quantity} left
                        </p>
                      </div>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{product.status}</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Seller: {product.seller_name || 'Unknown'} · {product.seller_email || 'No email'}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmAction({ type: 'delete-product', product })}
                      className="mt-4 gap-2 rounded-md border-red-200 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete product
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-red-50 text-red-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-950">
              {confirmAction.type === 'delete-account' ? 'Delete account?' : 'Delete product?'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {confirmAction.type === 'delete-account'
                ? `This will delete ${confirmAction.profile.full_name}'s profile and related marketplace data. This cannot be undone.`
                : `This will remove ${confirmAction.product.name} from the marketplace. This cannot be undone.`}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setConfirmAction(null)} className="rounded-md">
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() =>
                  confirmAction.type === 'delete-account'
                    ? deleteAccount(confirmAction.profile)
                    : deleteProduct(confirmAction.product)
                }
                className="gap-2 rounded-md bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Delete forever
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatusBadge({ profile }: { profile: AdminProfile }) {
  if (profile.disabled) {
    return <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">Disabled</span>;
  }

  if (profile.role === 'seller' && !profile.approved) {
    return <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">Pending seller</span>;
  }

  if (profile.role === 'seller') {
    return <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Approved seller</span>;
  }

  return <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{profile.role}</span>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-emerald-50">
        <BadgeCheck className="h-6 w-6 text-emerald-700" />
      </div>
      <p className="font-semibold text-slate-950">{title}</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
