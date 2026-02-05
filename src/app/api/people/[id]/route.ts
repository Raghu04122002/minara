import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Get person by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const person = await prisma.person.findUnique({
            where: { id },
            include: {
                transactions: true,
                family: true
            }
        });

        if (!person) {
            return NextResponse.json(
                { error: 'Person not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(person);
    } catch (error) {
        console.error('Error fetching person:', error);
        return NextResponse.json(
            { error: 'Failed to fetch person' },
            { status: 500 }
        );
    }
}

// Delete a person
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get the person's family before deletion
        const person = await prisma.person.findUnique({
            where: { id },
            select: { familyId: true }
        });

        const familyId = person?.familyId;

        // First, delete related records in order
        // 1. Delete family member records for this person
        await prisma.familyMember.deleteMany({
            where: { personId: id }
        });

        // 2. Delete transactions for this person
        await prisma.transaction.deleteMany({
            where: { personId: id }
        });

        // 3. Delete the person
        await prisma.person.delete({
            where: { id }
        });

        // 4. Check if family now has less than 2 members and delete if so
        if (familyId) {
            const remainingMembers = await prisma.familyMember.count({
                where: { familyId }
            });

            if (remainingMembers < 2) {
                // Delete all remaining family members
                await prisma.familyMember.deleteMany({
                    where: { familyId }
                });

                // Update any people still pointing to this family
                await prisma.person.updateMany({
                    where: { familyId },
                    data: { familyId: null }
                });

                // Delete family transactions
                await prisma.transaction.updateMany({
                    where: { familyId },
                    data: { familyId: null }
                });

                // Delete the family
                await prisma.family.delete({
                    where: { id: familyId }
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting person:', error);
        return NextResponse.json(
            { error: 'Failed to delete person' },
            { status: 500 }
        );
    }
}

// Update a person
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { firstName, lastName, email, phone } = await request.json();

        const person = await prisma.person.update({
            where: { id },
            data: {
                firstName,
                lastName,
                email: email || null,
                phone: phone || null
            }
        });

        return NextResponse.json(person);
    } catch (error) {
        console.error('Error updating person:', error);
        return NextResponse.json(
            { error: 'Failed to update person' },
            { status: 500 }
        );
    }
}
