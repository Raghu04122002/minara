
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is the super admin
        if (user.email !== 'livoranger@gmail.com') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING';
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'MISSING';

        const rawLength = serviceKey.length;
        const trimmedLength = serviceKey.trim().length;
        const strippedKey = serviceKey.trim().replace(/^["'](.+)["']$/, '$1');
        const finalLength = strippedKey.length;

        // Test the client
        const supabaseAdmin = createAdminClient();
        const { data: users, error: adminError } = await supabaseAdmin.auth.admin.listUsers();

        return NextResponse.json({
            config: {
                urlPrefix: supabaseUrl.substring(0, 15),
                serviceKeyPrefix: strippedKey.substring(0, 5),
                serviceKeySuffix: strippedKey.substring(strippedKey.length - 5),
                rawLength,
                trimmedLength,
                finalLength,
                hasQuotes: serviceKey.startsWith('"') || serviceKey.startsWith("'"),
                envType: typeof serviceKey
            },
            test: {
                success: !adminError,
                error: adminError ? {
                    message: adminError.message,
                    status: adminError.status
                } : null,
                userCount: users?.users?.length || 0
            }
        });
    } catch (error: any) {
        console.error('Debug Auth Error:', error);
        return NextResponse.json({
            error: error.message,
            stack: error.stack?.split('\n').slice(0, 3)
        }, { status: 500 });
    }
}
