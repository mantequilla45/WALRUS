/**
 * Supabase Client Configuration
 * Direct connection from mobile app to Supabase
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

console.log('[Supabase] URL:', SUPABASE_URL);
console.log('[Supabase] Key defined:', !!SUPABASE_KEY, 'length:', SUPABASE_KEY?.length);

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
