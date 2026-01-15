
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

function cleanEnv(val: string | undefined): string | undefined {
    if (!val) return undefined;
    // Remove ALL quotes and surrounding whitespace
    return val.replace(/["']/g, '').trim();
}

export function createAdminClient() {
    let supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
    let supabaseServiceRoleKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

    // EMERGENCY FALLBACK: If keys look missing or wrong, try reading .env file directly
    if (!supabaseServiceRoleKey || supabaseServiceRoleKey.length < 50) {
        try {
            const envPath = path.resolve(process.cwd(), '.env');
            if (fs.existsSync(envPath)) {
                const envContent = fs.readFileSync(envPath, 'utf8');
                const match = envContent.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*["']?([\w.-]+)["']?/);
                if (match && match[1]) {
                    console.log('[Supabase Admin] Recovered Service Key from .env file directly');
                    supabaseServiceRoleKey = match[1];
                }
            }
        } catch (e) {
            console.error('[Supabase Admin] Failed to read .env fallback:', e);
        }
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error('Missing Supabase Admin environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.')
    }

    const keyHex = Buffer.from(supabaseServiceRoleKey.substring(0, 5)).toString('hex');
    console.log('[Supabase Admin] Initializing with URL:', supabaseUrl.substring(0, 15) + '...');
    console.log('[Supabase Admin] Service Key Prefix:', supabaseServiceRoleKey.substring(0, 5) + '... (Hex: ' + keyHex + ')');
    console.log('[Supabase Admin] Service Key Length:', supabaseServiceRoleKey.length);

    return createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}
