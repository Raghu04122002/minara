import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { CalendarDays, MapPin, Ticket } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PublicEventsPage() {
    const events = await prisma.event.findMany({
        where: { registrationOpen: true },
        include: {
            tiers: { where: { isActive: true }, orderBy: { priceCents: 'asc' } },
            _count: { select: { participations: true } },
        },
        orderBy: { startDate: 'asc' },
    });

    const upcomingEvents = events.filter((e: any) => new Date(e.startDate) >= new Date());
    const pastEvents = events.filter((e: any) => new Date(e.startDate) < new Date());

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Upcoming Events</h1>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Browse and register for our upcoming events.</p>

            {upcomingEvents.length === 0 && pastEvents.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#9ca3af' }}>
                    <CalendarDays size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                    <p style={{ fontSize: '1.125rem' }}>No events published yet. Check back soon!</p>
                </div>
            )}

            {upcomingEvents.length > 0 && (
                <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '3rem' }}>
                    {upcomingEvents.map((event: any) => {
                        const lowestPrice = event.tiers.length > 0
                            ? Math.min(...event.tiers.map((t: any) => Number(t.price)))
                            : null;

                        return (
                            <Link
                                key={event.id}
                                href={`/e/${event.slug}`}
                                style={{
                                    display: 'block',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '12px',
                                    padding: '1.5rem',
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    transition: 'box-shadow 0.15s, border-color 0.15s',
                                    background: '#fff',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1 }}>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.5rem', color: '#111827' }}>
                                            {event.title}
                                        </h2>
                                        <div style={{ display: 'flex', gap: '1rem', color: '#6b7280', fontSize: '0.875rem', flexWrap: 'wrap' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <CalendarDays size={14} />
                                                {new Date(event.startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                                                {' at '}
                                                {new Date(event.startDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                            </span>
                                            {event.locationName && (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <MapPin size={14} /> {event.locationName}
                                                </span>
                                            )}
                                        </div>
                                        {event.description && (
                                            <p style={{ margin: '0.75rem 0 0', color: '#4b5563', fontSize: '0.875rem', lineHeight: 1.5 }}>
                                                {event.description.length > 150 ? event.description.slice(0, 150) + '...' : event.description}
                                            </p>
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        {event.eventType === 'ticketed_event' && lowestPrice !== null ? (
                                            <div>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
                                                    {lowestPrice === 0 ? 'Free' : `$${lowestPrice.toFixed(2)}`}
                                                </div>
                                                {event.tiers.length > 1 && (
                                                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>starting from</div>
                                                )}
                                            </div>
                                        ) : (
                                            <span style={{
                                                padding: '0.375rem 1rem',
                                                background: '#dcfce7',
                                                color: '#166534',
                                                borderRadius: '9999px',
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                            }}>
                                                Free
                                            </span>
                                        )}
                                        <div style={{
                                            marginTop: '0.75rem',
                                            padding: '0.5rem 1.25rem',
                                            background: '#2563eb',
                                            color: 'white',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            textAlign: 'center',
                                        }}>
                                            Register →
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {pastEvents.length > 0 && (
                <>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#9ca3af', marginBottom: '1rem' }}>Past Events</h2>
                    <div style={{ display: 'grid', gap: '1rem', opacity: 0.6 }}>
                        {pastEvents.map((event: any) => (
                            <div key={event.id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', background: '#fafafa' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.25rem' }}>{event.title}</h3>
                                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                                    {new Date(event.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
