
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        return {
            auth: {
                getUser: async () => ({ data: { user: null }, error: null }),
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            },
        } as any;
    }

    return createBrowserClient(
        supabaseUrl,
        supabaseAnonKey
    )
}
