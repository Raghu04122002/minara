import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        // Delete in order of dependencies
        await prisma.transaction.deleteMany({});
        await prisma.familyMember.deleteMany({});
        await prisma.person.deleteMany({});
        await prisma.family.deleteMany({});
        // Address is not populated yet, but if it were:
        // await prisma.address.deleteMany({});

        return NextResponse.json({ success: true, message: 'Database cleared' });
    } catch (error) {
        console.error('Reset error:', error);
        return NextResponse.json({ success: false, error: 'Failed to reset database' }, { status: 500 });
    }
}
