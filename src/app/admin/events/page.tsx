import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { CalendarDays, Plus, MapPin, Users, Ticket } from 'lucide-react';

export const dynamic = 'force-dynamic';

function getEventTypeBadge(type: string) {
    switch (type) {
        case 'ticketed_event': return { label: 'Ticketed', bg: '#dbeafe', color: '#1e40af' };
        case 'family_program': return { label: 'Household Program', bg: '#dcfce7', color: '#166534' };
        case 'recurring_program': return { label: 'Recurring', bg: '#fef9c3', color: '#854d0e' };
        default: return { label: type, bg: '#f3f4f6', color: '#374151' };
    }
}

export default async function AdminEventsPage() {
    const events = await prisma.event.findMany({
        include: {
            tiers: true,
            _count: { select: { participations: true, orders: true } },
        },
        orderBy: { startDate: 'desc' },
    });

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="heading" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CalendarDays size={28} /> Events
                </h1>
                <Link
                    href="/admin/events/new"
                    className="btn"
                    style={{ background: '#22c55e', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={18} /> Create Event
                </Link>
            </div>

            {events.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                    <CalendarDays size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                    <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No events yet</p>
                    <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>Create your first event to get started.</p>
                    <Link
                        href="/admin/events/new"
                        className="btn"
                        style={{ background: '#2563eb', color: 'white' }}
                    >
                        <Plus size={16} /> Create Event
                    </Link>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>Event</th>
                                <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>Type</th>
                                <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                                <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Registrations</th>
                                <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((event: any) => {
                                const badge = getEventTypeBadge(event.eventType);
                                const isPast = new Date(event.startDate) < new Date();
                                return (
                                    <tr key={event.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '0.75rem 1.5rem' }}>
                                            <Link href={`/admin/events/${event.id}`} style={{ color: '#2563eb', fontWeight: 500, textDecoration: 'none' }}>
                                                {event.title}
                                            </Link>
                                            {event.locationName && (
                                                <div style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.125rem' }}>
                                                    <MapPin size={12} /> {event.locationName}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem 1.5rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: badge.bg,
                                                color: badge.color,
                                            }}>
                                                {badge.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem 1.5rem', color: isPast ? '#9ca3af' : '#111827' }}>
                                            {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td style={{ padding: '0.75rem 1.5rem', textAlign: 'center' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Users size={14} /> {event._count.participations}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem 1.5rem', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                background: event.registrationOpen ? '#dcfce7' : '#fee2e2',
                                                color: event.registrationOpen ? '#166534' : '#991b1b',
                                            }}>
                                                {event.registrationOpen ? 'Open' : 'Closed'}
                                            </span>
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
