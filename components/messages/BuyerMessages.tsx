'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Send, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';

type Product = Database['public']['Tables']['products']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];

type ConversationThread = {
  key: string;
  otherId: string | null;
  productId: string | null;
  productName: string;
  messages: Message[];
};

interface BuyerMessagesProps {
  userId: string | null;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-GM', {
    style: 'currency',
    currency: 'GMD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function BuyerMessages({ userId }: BuyerMessagesProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, string>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [sendingThread, setSendingThread] = useState<string | null>(null);
  const [activeThreadKey, setActiveThreadKey] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      const { data } = await (supabase as any)
        .from('products')
        .select('*')
        .eq('status', 'available')
        .gt('quantity', 0)
        .order('created_at', { ascending: false });
      if (data) {
        setProducts(data as Product[]);
      }
    };
    loadProducts();
  }, []);

  const loadMessages = async (currentUserId: string) => {
    const { data, error } = await (supabase as any)
      .from('messages')
      .select('*')
      .or(`recipient_id.eq.${currentUserId},sender_id.eq.${currentUserId},broadcast.eq.true`)
      .order('created_at', { ascending: false });

    if (!error) {
      const messageRows = (data ?? []) as Message[];
      setMessages(messageRows);
      const participantIds = Array.from(
        new Set(
          messageRows
            .flatMap((message) => [message.sender_id, message.recipient_id].filter(Boolean) as string[])
            .filter((id) => id !== currentUserId),
        ),
      );

      if (participantIds.length > 0) {
        const { data: profilesData } = await (supabase as any).from('profiles').select('id,full_name').in('id', participantIds);
        if (profilesData) {
          setProfileMap(
            Object.fromEntries((profilesData as { id: string; full_name: string }[]).map((profile) => [profile.id, profile.full_name])),
          );
        }
      }
    }
  };

  useEffect(() => {
    if (userId) {
      loadMessages(userId);
    }
  }, [userId]);

  const conversationThreads = useMemo(() => {
    if (!userId) {
      return [];
    }

    const threads = new Map<string, ConversationThread>();

    messages.forEach((message) => {
      const otherId = message.sender_id === userId ? message.recipient_id : message.sender_id;
      const key = `${otherId ?? 'broadcast'}-${message.product_id ?? 'global'}`;
      const productName =
        message.product_id && products.find((product) => product.id === message.product_id)?.name
          ? products.find((product) => product.id === message.product_id)!.name
          : message.broadcast
          ? 'Admin broadcast'
          : 'Retailer chat';

      if (!threads.has(key)) {
        threads.set(key, {
          key,
          otherId,
          productId: message.product_id,
          productName,
          messages: [],
        });
      }

      threads.get(key)!.messages.push(message);
    });

    return Array.from(threads.values()).map((thread) => ({
      ...thread,
      messages: thread.messages.sort((a, b) =>
        new Date(a.created_at ?? '').getTime() - new Date(b.created_at ?? '').getTime(),
      ),
    }));
  }, [messages, userId, products]);

  const getProfileName = (id: string | null) => {
    if (!id) {
      return 'Admin';
    }
    return profileMap[id] ?? 'Marketplace user';
  };

  const sendMessage = async (thread: ConversationThread, body: string) => {
    if (!userId || !body.trim()) {
      return;
    }

    setSendingThread(thread.key);

    const messageData = {
      sender_id: userId,
      recipient_id: thread.otherId,
      product_id: thread.productId,
      subject: thread.productId ? `Re: ${thread.productName}` : 'Marketplace message',
      body: body.trim(),
      broadcast: false,
    };

    const { error } = await (supabase as any).from('messages').insert(messageData);

    if (error) {
      toast.error('Failed to send message');
    } else {
      toast.success('Message sent');
      setReplyDrafts((current) => ({ ...current, [thread.key]: '' }));
      await loadMessages(userId);
    }

    setSendingThread(null);
  };

  const activeThread = conversationThreads.find((thread) => thread.key === activeThreadKey);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
        <p className="text-slate-600">Communicate with sellers and manage your orders.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Conversations</h2>
            {conversationThreads.length === 0 ? (
              <p className="text-slate-500">No messages yet.</p>
            ) : (
              <div className="space-y-2">
                {conversationThreads.map((thread) => (
                  <button
                    key={thread.key}
                    onClick={() => setActiveThreadKey(thread.key)}
                    className={`w-full text-left p-3 rounded-lg border ${
                      activeThreadKey === thread.key
                        ? 'border-emerald-300 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-medium text-slate-900">{getProfileName(thread.otherId)}</p>
                    <p className="text-sm text-slate-500">{thread.productName}</p>
                    <p className="text-xs text-slate-400">{thread.messages.length} messages</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {activeThread ? (
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Chat with {getProfileName(activeThread.otherId)} - {activeThread.productName}
              </h2>
              <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                {activeThread.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg ${
                      message.sender_id === userId ? 'bg-emerald-100 ml-12' : 'bg-slate-100 mr-12'
                    }`}
                  >
                    <p className="text-sm">{message.body}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {getProfileName(message.sender_id)} · {new Date(message.created_at ?? '').toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyDrafts[activeThread.key] || ''}
                  onChange={(e) => setReplyDrafts((current) => ({ ...current, [activeThread.key]: e.target.value }))}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                />
                <Button
                  onClick={() => sendMessage(activeThread, replyDrafts[activeThread.key] || '')}
                  disabled={sendingThread === activeThread.key}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
              <MessageCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">Select a conversation to view messages.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}