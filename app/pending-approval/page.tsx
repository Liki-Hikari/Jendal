'use client';

'use client';

import { motion } from 'framer-motion';
import { Clock3 } from 'lucide-react';

export default function PendingApprovalPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 lg:px-12 lg:py-20">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-10 rounded-[2rem] border border-slate-200 bg-white p-10 shadow-soft text-center">
        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="flex h-28 w-28 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 shadow-sm">
          <Clock3 className="h-12 w-12" />
        </motion.div>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">Your retailer account is under review.</h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">You will gain access once approved by the admin. We&rsquo;ll notify you as soon as your seller account is ready to accept orders.</p>
        </div>
        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 text-left text-slate-700 shadow-sm">
          <p className="font-semibold text-slate-900">While you wait</p>
          <ul className="mt-3 space-y-2 text-sm leading-6">
            <li>• Keep your product details ready for a faster launch.</li>
            <li>• Check your email for approval updates.</li>
            <li>• Prepare inventory and storefront imagery.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
