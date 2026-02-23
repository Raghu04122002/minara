import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/^["'](.+)["']$/, '$1')?.trim()
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim().replace(/^["'](.+)["']$/, '$1')?.trim()

    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('[SUPABASE] Missing environment variables. Returning mock client for local development.');
        return {
            auth: {
                getUser: async () => ({ data: { user: { id: 'local-admin', email: 'admin@local.dev' } }, error: null }),
                getSession: async () => ({ data: { session: null }, error: null }),
                signOut: async () => ({ error: null }),
            },
            from: () => ({
                select: () => ({
                    eq: () => ({
                        single: async () => ({ data: null, error: null }),
                    }),
                }),
            }),
        } as any;
    }

    return createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                    }
                },
            },
        }
    )
}
