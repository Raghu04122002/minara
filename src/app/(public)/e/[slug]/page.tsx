import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, MapPin, Users, ArrowLeft, Ticket } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PublicEventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const event = await prisma.event.findUnique({
        where: { slug },
        include: {
            tiers: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
            _count: { select: { participations: true } },
        },
    });

    if (!event) notFound();

    const isPast = new Date(event.startDate) < new Date();
    const spotsLeft = event.maxCapacity ? event.maxCapacity - event._count.participations : null;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
            <Link href="/org/default/events" style={{ display: 'inline-flex', alignItems: 'center', color: '#6b7280', textDecoration: 'none', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                <ArrowLeft size={16} style={{ marginRight: '0.25rem' }} /> All Events
            </Link>

            <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 1rem', color: '#111827' }}>
                {event.title}
            </h1>

            {/* Date & Location */}
            <div style={{ display: 'flex', gap: '1.5rem', color: '#4b5563', fontSize: '0.95rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                    <CalendarDays size={18} />
                    {new Date(event.startDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    {' at '}
                    {new Date(event.startDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    {event.endDate && (
                        <> — {new Date(event.endDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</>
                    )}
                </span>
                {event.locationName && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                        <MapPin size={18} /> {event.locationName}
                    </span>
                )}
            </div>

            {/* Capacity */}
            {spotsLeft !== null && (
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                    padding: '0.5rem 1rem', background: spotsLeft > 10 ? '#f0fdf4' : '#fef2f2',
                    color: spotsLeft > 10 ? '#166534' : '#dc2626',
                    borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.5rem',
                }}>
                    <Users size={16} />
                    {spotsLeft > 0 ? `${spotsLeft} spots remaining` : 'Sold out'}
                </div>
            )}

            {/* Description */}
            {event.description && (
                <div style={{
                    padding: '1.5rem',
                    background: '#f9fafb',
                    borderRadius: '12px',
                    marginBottom: '2rem',
                    lineHeight: 1.7,
                    color: '#374151',
                    whiteSpace: 'pre-wrap',
                }}>
                    {event.description}
                </div>
            )}

            {/* Ticket Tiers */}
            {event.tiers.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Ticket size={20} /> Tickets
                    </h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {event.tiers.map((tier: any) => {
                            const available = tier.quantity ? tier.quantity - tier.quantitySold : null;
                            const soldOut = available !== null && available <= 0;
                            return (
                                <div key={tier.id} style={{
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '10px',
                                    padding: '1.25rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    opacity: soldOut ? 0.5 : 1,
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '1rem' }}>{tier.name}</div>
                                        {tier.description && <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.125rem' }}>{tier.description}</div>}
                                        {available !== null && !soldOut && (
                                            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>{available} left</div>
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                            {Number(tier.price) === 0 ? 'Free' : `$${Number(tier.price).toFixed(2)}`}
                                        </div>
                                        {soldOut && <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>Sold Out</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Register Button */}
            {!isPast && event.registrationOpen && (spotsLeft === null || spotsLeft > 0) ? (
                <Link
                    href={`/e/${event.slug}/register`}
                    style={{
                        display: 'block',
                        textAlign: 'center',
                        padding: '1rem',
                        background: '#2563eb',
                        color: 'white',
                        borderRadius: '10px',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                    }}
                >
                    Register Now
                </Link>
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '1rem',
                    background: '#f3f4f6',
                    color: '#6b7280',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    fontWeight: 600,
                }}>
                    {isPast ? 'This event has ended' : spotsLeft === 0 ? 'Sold out' : 'Registration closed'}
                </div>
            )}
        </div>
    );
}
