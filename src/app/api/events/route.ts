import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/events — list all events
export async function GET() {
    const events = await prisma.event.findMany({
        include: {
            institution: true,
            tiers: true,
            _count: { select: { participations: true, orders: true } },
        },
        orderBy: { startDate: 'desc' },
    });
    return NextResponse.json(events);
}

// POST /api/events — create a new event
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, slug, description, eventType, startDate, endDate, locationName, locationType, maxCapacity, tiers } = body;

        if (!title || !slug || !eventType || !startDate || !locationType) {
            return NextResponse.json(
                { error: 'Missing required fields: title, slug, eventType, startDate, locationType' },
                { status: 400 }
            );
        }

        // Get or create default institution
        let institution = await prisma.institution.findFirst();
        if (!institution) {
            institution = await prisma.institution.create({
                data: { name: 'Minara', slug: 'minara' },
            });
        }

        // Check slug uniqueness
        const existing = await prisma.event.findUnique({ where: { slug } });
        if (existing) {
            return NextResponse.json(
                { error: 'An event with this slug already exists' },
                { status: 409 }
            );
        }

        const event = await prisma.event.create({
            data: {
                title,
                slug,
                description: description || null,
                eventType,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                locationType,
                locationName: locationName || null,
                maxCapacity: maxCapacity ? parseInt(maxCapacity) : null,
                institutionId: institution.id,
                tiers: tiers && tiers.length > 0 ? {
                    create: tiers.map((tier: { name: string; price: number; quantity?: number; description?: string }, i: number) => ({
                        name: tier.name,
                        priceCents: Math.round(tier.price * 100),
                        capacity: tier.quantity || null,
                        description: tier.description || null,
                        sortOrder: i,
                    })),
                } : undefined,
            },
            include: { tiers: true, institution: true },
        });

        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        console.error('Error creating event:', error);
        return NextResponse.json(
            { error: 'Failed to create event' },
            { status: 500 }
        );
    }
}
