import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin, CalendarDays, Users, Ticket, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const event = await prisma.event.findUnique({
        where: { id },
        include: {
            tiers: { orderBy: { sortOrder: 'asc' } },
            participations: {
                include: { person: true, ticketTier: true },
                orderBy: { createdAt: 'desc' },
                take: 50,
            },
            _count: { select: { participations: true, orders: true, submissions: true } },
        },
    });

    if (!event) notFound();

    const isPast = new Date(event.startDate) < new Date();

    return (
        <div className="container">
            <Link href="/admin/events" style={{ display: 'inline-flex', alignItems: 'center', color: '#6b7280', textDecoration: 'none', marginBottom: '1rem', fontSize: '0.875rem' }}>
                <ArrowLeft size={16} style={{ marginRight: '0.25rem' }} /> Back to Events
            </Link>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 className="heading" style={{ margin: '0 0 0.5rem' }}>{event.title}</h1>
                    <div style={{ display: 'flex', gap: '1rem', color: '#6b7280', fontSize: '0.875rem', flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CalendarDays size={14} />
                            {new Date(event.startDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            {' at '}
                            {new Date(event.startDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                        {event.locationName && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                <MapPin size={14} /> {event.locationName}
                            </span>
                        )}
                    </div>
                </div>
                <Link
                    href={`/e/${event.slug}`}
                    target="_blank"
                    className="btn"
                    style={{ background: '#f3f4f6', color: '#374151', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}
                >
                    <ExternalLink size={14} /> View Public Page
                </Link>
            </div>

            {event.description && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <p style={{ margin: 0, color: '#374151', whiteSpace: 'pre-wrap' }}>{event.description}</p>
                </div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{event._count.participations}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Registrations</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{event._count.orders}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Orders</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{event._count.submissions}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Submissions</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: event.registrationOpen ? '#16a34a' : '#dc2626' }}>
                        {event.registrationOpen ? 'Open' : 'Closed'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Registration</div>
                </div>
            </div>

            {/* Ticket Tiers */}
            {event.tiers.length > 0 && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                        <Ticket size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                        Ticket Tiers
                    </h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ padding: '0.5rem 0' }}>Tier</th>
                                <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Price</th>
                                <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Sold</th>
                                <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Available</th>
                            </tr>
                        </thead>
                        <tbody>
                            {event.tiers.map((tier: any) => (
                                <tr key={tier.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '0.5rem 0', fontWeight: 500 }}>{tier.name}</td>
                                    <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>${Number(tier.price).toFixed(2)}</td>
                                    <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>{tier.quantitySold}</td>
                                    <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>
                                        {tier.quantity ? `${tier.quantity - tier.quantitySold}` : '∞'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Participants */}
            <div className="card">
                <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                    <Users size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                    Recent Registrations
                </h2>
                {event.participations.length === 0 ? (
                    <p style={{ color: '#9ca3af', textAlign: 'center', padding: '1.5rem' }}>No registrations yet.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ padding: '0.5rem 0' }}>Name</th>
                                <th style={{ padding: '0.5rem 0' }}>Email</th>
                                <th style={{ padding: '0.5rem 0' }}>Tier</th>
                                <th style={{ padding: '0.5rem 0' }}>Status</th>
                                <th style={{ padding: '0.5rem 0' }}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {event.participations.map((p: any) => (
                                <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '0.5rem 0' }}>
                                        <Link href={`/admin/people/${p.personId}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                                            {p.person.firstName} {p.person.lastName}
                                        </Link>
                                    </td>
                                    <td style={{ padding: '0.5rem 0', color: '#6b7280' }}>{p.person.primaryEmail || '—'}</td>
                                    <td style={{ padding: '0.5rem 0' }}>{p.ticketTier?.name || '—'}</td>
                                    <td style={{ padding: '0.5rem 0' }}>
                                        <span style={{
                                            padding: '0.125rem 0.5rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            background: p.status === 'checked_in' ? '#dcfce7' : p.status === 'active' ? '#dbeafe' : '#fee2e2',
                                            color: p.status === 'checked_in' ? '#166534' : p.status === 'active' ? '#1e40af' : '#991b1b',
                                        }}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.5rem 0', color: '#6b7280' }}>
                                        {new Date(p.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
