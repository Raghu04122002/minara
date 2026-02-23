import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/events/[id]
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const event = await prisma.event.findUnique({
        where: { id },
        include: {
            institution: true,
            tiers: { orderBy: { sortOrder: 'asc' } },
            orders: { orderBy: { createdAt: 'desc' } },
            participations: {
                include: { person: true, ticketTier: true },
                orderBy: { createdAt: 'desc' },
            },
            _count: { select: { participations: true, orders: true, submissions: true } },
        },
    });

    if (!event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(event);
}

// PUT /api/events/[id]
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const { title, description, eventType, startDate, endDate, locationType, locationName, maxCapacity, registrationOpen } = body;

        const event = await prisma.event.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(description !== undefined && { description }),
                ...(eventType && { eventType }),
                ...(locationType && { locationType }),
                ...(startDate && { startDate: new Date(startDate) }),
                ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
                ...(locationName !== undefined && { locationName }),
                ...(maxCapacity !== undefined && { maxCapacity: maxCapacity ? parseInt(maxCapacity) : null }),
                ...(registrationOpen !== undefined && { registrationOpen }),
            },
            include: { tiers: true },
        });

        return NextResponse.json(event);
    } catch (error) {
        console.error('Error updating event:', error);
        return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }
}

// DELETE /api/events/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await prisma.event.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting event:', error);
        return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }
}
