import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        // Delete in correct order: children before parents
        // Must handle foreign key relationships properly
        await prisma.$transaction([
            // Phase 1B tables (children before parents)
            prisma.eventParticipation.deleteMany({}),
            prisma.registrationParticipant.deleteMany({}),
            prisma.order.deleteMany({}),
            prisma.registrationSubmission.deleteMany({}),
            prisma.ticketTier.deleteMany({}),
            prisma.event.deleteMany({}),
            // Original tables (children before parents)
            prisma.transaction.deleteMany({}),
            prisma.householdMember.deleteMany({}),
            prisma.personFlag.deleteMany({}),
            prisma.importJob.deleteMany({}),
            prisma.person.deleteMany({}),
            prisma.household.deleteMany({}),
            prisma.rawImportFile.deleteMany({}),
            prisma.address.deleteMany({}),
            prisma.institution.deleteMany({}),
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
