import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { CalendarDays, Plus, MapPin, Users, Ticket } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

function getEventTypeBadge(type: string) {
    switch (type) {
        case 'ticketed_event': return { label: 'Ticketed', bg: '#dbeafe', color: '#1e40af' };
        case 'family_program': return { label: 'Household Program', bg: '#dcfce7', color: '#166534' };
        case 'recurring_program': return { label: 'Recurring', bg: '#fef9c3', color: '#854d0e' };
        default: return { label: type, bg: '#f3f4f6', color: '#374151' };
    }
}

export default async function OrganizerEventsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/organizer/login');
    }

    const events = await prisma.event.findMany({
        where: {
            organizerId: user.id,
        },
        include: {
            tiers: true,
            _count: { select: { participations: true, orders: true } },
        },
        orderBy: { startDate: 'desc' },
    });

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="heading" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                    <CalendarDays size={28} /> My Events
                </h1>
                <Link
                    href="/organizer/events/new"
                    className="btn"
                    style={{ background: '#0f172a', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 500 }}
                >
                    <Plus size={18} /> Create Event
                </Link>
            </div>

            {events.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b', background: 'white', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' }}>
                    <CalendarDays size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                    <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem', color: '#0f172a', fontWeight: 600 }}>No events yet</p>
                    <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>Create your first event to get started.</p>
                    <Link
                        href="/organizer/events/new"
                        className="btn"
                        style={{ background: '#0f172a', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 500 }}
                    >
                        <Plus size={16} /> Create Event
                    </Link>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>Event</th>
                                <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>Type</th>
                                <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>Date</th>
                                <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e2e8f0', textAlign: 'center', color: '#475569', fontWeight: 600 }}>Registrations</th>
                                <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e2e8f0', textAlign: 'center', color: '#475569', fontWeight: 600 }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((event: any) => {
                                const badge = getEventTypeBadge(event.eventType);
                                const isPast = new Date(event.startDate) < new Date();
                                return (
                                    <tr key={event.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <Link href={`/organizer/events/${event.id}`} style={{ color: '#0f172a', fontWeight: 600, textDecoration: 'none' }}>
                                                {event.title}
                                            </Link>
                                            {event.locationName && (
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                                                    <MapPin size={12} /> {event.locationName}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
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
                                        <td style={{ padding: '1rem 1.5rem', color: isPast ? '#94a3b8' : '#334155' }}>
                                            {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'center', color: '#334155' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}>
                                                <Users size={14} /> {event._count.participations}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                background: event.registrationOpen ? '#dcfce7' : '#f1f5f9',
                                                color: event.registrationOpen ? '#166534' : '#64748b',
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
