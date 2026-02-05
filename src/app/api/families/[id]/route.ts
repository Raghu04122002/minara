import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Get family by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const family = await prisma.family.findUnique({
            where: { id },
            include: {
                members: {
                    include: { person: true }
                }
            }
        });

        if (!family) {
            return NextResponse.json(
                { error: 'Family not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(family);
    } catch (error) {
        console.error('Error fetching family:', error);
        return NextResponse.json(
            { error: 'Failed to fetch family' },
            { status: 500 }
        );
    }
}

// Delete a family
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. Delete all family member records
        await prisma.familyMember.deleteMany({
            where: { familyId: id }
        });

        // 2. Update people to remove family reference
        await prisma.person.updateMany({
            where: { familyId: id },
            data: { familyId: null }
        });

        // 3. Update transactions to remove family reference
        await prisma.transaction.updateMany({
            where: { familyId: id },
            data: { familyId: null }
        });

        // 4. Delete the family
        await prisma.family.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting family:', error);
        return NextResponse.json(
            { error: 'Failed to delete family' },
            { status: 500 }
        );
    }
}
