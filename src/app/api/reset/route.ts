import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        // Delete in correct order: children before parents
        // Must handle foreign key relationships properly
        await prisma.$transaction([
            // First: delete tables that reference others
            prisma.transaction.deleteMany({}),
            prisma.familyMember.deleteMany({}),
            prisma.personFlag.deleteMany({}),
            // Second: delete people (references family, address)
            prisma.person.deleteMany({}),
            // Third: delete families
            prisma.family.deleteMany({}),
            // Fourth: delete supporting tables
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
