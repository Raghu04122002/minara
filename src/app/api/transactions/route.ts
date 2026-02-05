import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Create a new transaction
export async function POST(request: NextRequest) {
    try {
        const { personId, type, description, amount, occurredAt } = await request.json();

        if (!personId || !type || !amount) {
            return NextResponse.json(
                { error: 'personId, type, and amount are required' },
                { status: 400 }
            );
        }

        const transaction = await prisma.transaction.create({
            data: {
                personId,
                type,
                description: description || '',
                amount: parseFloat(amount),
                occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
                sourceSystem: 'manual_entry'
            }
        });

        return NextResponse.json(transaction);
    } catch (error) {
        console.error('Error creating transaction:', error);
        return NextResponse.json(
            { error: 'Failed to create transaction' },
            { status: 500 }
        );
    }
}
