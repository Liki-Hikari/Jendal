'use client';

import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
