
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    // Secure this with a hardcoded temporary secret
    if (searchParams.get('secret') !== 'forensic-debug-9988') {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING';
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'MISSING';

        const cleanKey = key.replace(/["']/g, '').trim();

        // Hex dump of start and end to catch hidden chars
        const startHex = Buffer.from(cleanKey.substring(0, 10)).toString('hex');
        const endHex = Buffer.from(cleanKey.substring(cleanKey.length - 10)).toString('hex');

        // Test list users
        const admin = createAdminClient();
        const { data, error } = await admin.auth.admin.listUsers();

        return NextResponse.json({
            config: {
                urlPrefix: url.substring(0, 15),
                keyPrefix: cleanKey.substring(0, 5) + '...',
                keySuffix: '...' + cleanKey.substring(cleanKey.length - 5),
                startHex,
                endHex,
                rawLength: key.length,
                cleanLength: cleanKey.length,
                hasQuotes: key.includes('"') || key.includes("'"),
            },
            result: {
                success: !error,
                error: error ? {
                    message: error.message,
                    status: error.status,
                    name: error.name
                } : null,
                count: data?.users?.length
            }
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
