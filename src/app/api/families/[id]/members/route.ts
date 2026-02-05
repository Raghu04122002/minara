import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Add a person to a family
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: familyId } = await params;
        const { personId, role = 'UNKNOWN' } = await request.json();

        if (!personId) {
            return NextResponse.json(
                { error: 'personId is required' },
                { status: 400 }
            );
        }

        // Check if family exists
        const family = await prisma.family.findUnique({
            where: { id: familyId }
        });

        if (!family) {
            return NextResponse.json(
                { error: 'Family not found' },
                { status: 404 }
            );
        }

        // Create or update family member (manual assignment)
        const member = await prisma.familyMember.upsert({
            where: {
                familyId_personId: { familyId, personId }
            },
            update: {
                role,
                groupedBy: 'MANUAL',
                manualAssignment: true
            },
            create: {
                familyId,
                personId,
                role,
                groupedBy: 'MANUAL',
                manualAssignment: true
            }
        });

        // Also update the Person's familyId
        await prisma.person.update({
            where: { id: personId },
            data: { familyId }
        });

        return NextResponse.json(member);
    } catch (error) {
        console.error('Error adding family member:', error);
        return NextResponse.json(
            { error: 'Failed to add family member' },
            { status: 500 }
        );
    }
}

// Remove a person from a family
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: familyId } = await params;
        const { searchParams } = new URL(request.url);
        const personId = searchParams.get('personId');

        if (!personId) {
            return NextResponse.json(
                { error: 'personId query param is required' },
                { status: 400 }
            );
        }

        // Remove family member
        await prisma.familyMember.deleteMany({
            where: { familyId, personId }
        });

        // Clear person's familyId
        await prisma.person.update({
            where: { id: personId },
            data: { familyId: null }
        });

        // Check remaining members and delete family if less than 2
        const remainingCount = await prisma.familyMember.count({
            where: { familyId }
        });

        if (remainingCount < 2) {
            // Delete all remaining family members
            await prisma.familyMember.deleteMany({
                where: { familyId }
            });

            // Update any people still pointing to this family
            await prisma.person.updateMany({
                where: { familyId },
                data: { familyId: null }
            });

            // Update transactions to remove family reference
            await prisma.transaction.updateMany({
                where: { familyId },
                data: { familyId: null }
            });

            // Delete the family
            await prisma.family.delete({
                where: { id: familyId }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing family member:', error);
        return NextResponse.json(
            { error: 'Failed to remove family member' },
            { status: 500 }
        );
    }
}

