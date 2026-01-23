import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        // Use a transaction for atomic reset - order matters for foreign keys
        await prisma.$transaction([
            prisma.transaction.deleteMany({}),
            prisma.familyMember.deleteMany({}),
            prisma.person.deleteMany({}),
            prisma.family.deleteMany({}),
            prisma.rawImportFile.deleteMany({}),
            prisma.address.deleteMany({}),
        ]);

        return NextResponse.json({ success: true, message: 'Database cleared successfully' });
    } catch (error: any) {
        console.error('Full Reset Error:', {
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack
        });
        return NextResponse.json({
            success: false,
            error: 'Failed to reset database',
            details: error.message
        }, { status: 500 });
    }
}
