import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // Auth Check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const transaction = await prisma.transaction.update({
            where: { id },
            data: {
                is_flagged: false,
                flag_reason: null // Clear reason once resolved
            }
        });

        return NextResponse.json({ success: true, transaction });
    } catch (error) {
        console.error('Failed to resolve transaction:', error);
        return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
    }
}
