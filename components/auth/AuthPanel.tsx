'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/lib/supabase-client';
import { toast, Toaster } from 'react-hot-toast';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  ShoppingBag,
  Store,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { isAdminEmail } from '@/lib/admin';

const roles = [
  {
    value: 'buyer',
    title: 'Buyer',
    icon: ShoppingBag,
    description: 'Shop from trusted stores across The Gambia',
  },
  {
    value: 'seller',
    title: 'Seller',
    icon: Store,
    description: 'List products and grow your Gambian store',
  },
] as const;

type Role = (typeof roles)[number]['value'];

type AuthMode = 'login' | 'signup';

export default function AuthPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('buyer');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    if (mode === 'login') {
      return email.length > 5 && password.length >= 6;
    }
    return name.length >= 2 && email.length > 5 && password.length >= 6 && confirmPassword === password;
  }, [confirmPassword, email, mode, name, password]);

  const passwordChecks = useMemo(
    () => [
      { label: 'At least 6 characters', passed: password.length >= 6 },
      { label: 'Passwords match', passed: mode === 'login' || (confirmPassword.length > 0 && confirmPassword === password) },
    ],
    [confirmPassword, mode, password],
  );

  const heading = mode === 'login' ? 'Welcome back to Jendal' : 'Start selling or shopping';
  const description =
    mode === 'login'
      ? 'Sign in to your Gambian marketplace account.'
      : 'Create an account for The Gambia marketplace. Buyers enter instantly, sellers go through approval.';

  const handleAuth = useCallback(async () => {
    setSubmitting(true);
    toast.dismiss();

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        toast.error('Passwords must match.');
        setSubmitting(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        setSubmitting(false);
        return;
      }

      const userId = data.user?.id;
      if (!userId) {
        toast.error('Unable to complete signup.');
        setSubmitting(false);
        return;
      }

      const approved = role === 'buyer';
      const { error: profileError } = await (supabase.from('profiles') as any).insert({
        id: userId,
        full_name: name,
        email,
        role,
        approved,
        disabled: false,
      });

      if (profileError) {
        toast.error(profileError.message);
        setSubmitting(false);
        return;
      }

      toast.success(role === 'seller' ? 'Your seller account is awaiting admin approval.' : 'Welcome to Jendal Marketplace!');
      setSubmitting(false);
      router.push(role === 'seller' ? '/pending-approval' : '/buyer');
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      toast.error('Unable to sign in.');
      setSubmitting(false);
      return;
    }

    const { data: profileResponse, error: profileError } = await (supabase.from('profiles') as any)
      .select('role, approved, disabled')
      .eq('id', userId)
      .single();

    const profile = profileResponse as { role: 'buyer' | 'seller' | 'admin'; approved: boolean; disabled?: boolean } | null;

    if (profileError || !profile) {
      toast.error('Unable to load profile.');
      setSubmitting(false);
      return;
    }

    if (profile.disabled) {
      await supabase.auth.signOut();
      toast.error('This account has been disabled. Please contact Jendal support.');
      setSubmitting(false);
      return;
    }

    toast.success('Logged in successfully.');
    setSubmitting(false);

    if (profile.role === 'admin' || isAdminEmail(email)) {
      window.location.href = 'https://jendal.netlify.app/admin'
      return;
    }

    if (profile.role === 'buyer') {
     window.location.href = 'https://jendal.netlify.app/buyer'
      return;
    }

    if (profile.role === 'seller' && profile.approved) {
      window.location.href = 'https://jendal.netlify.app/seller'
      return;
    }

    window.location.href = 'https://jendal.netlify.app/pending-approval'
  }, [confirmPassword, email, mode, name, password, role, router]);

  return (
    <Card className="relative overflow-hidden rounded-lg border border-white/80 bg-white/95 p-5 shadow-premium backdrop-blur-xl sm:p-7 lg:p-8">
      <Toaster position="top-right" />

      <div className="absolute left-0 top-0 h-1 w-full bg-[linear-gradient(90deg,#16a34a,#f59e0b,#0ea5e9,#e11d48)]" />

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
            <span className="text-xs font-semibold uppercase text-emerald-800">Gambia secure access</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{heading}</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-700 sm:flex">
          <ShoppingBag className="h-5 w-5 text-white" />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
        {(['login', 'signup'] as AuthMode[]).map((tab) => (
          <motion.button
            key={tab}
            type="button"
            onClick={() => setMode(tab)}
            className={`rounded-md px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
              mode === tab ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
            whileTap={{ scale: 0.98 }}
          >
            {tab === 'login' ? 'Login' : 'Sign up'}
          </motion.button>
        ))}
      </div>

      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); handleAuth(); }}>
        <AnimatePresence initial={false}>
          {mode === 'signup' && (
            <motion.div
              key="name"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Input
                label="Full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                icon={User}
                placeholder="Awa Jallow"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          icon={Mail}
          placeholder="awa@jendal.gm"
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          icon={Lock}
          placeholder={mode === 'login' ? 'Enter your password' : 'Create a strong password'}
          action={{
            icon: showPassword ? EyeOff : Eye,
            label: showPassword ? 'Hide password' : 'Show password',
            onClick: () => setShowPassword((prev) => !prev),
          }}
        />

        <AnimatePresence initial={false}>
          {mode === 'signup' && (
            <motion.div
              key="signup-fields"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              <Input
                label="Confirm password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                icon={Lock}
                placeholder="Confirm your password"
              />

              <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
                {passwordChecks.map((check) => (
                  <div key={check.label} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full ${
                        check.passed ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white text-transparent'
                      }`}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                    {check.label}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {mode === 'signup' && (
            <motion.div
              key="role-picker"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <p className="mb-3 text-sm font-semibold text-slate-950">Choose how you use Jendal</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {roles.map((item) => {
                  const Icon = item.icon;
                  const selected = role === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setRole(item.value)}
                      aria-pressed={selected}
                      className={`relative rounded-lg border p-4 text-left transition-all duration-200 ${
                        selected
                          ? 'border-emerald-700 bg-emerald-700 text-white shadow-md'
                          : 'border-slate-200 bg-slate-50 text-slate-950 hover:border-slate-400 hover:bg-white'
                      }`}
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-md ${selected ? 'bg-white/15' : 'bg-white'}`}>
                          <Icon className={`h-5 w-5 ${selected ? 'text-white' : 'text-slate-700'}`} />
                        </div>
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                            selected
                              ? 'border-white bg-white text-emerald-700'
                              : 'border-slate-300 bg-white text-transparent'
                          }`}
                        >
                          <Check className="h-3 w-3" />
                        </span>
                      </div>
                      <p className="font-semibold">{item.title}</p>
                      <p className={`mt-1 text-xs leading-5 ${selected ? 'text-emerald-50' : 'text-slate-600'}`}>{item.description}</p>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          type="submit"
          disabled={!canSubmit || submitting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-emerald-700 py-3 font-semibold text-white transition hover:bg-emerald-800"
        >
          {submitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
              Processing...
            </>
          ) : (
            <>
              {mode === 'login' ? 'Sign in' : 'Create account'}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        <div className="pt-2 text-center">
          <p className="text-sm text-slate-600">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="font-semibold text-emerald-700 transition-colors hover:text-emerald-800"
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>
      </form>

      <AnimatePresence initial={false}>
        {mode === 'signup' && (
          <motion.div
            key="seller-note"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-5 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4"
          >
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div>
              <p className="text-xs font-semibold text-amber-950">Seller approval</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-900">
                Seller accounts are reviewed before storefront access. Buyers can start shopping right away.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}