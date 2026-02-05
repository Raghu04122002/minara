import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Create a new family
export async function POST(request: NextRequest) {
    try {
        const { name, initialMemberPersonId } = await request.json();

        if (!name) {
            return NextResponse.json(
                { error: 'Family name is required' },
                { status: 400 }
            );
        }

        const family = await prisma.family.create({
            data: {
                name,
                confidenceScore: 100,
                confidenceReason: 'manually matched'
            }
        });

        // If an initial member is provided, add them
        if (initialMemberPersonId) {
            await prisma.familyMember.create({
                data: {
                    familyId: family.id,
                    personId: initialMemberPersonId,
                    role: 'HEAD',
                    groupedBy: 'MANUAL',
                    manualAssignment: true
                }
            });

            await prisma.person.update({
                where: { id: initialMemberPersonId },
                data: { familyId: family.id }
            });
        }

        return NextResponse.json(family);
    } catch (error) {
        console.error('Error creating family:', error);
        return NextResponse.json(
            { error: 'Failed to create family' },
            { status: 500 }
        );
    }
}

// Get all families
export async function GET() {
    try {
        const families = await prisma.family.findMany({
            include: {
                members: {
                    include: {
                        person: true
                    }
                },
                _count: {
                    select: { transactions: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(families);
    } catch (error) {
        console.error('Error fetching families:', error);
        return NextResponse.json(
            { error: 'Failed to fetch families' },
            { status: 500 }
        );
    }
}
