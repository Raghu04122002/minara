import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const order = await prisma.order.findUnique({ where: { id } });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (!order.stripePaymentIntentId) {
            return NextResponse.json({ error: 'No payment intent to refund' }, { status: 400 });
        }

        if (order.status === 'refunded') {
            return NextResponse.json({ error: 'Already refunded' }, { status: 400 });
        }

        // Create Stripe refund
        await stripe.refunds.create({
            payment_intent: order.stripePaymentIntentId,
        });

        // Webhook will handle status update, but update locally too for immediate UI
        await prisma.order.update({
            where: { id },
            data: {
                status: 'refunded',
                refundedAmount: order.totalCents,
                refundedAt: new Date(),
            },
        });

        // Cancel participations
        await prisma.eventParticipation.updateMany({
            where: { orderId: id },
            data: { status: 'refunded' },
        });

    } catch (error) {
        console.error('Refund error:', error);
    }

    // Redirect back to orders page
    return NextResponse.redirect(new URL('/admin/orders', request.url));
}
