import { NextResponse } from 'next/server';
import { runHouseholding } from '@/lib/householding/grouper';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        const result = await runHouseholding();
        return NextResponse.json(result);
    } catch (error) {
        console.error('Householding error:', error);
        return NextResponse.json(
            { error: 'Failed to run householding', details: (error as Error).message },
            { status: 500 }
        );
    }
}
