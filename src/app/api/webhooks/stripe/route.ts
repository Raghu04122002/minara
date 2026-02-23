import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { registrationIngest, IngestPayload } from '@/lib/registration-ingest';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/webhooks/stripe
 * 
 * Listens for:
 * - checkout.session.completed → Confirm Order + run registration_ingest
 * - charge.refunded → Update Order + cancel EventParticipations
 */
export async function POST(request: NextRequest) {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    let event;

    try {
        // In test mode without webhook secret, parse directly
        if (process.env.STRIPE_WEBHOOK_SECRET) {
            event = stripe.webhooks.constructEvent(
                body,
                sig!,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } else {
            // Dev mode: parse JSON directly
            event = JSON.parse(body);
        }
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const { orderId, eventId, tierId, institutionId, participants: participantsJson } = session.metadata || {};

                if (!orderId || !eventId) {
                    console.error('Missing metadata in checkout session');
                    break;
                }

                const participants = JSON.parse(participantsJson || '[]');

                // Update Order status + Stripe payment intent
                await prisma.order.update({
                    where: { id: orderId },
                    data: {
                        orderStatus: 'confirmed',
                        stripePaymentIntentId: session.payment_intent,
                    },
                });

                // Run registration_ingest
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

                await registrationIngest(
                    payload,
                    'stripe_checkout',
                    eventId,
                    institutionId,
                    orderId,
                );

                console.log(`✅ Order ${orderId} confirmed and registration processed`);
                break;
            }

            case 'charge.refunded': {
                const charge = event.data.object;
                const paymentIntentId = charge.payment_intent;

                if (!paymentIntentId) break;

                const order = await prisma.order.findFirst({
                    where: { stripePaymentIntentId: paymentIntentId },
                });

                if (!order) {
                    console.error(`No order found for payment intent: ${paymentIntentId}`);
                    break;
                }

                const refundedAmount = charge.amount_refunded / 100;
                const totalCents = Number(order.totalCents);
                const isFullRefund = refundedAmount >= totalCents;

                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        orderStatus: isFullRefund ? 'refunded' : 'partially_refunded',
                        refundedAmount,
                        refundedAt: new Date(),
                        stripeRefundId: charge.refunds?.data?.[0]?.id || null,
                    },
                });

                // Cancel EventParticipations if full refund
                if (isFullRefund) {
                    await prisma.eventParticipation.updateMany({
                        where: { orderId: order.id },
                        data: { status: 'refunded' },
                    });
                }

                console.log(`💰 Refund processed for order ${order.id}: $${refundedAmount}`);
                break;
            }

            default:
                console.log(`Unhandled webhook event: ${event.type}`);
        }
    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
