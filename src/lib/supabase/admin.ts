
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/^["'](.+)["']$/, '$1')?.trim()
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim().replace(/^["'](.+)["']$/, '$1')?.trim()

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error('Missing Supabase Admin environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.')
    }

    console.log('[Supabase Admin] Initializing with URL:', supabaseUrl.substring(0, 15) + '...');
    console.log('[Supabase Admin] Service Key Prefix:', supabaseServiceRoleKey.substring(0, 5) + '...');
    console.log('[Supabase Admin] Service Key Length:', supabaseServiceRoleKey.length);

    return createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        global: {
            headers: {
                apikey: supabaseServiceRoleKey
            }
        }
    })
}
