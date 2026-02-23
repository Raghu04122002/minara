import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Create a new household
export async function POST(request: NextRequest) {
    try {
        const { name, initialMemberPersonId } = await request.json();

        if (!name) {
            return NextResponse.json(
                { error: 'Household name is required' },
                { status: 400 }
            );
        }

        const household = await prisma.household.create({
            data: {
                householdName: name,
                confidenceScore: 100,
                confidenceReason: 'manually matched'
            }
        });

        // If an initial member is provided, add them
        if (initialMemberPersonId) {
            await prisma.householdMember.create({
                data: {
                    householdId: household.id,
                    personId: initialMemberPersonId,
                    roleInHousehold: 'HEAD',
                    groupedBy: 'MANUAL',
                    manualAssignment: true
                }
            });
        }

        return NextResponse.json(household);
    } catch (error) {
        console.error('Error creating household:', error);
        return NextResponse.json(
            { error: 'Failed to create household' },
            { status: 500 }
        );
    }
}

// Get all households
export async function GET() {
    try {
        const households = await prisma.household.findMany({
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
            orderBy: { householdName: 'asc' }
        });

        return NextResponse.json(households);
    } catch (error) {
        console.error('Error fetching households:', error);
        return NextResponse.json(
            { error: 'Failed to fetch households' },
            { status: 500 }
        );
    }
}
