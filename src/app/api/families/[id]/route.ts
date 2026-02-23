import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Get household by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const household = await prisma.household.findUnique({
            where: { id },
            include: {
                members: {
                    include: { person: true }
                }
            }
        });

        if (!household) {
            return NextResponse.json(
                { error: 'Household not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(household);
    } catch (error) {
        console.error('Error fetching household:', error);
        return NextResponse.json(
            { error: 'Failed to fetch household' },
            { status: 500 }
        );
    }
}

// Delete a household
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. Delete all household member records
        await prisma.householdMember.deleteMany({
            where: { householdId: id }
        });

        // 2. Update transactions to remove household reference
        await prisma.transaction.updateMany({
            where: { householdId: id },
            data: { householdId: null }
        });

        // 4. Delete the household
        await prisma.household.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting household:', error);
        return NextResponse.json(
            { error: 'Failed to delete household' },
            { status: 500 }
        );
    }
}
