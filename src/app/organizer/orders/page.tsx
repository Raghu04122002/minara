import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

function statusBadge(status: string) {
    const map: Record<string, { bg: string; color: string }> = {
        confirmed: { bg: '#dcfce7', color: '#166534' },
        pending: { bg: '#fef9c3', color: '#854d0e' },
        refunded: { bg: '#fee2e2', color: '#991b1b' },
        partially_refunded: { bg: '#fed7aa', color: '#9a3412' },
    };
    return map[status] || { bg: '#f3f4f6', color: '#374151' };
}

export default async function OrganizerOrdersPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/organizer/login');
    }

    const orders = await prisma.order.findMany({
        where: {
            event: {
                organizerId: user.id
            }
        },
        include: {
            event: true,
            _count: { select: { participations: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
    });

    const totalRevenue = orders
        .filter((o: any) => o.orderStatus === 'confirmed')
        .reduce((sum: number, o: any) => sum + Number(o.totalCents), 0);

    const totalRefunded = orders.reduce((sum: number, o: any) => sum + Number(o.refundedAmount || 0), 0);

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                <ShoppingCart size={28} /> Orders
            </h1>

            {/* Revenue Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ textAlign: 'center', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>${(totalRevenue / 100).toFixed(2)}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Revenue</div>
                </div>
                <div className="card" style={{ textAlign: 'center', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ef4444' }}>${(totalRefunded / 100).toFixed(2)}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Refunded</div>
                </div>
                <div className="card" style={{ textAlign: 'center', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>{orders.length}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Orders</div>
                </div>
            </div>

            {orders.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                    <p>No orders yet.</p>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>Customer</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>Event</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#475569', fontWeight: 600 }}>Amount</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', textAlign: 'center', color: '#475569', fontWeight: 600 }}>Tickets</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', textAlign: 'center', color: '#475569', fontWeight: 600 }}>Status</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>Date</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order: any) => {
                                const badge = statusBadge(order.orderStatus);
                                return (
                                    <tr key={order.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '1rem', color: '#0f172a' }}>
                                            <div style={{ fontWeight: 600 }}>{order.purchaserName || '—'}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{order.purchaserEmail}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <Link href={`/organizer/events/${order.eventId}`} style={{ color: '#0f172a', fontWeight: 500, textDecoration: 'none' }}>
                                                {order.event.title}
                                            </Link>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                                            ${Number(order.totalCents / 100).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', color: '#334155' }}>{order._count.participations}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '0.25rem 0.625rem', borderRadius: '9999px',
                                                fontSize: '0.7rem', fontWeight: 600,
                                                background: badge.bg, color: badge.color,
                                            }}>
                                                {order.orderStatus}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.8rem' }}>
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {/* Note: In a real system, you might want to prevent organizers from refunding, or allow it. I will keep it for now. */}
                                            {order.orderStatus === 'confirmed' && order.stripePaymentIntentId && (
                                                <form action={`/api/orders/${order.id}/refund`} method="POST">
                                                    <button type="submit" style={{
                                                        padding: '0.25rem 0.5rem', fontSize: '0.7rem',
                                                        background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca',
                                                        borderRadius: '4px', cursor: 'pointer', fontWeight: 500
                                                    }}>
                                                        Refund
                                                    </button>
                                                </form>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
