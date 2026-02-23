import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ShoppingCart, DollarSign, RefreshCw } from 'lucide-react';

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

export default async function AdminOrdersPage() {
    const orders = await prisma.order.findMany({
        include: {
            event: true,
            _count: { select: { participations: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
    });

    const totalRevenue = orders
        .filter((o: any) => o.status === 'confirmed')
        .reduce((sum: number, o: any) => sum + Number(o.totalCents), 0);

    const totalRefunded = orders.reduce((sum: number, o: any) => sum + Number(o.refundedAmount || 0), 0);

    return (
        <div className="container">
            <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingCart size={28} /> Orders
            </h1>

            {/* Revenue Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#16a34a' }}>${totalRevenue.toFixed(2)}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Total Revenue</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#dc2626' }}>${totalRefunded.toFixed(2)}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Total Refunded</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{orders.length}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Total Orders</div>
                </div>
            </div>

            {orders.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                    <p>No orders yet.</p>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb' }}>Customer</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb' }}>Event</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>Amount</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Tickets</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Status</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order: any) => {
                                const badge = statusBadge(order.status);
                                return (
                                    <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <div style={{ fontWeight: 500 }}>{order.purchaserName || '—'}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{order.purchaserEmail}</div>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <Link href={`/admin/events/${order.eventId}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                                                {order.event.title}
                                            </Link>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                                            ${Number(order.totalCents).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{order._count.participations}</td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '0.25rem 0.625rem', borderRadius: '9999px',
                                                fontSize: '0.7rem', fontWeight: 600,
                                                background: badge.bg, color: badge.color,
                                            }}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.8rem' }}>
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            {order.status === 'confirmed' && order.stripePaymentIntentId && (
                                                <form action={`/api/orders/${order.id}/refund`} method="POST">
                                                    <button type="submit" style={{
                                                        padding: '0.25rem 0.5rem', fontSize: '0.7rem',
                                                        background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca',
                                                        borderRadius: '4px', cursor: 'pointer',
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
