import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Add a person to a household
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: householdId } = await params;
        const { personId, role = 'UNKNOWN' } = await request.json();

        if (!personId) {
            return NextResponse.json(
                { error: 'personId is required' },
                { status: 400 }
            );
        }

        // Check if household exists
        const household = await prisma.household.findUnique({
            where: { id: householdId }
        });

        if (!household) {
            return NextResponse.json(
                { error: 'Household not found' },
                { status: 404 }
            );
        }

        // Create or update household member (manual assignment)
        const member = await prisma.householdMember.upsert({
            where: {
                householdId_personId: { householdId, personId }
            },
            update: {
                roleInHousehold: role,
                groupedBy: 'MANUAL',
                manualAssignment: true
            },
            create: {
                householdId,
                personId,
                roleInHousehold: role,
                groupedBy: 'MANUAL',
                manualAssignment: true
            }
        });

        return NextResponse.json(member);
    } catch (error) {
        console.error('Error adding household member:', error);
        return NextResponse.json(
            { error: 'Failed to add household member' },
            { status: 500 }
        );
    }
}

// Remove a person from a household
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: householdId } = await params;
        const { searchParams } = new URL(request.url);
        const personId = searchParams.get('personId');

        if (!personId) {
            return NextResponse.json(
                { error: 'personId query param is required' },
                { status: 400 }
            );
        }

        // Remove household member
        await prisma.householdMember.deleteMany({
            where: { householdId, personId }
        });

        // Check remaining members and delete household if less than 2
        const remainingCount = await prisma.householdMember.count({
            where: { householdId }
        });

        if (remainingCount < 2) {
            // Delete all remaining household members
            await prisma.householdMember.deleteMany({
                where: { householdId }
            });

            // Update transactions to remove household reference
            await prisma.transaction.updateMany({
                where: { householdId },
                data: { householdId: null }
            });

            // Delete the household
            await prisma.household.delete({
                where: { id: householdId }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing household member:', error);
        return NextResponse.json(
            { error: 'Failed to remove household member' },
            { status: 500 }
        );
    }
}

