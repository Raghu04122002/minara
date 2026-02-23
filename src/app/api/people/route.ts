import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Get people (with optional filters)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const noFamily = searchParams.get('noFamily') === 'true';

        const where = noFamily ? { householdMembers: { none: {} } } : {};

        const people = await prisma.person.findMany({
            where,
            orderBy: { lastName: 'asc' },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                primaryEmail: true
            }
        });

        return NextResponse.json(people);
    } catch (error) {
        console.error('Error fetching people:', error);
        return NextResponse.json(
            { error: 'Failed to fetch people' },
            { status: 500 }
        );
    }
}

// Create a new person
export async function POST(request: NextRequest) {
    try {
        const { firstName, lastName, email, phone, transactionType, description, amount } = await request.json();

        if (!firstName || !lastName) {
            return NextResponse.json(
                { error: 'First name and last name are required' },
                { status: 400 }
            );
        }

        const normalizedEmail = email ? email.trim().toLowerCase() : null;
        const normalizedPhone = phone ? phone.replace(/\D/g, '') : null;

        const person = await prisma.person.create({
            data: {
                institutionId: 'unassigned', // Required by schema
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                primaryEmail: normalizedEmail,
                primaryPhone: normalizedPhone,
                normalizedEmail,
                normalizedPhone,
                createdSource: 'manual_entry'
            }
        });

        // Create transaction if amount is provided
        if (amount && parseFloat(amount) > 0) {
            await prisma.transaction.create({
                data: {
                    personId: person.id,
                    type: transactionType || 'event_ticket',
                    description: description || `Manual ${transactionType === 'donation' ? 'donation' : 'event'} entry`,
                    amount: parseFloat(amount),
                    occurredAt: new Date(),
                    sourceSystem: 'manual_entry'
                }
            });
        }

        return NextResponse.json(person);
    } catch (error) {
        console.error('Error creating person:', error);
        return NextResponse.json(
            { error: 'Failed to create person' },
            { status: 500 }
        );
    }
}

