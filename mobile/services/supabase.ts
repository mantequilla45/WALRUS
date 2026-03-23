/**
 * Supabase Client Configuration
 * Direct connection from mobile app to Supabase
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[Supabase] MISSING ENV VARS!', { url: SUPABASE_URL, keyLen: SUPABASE_KEY?.length });
} else {
  console.log('[Supabase] Configured:', SUPABASE_URL, 'key length:', SUPABASE_KEY.length);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Test connection on startup
supabase
  .from('sensor_readings')
  .select('id', { count: 'exact', head: true })
  .then(({ count, error }) => {
    if (error) {
      console.error('[Supabase] Connection test FAILED:', error.message, error.code);
    } else {
      console.log('[Supabase] Connected! sensor_readings rows:', count);
    }
  });
