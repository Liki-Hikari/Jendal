'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { motion } from 'framer-motion';
import { MessageCircle, Send, User, Trash2, X, CheckCircle } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

type Message = {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  product_id: string | null;
  subject: string | null;
  body: string;
  broadcast: boolean;
  created_at: string;
};

type Thread = {
  key: string;
  otherId: string | null;
  otherName: string;
  productId: string | null;
  productName: string;
  messages: Message[];
};

export default function SellerMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [allProfiles, setAllProfiles] = useState<Record<string, string>>({});
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [activeThreadKey, setActiveThreadKey] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [hiddenThreads, setHiddenThreads] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Fetch ALL profiles
      const { data: allP } = await (supabase.from('profiles') as any)
        .select('id, full_name, email');
      if (allP) {
        const nameMap: Record<string, string> = {};
        (allP as any[]).forEach((p: any) => {
          nameMap[p.id] = p.full_name || p.email || 'User';
        });
        setAllProfiles(nameMap);
      }

      // Fetch all products
      const { data: allProd } = await (supabase.from('products') as any)
        .select('id, name');
      if (allProd) {
        const prodMap: Record<string, string> = {};
        (allProd as any[]).forEach((p: any) => {
          prodMap[p.id] = p.name;
        });
        setProductNames(prodMap);
      }

      // Fetch messages
      const { data: msgs } = await (supabase.from('messages') as any)
        .select('*')
        .or(`recipient_id.eq.${user.id},sender_id.eq.${user.id},broadcast.eq.true`)
        .order('created_at', { ascending: false });
      if (msgs) setMessages(msgs as Message[]);
    }
    init();
  }, []);

  const getName = (id: string | null, isBroadcast: boolean): string => {
    if (isBroadcast) return 'JENDAL Admin';
    if (!id) return 'Unknown';
    if (id === userId) return 'You';
    return allProfiles[id] || 'User';
  };

  const threads: Thread[] = (() => {
    const map = new Map<string, Thread>();
    messages.forEach(m => {
      const otherId = m.sender_id === userId ? m.recipient_id : m.sender_id;
      const otherName = getName(otherId, m.broadcast);
      const key = `${otherId || 'broadcast'}-${m.product_id || 'general'}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          otherId,
          otherName,
          productId: m.product_id,
          productName: productNames[m.product_id || ''] || 'General inquiry',
          messages: [],
        });
      }
      map.get(key)!.messages.push(m);
    });
    return [...map.values()]
      .map(t => ({ ...t, messages: t.messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) }))
      .filter(t => !hiddenThreads.has(t.key));
  })();

  const activeThread = threads.find(t => t.key === activeThreadKey);

  const deleteThread = (key: string) => {
    setHiddenThreads(prev => new Set([...prev, key]));
    if (activeThreadKey === key) setActiveThreadKey(null);
    toast.success('Conversation hidden');
  };

  const acceptOrder = async (thread: Thread) => {
    if (!userId || !thread.productId || !thread.otherId) { toast.error('Cannot process'); return; }
    const { data: orders } = await (supabase.from('orders') as any)
      .select('*').eq('buyer_id', thread.otherId).eq('product_id', thread.productId)
      .eq('seller_id', userId).eq('status', 'pending').order('created_at', { ascending: false }).limit(1);
    if (!orders || orders.length === 0) { toast.error('No pending order'); return; }
    const order = orders[0];
    const { data: product } = await (supabase.from('products') as any)
      .select('quantity, units_sold, sales_total').eq('id', thread.productId).single();
    if (!product || product.quantity < order.quantity) { toast.error('Not enough stock'); return; }
    const newQty = product.quantity - order.quantity;
    await (supabase.from('products') as any).update({
      quantity: newQty, units_sold: (product.units_sold || 0) + order.quantity,
      sales_total: (product.sales_total || 0) + order.quantity * order.unit_price,
      status: newQty === 0 ? 'sold_out' : 'available',
    }).eq('id', thread.productId);
    await (supabase.from('orders') as any).update({ status: 'confirmed' }).eq('id', order.id);
    await (supabase.from('messages') as any).insert({
      sender_id: userId, recipient_id: thread.otherId, product_id: thread.productId,
      subject: 'Order confirmed', body: `Your order has been confirmed! Quantity: ${order.quantity}. Thank you!`, broadcast: false,
    });
    toast.success('Order accepted!');
    const { data: msgs } = await (supabase.from('messages') as any)
      .select('*').or(`recipient_id.eq.${userId},sender_id.eq.${userId},broadcast.eq.true`).order('created_at', { ascending: false });
    if (msgs) setMessages(msgs as Message[]);
  };

  const sendReply = async () => {
    if (!userId || !activeThread || !replyText.trim()) return;
    setSending(true);
    await (supabase.from('messages') as any).insert({
      sender_id: userId, recipient_id: activeThread.otherId, product_id: activeThread.productId,
      subject: activeThread.messages[0]?.subject || 'Re: Inquiry', body: replyText.trim(), broadcast: false,
    });
    toast.success('Reply sent');
    setReplyText('');
    const { data: msgs } = await (supabase.from('messages') as any)
      .select('*').or(`recipient_id.eq.${userId},sender_id.eq.${userId},broadcast.eq.true`).order('created_at', { ascending: false });
    if (msgs) setMessages(msgs as Message[]);
    setSending(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Toaster position="top-right" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-slate-950">Messages</h1>
        <p className="text-slate-600 mt-1">Communicate with your customers</p>
      </motion.div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-lg border border-slate-200 p-4">
          <h2 className="font-semibold text-slate-900 mb-3">Conversations</h2>
          {threads.length === 0 ? (
            <div className="text-center py-8"><MessageCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" /><p className="text-sm text-slate-500">No conversations yet</p></div>
          ) : (
            <div className="space-y-1">
              {threads.map(t => (
                <div key={t.key} className="relative group">
                  <button onClick={() => setActiveThreadKey(t.key)} className={`w-full text-left p-3 pr-8 rounded-lg transition-colors ${activeThreadKey === t.key ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-slate-50 border border-transparent'}`}>
                    <div className="flex items-center gap-2 mb-1"><User size={14} className="text-slate-400 shrink-0" /><span className="font-medium text-sm text-slate-900 truncate">{t.otherName}</span></div>
                    <p className="text-xs text-slate-500 truncate">{t.productName}</p>
                    <p className="text-xs text-slate-400 mt-1">{t.messages.length} message(s)</p>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteThread(t.key); }} className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-4">
          {activeThread ? (
            <>
              <div className="border-b border-slate-100 pb-3 mb-3 flex items-center justify-between">
                <div><h3 className="font-semibold text-slate-900 text-lg">{activeThread.otherName}</h3><p className="text-sm text-slate-500">{activeThread.productName}</p></div>
                <div className="flex gap-2">
                  <button onClick={() => acceptOrder(activeThread)} className="px-3 py-1.5 bg-emerald-700 text-white text-sm rounded-lg hover:bg-emerald-800 transition-colors flex items-center gap-1"><CheckCircle size={15} /> Accept Order</button>
                  <button onClick={() => deleteThread(activeThread.key)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                {activeThread.messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${m.sender_id === userId ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                      <p className="text-xs font-medium text-slate-500 mb-1">{getName(m.sender_id, m.broadcast)}</p>
                      <p className="text-sm text-slate-800">{m.body}</p>
                      <p className="text-xs text-slate-400 mt-1">{new Date(m.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendReply()} placeholder={`Reply to ${activeThread.otherName}...`} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <button onClick={sendReply} disabled={sending || !replyText.trim()} className="px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 disabled:opacity-50 transition-colors flex items-center gap-2"><Send size={16} /> Send</button>
              </div>
            </>
          ) : (
            <div className="text-center py-16"><MessageCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Select a conversation to view messages</p></div>
          )}
        </div>
      </div>
    </div>
  );
}