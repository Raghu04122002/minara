import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, MapPin, CalendarDays, Users, Ticket, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function OrganizerEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/organizer/login');
    }

    // Explicitly scope the query by the organizer's user ID
    const event = await prisma.event.findUnique({
        where: { id, organizerId: user.id },
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

    // Not found (or not owned by this organizer)
    if (!event) notFound();

    const isPast = new Date(event.startDate) < new Date();

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <Link href="/organizer/events" style={{ display: 'inline-flex', alignItems: 'center', color: '#64748b', textDecoration: 'none', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 500 }}>
                <ArrowLeft size={16} style={{ marginRight: '0.25rem' }} /> Back to Events
            </Link>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 className="heading" style={{ margin: '0 0 0.5rem', color: '#0f172a' }}>{event.title}</h1>
                    <div style={{ display: 'flex', gap: '1rem', color: '#475569', fontSize: '0.875rem', flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontWeight: 500 }}>
                            <CalendarDays size={14} />
                            {new Date(event.startDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            {' at '}
                            {new Date(event.startDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                        {event.locationName && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontWeight: 500 }}>
                                <MapPin size={14} /> {event.locationName}
                            </span>
                        )}
                    </div>
                </div>
                <Link
                    href={`/e/${event.slug}`}
                    target="_blank"
                    className="btn"
                    style={{ background: '#f8fafc', color: '#0f172a', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', border: '1px solid #e2e8f0', fontWeight: 600 }}
                >
                    <ExternalLink size={14} /> View Public Page
                </Link>
            </div>

            {event.description && (
                <div className="card" style={{ marginBottom: '1.5rem', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                    <p style={{ margin: 0, color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{event.description}</p>
                </div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ textAlign: 'center', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                    <div style={{ fontSize: '2.25rem', fontWeight: 700, color: '#0f172a' }}>{event._count.participations}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registrations</div>
                </div>
                <div className="card" style={{ textAlign: 'center', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                    <div style={{ fontSize: '2.25rem', fontWeight: 700, color: '#0f172a' }}>{event._count.orders}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Orders</div>
                </div>
                <div className="card" style={{ textAlign: 'center', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                    <div style={{ fontSize: '2.25rem', fontWeight: 700, color: '#0f172a' }}>{event._count.submissions}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Submissions</div>
                </div>
                <div className="card" style={{ textAlign: 'center', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                    <div style={{ fontSize: '2.25rem', fontWeight: 700, color: event.registrationOpen ? '#10b981' : '#ef4444' }}>
                        {event.registrationOpen ? 'Open' : 'Closed'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registration</div>
                </div>
            </div>

            {/* Ticket Tiers */}
            {event.tiers.length > 0 && (
                <div className="card" style={{ marginBottom: '1.5rem', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                        <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Ticket size={18} /> Ticket Tiers
                        </h2>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', background: '#f8fafc' }}>
                                <th style={{ padding: '0.75rem 1.5rem', color: '#475569', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Tier</th>
                                <th style={{ padding: '0.75rem 1.5rem', color: '#475569', fontWeight: 600, borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Price</th>
                                <th style={{ padding: '0.75rem 1.5rem', color: '#475569', fontWeight: 600, borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Sold</th>
                                <th style={{ padding: '0.75rem 1.5rem', color: '#475569', fontWeight: 600, borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Available</th>
                            </tr>
                        </thead>
                        <tbody>
                            {event.tiers.map((tier: any) => (
                                <tr key={tier.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '1rem 1.5rem', fontWeight: 500, color: '#0f172a' }}>{tier.name}</td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right', color: '#334155' }}>${Number(tier.priceCents / 100).toFixed(2)}</td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right', color: '#334155' }}>{tier.quantitySold}</td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right', color: '#334155' }}>
                                        {tier.capacity ? `${tier.capacity - tier.quantitySold}` : '∞'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Participants */}
            <div className="card" style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                    <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={18} /> Recent Registrations
                    </h2>
                </div>
                {event.participations.length === 0 ? (
                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem', margin: 0 }}>No registrations yet.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', background: '#f8fafc' }}>
                                <th style={{ padding: '0.75rem 1.5rem', color: '#475569', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Name</th>
                                <th style={{ padding: '0.75rem 1.5rem', color: '#475569', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Email</th>
                                <th style={{ padding: '0.75rem 1.5rem', color: '#475569', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Tier</th>
                                <th style={{ padding: '0.75rem 1.5rem', color: '#475569', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Status</th>
                                <th style={{ padding: '0.75rem 1.5rem', color: '#475569', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {event.participations.map((p: any) => (
                                <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '1rem 1.5rem', fontWeight: 500, color: '#0f172a' }}>
                                        {/* Removed the link to the global CRM person page, just outputting name */}
                                        {p.person.firstName} {p.person.lastName}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', color: '#64748b' }}>{p.person.primaryEmail || '—'}</td>
                                    <td style={{ padding: '1rem 1.5rem', color: '#334155' }}>{p.ticketTier?.name || '—'}</td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span style={{
                                            padding: '0.125rem 0.5rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            background: p.status === 'checked_in' ? '#dcfce7' : p.status === 'active' ? '#e0f2fe' : '#fee2e2',
                                            color: p.status === 'checked_in' ? '#166534' : p.status === 'active' ? '#0369a1' : '#991b1b',
                                        }}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', color: '#64748b' }}>
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
