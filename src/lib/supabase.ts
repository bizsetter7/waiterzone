import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ CRITICAL: Supabase credentials (URL/KEY) are missing! Check .env.local');
}

// Only warn if absolutely no credentials are found (even fallbacks)
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase credentials missing! Site will not function correctly.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'sb-auth-token',
    },
    // Disable Realtime to prevent WebSocket errors (since we don't use it yet)
    realtime: {
        params: {
            eventsPerSecond: 1,
        },
    },
});
