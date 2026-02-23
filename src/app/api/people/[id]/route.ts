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
                householdMembers: {
                    include: {
                        household: true
                    }
                }
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

        // Get the person's memberships before deletion
        const memberships = await prisma.householdMember.findMany({
            where: { personId: id },
            select: { householdId: true }
        });

        // First, delete related records in order
        // 1. Delete household member records for this person
        await prisma.householdMember.deleteMany({
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

        // 4. Check if households now have less than 2 members and delete if so
        for (const membership of memberships) {
            const householdId = membership.householdId;
            const remainingMembers = await prisma.householdMember.count({
                where: { householdId }
            });

            if (remainingMembers < 2) {
                // Delete all remaining household members
                await prisma.householdMember.deleteMany({
                    where: { householdId }
                });

                // Delete household transactions
                await prisma.transaction.updateMany({
                    where: { householdId },
                    data: { householdId: null }
                });

                // Delete the household
                await prisma.household.delete({
                    where: { id: householdId }
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
                primaryEmail: email || null,
                primaryPhone: phone || null
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
