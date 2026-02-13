import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/people/flags/[flagId]/delete — Permanently finalize a merge
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ flagId: string }> }
) {
    try {
        const { flagId } = await params;

        const flag = await prisma.personFlag.findUnique({ where: { id: flagId } });

        if (!flag) {
            return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
        }

        if (flag.actionType !== 'merge') {
            return NextResponse.json({ error: 'Permanent delete is only available for merge actions' }, { status: 400 });
        }

        if (flag.undoneAt) {
            return NextResponse.json({ error: 'This merge has been undone and cannot be finalized' }, { status: 400 });
        }

        if (flag.permanentlyDeletedAt) {
            return NextResponse.json({ error: 'This merge has already been finalized' }, { status: 400 });
        }

        await prisma.personFlag.update({
            where: { id: flagId },
            data: {
                permanentlyDeletedAt: new Date(),
                permanentlyDeletedByUserId: 'system',
                snapshot: null // Clear snapshot since undo is no longer possible
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Merge has been permanently finalized. Undo is no longer available.'
        });
    } catch (error) {
        console.error('Error finalizing merge:', error);
        return NextResponse.json(
            { error: 'Failed to finalize merge' },
            { status: 500 }
        );
    }
}
