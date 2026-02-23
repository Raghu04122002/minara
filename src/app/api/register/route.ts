import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { registrationIngest, IngestPayload } from '@/lib/registration-ingest';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/register
 * 
 * For FREE events: directly runs registration_ingest()
 * For TICKETED events: creates Stripe Checkout session + pending Order
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { eventId, participants, tierId } = body;

        if (!eventId || !participants || participants.length === 0) {
            return NextResponse.json({ error: 'Missing eventId or participants' }, { status: 400 });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { tiers: true, institution: true },
        });

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        if (!event.registrationOpen) {
            return NextResponse.json({ error: 'Registration is closed' }, { status: 400 });
        }

        const primaryParticipant = participants.find((p: any) => p.role === 'primary') || participants[0];

        // ─── Ticketed Event → Stripe Checkout ───
        if (event.eventType === 'ticketed_event' && tierId) {
            const tier = event.tiers.find((t: any) => t.id === tierId);
            if (!tier) {
                return NextResponse.json({ error: 'Ticket tier not found' }, { status: 404 });
            }

            const unitPriceCents = Number(tier.priceCents);
            const totalCents = unitPriceCents * participants.length;
            const quantity = participants.length;

            // Create pending Order
            const order = await prisma.order.create({
                data: {
                    eventId,
                    institutionId: event.institutionId,
                    ticketTierId: tier.id,
                    quantity,
                    subtotalCents: totalCents,
                    totalCents,
                    orderStatus: 'pending',
                    purchaserEmail: primaryParticipant.email || '',
                    purchaserName: `${primaryParticipant.firstName} ${primaryParticipant.lastName}`.trim(),
                    purchaserPhone: primaryParticipant.phone || null,
                    currency: tier.currency,
                },
            });

            // Create Stripe Checkout Session
            const session = await stripe.checkout.sessions.create({
                mode: 'payment',
                customer_email: primaryParticipant.email || undefined,
                line_items: [{
                    price_data: {
                        currency: tier.currency,
                        product_data: {
                            name: `${event.title} — ${tier.name}`,
                            description: tier.description || undefined,
                        },
                        unit_amount: unitPriceCents,
                    },
                    quantity: participants.length,
                }],
                metadata: {
                    orderId: order.id,
                    eventId: event.id,
                    tierId: tier.id,
                    institutionId: event.institutionId,
                    participants: JSON.stringify(participants),
                },
                success_url: `${process.env.NEXT_PUBLIC_APP_URL}/e/${event.slug}/confirmation?order=${order.id}`,
                cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/e/${event.slug}/register?cancelled=true`,
            });

            // Update Order with Stripe session
            await prisma.order.update({
                where: { id: order.id },
                data: { stripeSessionId: session.id },
            });

            return NextResponse.json({
                type: 'stripe_checkout',
                checkoutUrl: session.url,
                orderId: order.id,
            });
        }

        // ─── Free Event → Direct Registration ───
        const payload: IngestPayload = {
            participants: participants.map((p: any) => ({
                firstName: p.firstName,
                lastName: p.lastName,
                email: p.email || undefined,
                phone: p.phone || undefined,
                dob: p.dob || undefined,
                role: p.role || 'guest',
                gender: p.gender || undefined,
                ticketTierId: tierId || undefined,
            })),
        };

        const result = await registrationIngest(
            payload,
            'public_form',
            eventId,
            event.institutionId,
        );

        return NextResponse.json({
            type: 'free_registration',
            submissionId: result.submissionId,
            status: result.status,
            participations: result.participations,
            errors: result.errors,
        }, { status: result.status === 'error' ? 500 : 201 });

    } catch (error) {
        console.error('Registration error:', error);
        const message = error instanceof Error ? error.message : 'Registration failed';
        const stack = error instanceof Error ? error.stack : undefined;
        if (stack) console.error('Stack:', stack);
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
