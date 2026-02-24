import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { QrCode, Search, CheckCircle, XCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OrganizerCheckinPage({
    searchParams,
}: {
    searchParams: Promise<{ event?: string; token?: string }>;
}) {
    const params = await searchParams;
    const eventId = params.event;
    const token = params.token;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/organizer/login');
    }

    // List events for selection - only the organizer's events
    const events = await prisma.event.findMany({
        where: { organizerId: user.id },
        orderBy: { startDate: 'desc' },
        take: 50,
    });

    // Check-in result
    let checkinResult: { success: boolean; message: string; person?: string } | null = null;

    if (token && eventId) {
        // Ensure the event being checked into actually belongs to the organizer
        const allowedEvent = events.find(e => e.id === eventId);
        if (!allowedEvent) {
            checkinResult = { success: false, message: 'Invalid event or not authorized.' };
        } else {
            const participation = await prisma.eventParticipation.findFirst({
                where: { qrCodeToken: token, eventId },
                include: { person: true },
            });

            if (!participation) {
                checkinResult = { success: false, message: 'Invalid QR code or wrong event.' };
            } else if (participation.checkedInAt) {
                checkinResult = {
                    success: false,
                    message: `Already checked in at ${new Date(participation.checkedInAt).toLocaleTimeString()}`,
                    person: `${participation.person.firstName} ${participation.person.lastName}`,
                };
            } else {
                await prisma.eventParticipation.update({
                    where: { id: participation.id },
                    data: { checkedInAt: new Date(), status: 'checked_in' },
                });
                checkinResult = {
                    success: true,
                    message: 'Successfully checked in!',
                    person: `${participation.person.firstName} ${participation.person.lastName}`,
                };
            }
        }
    }

    // If event selected, show participants
    let participants: { id: string; person: { firstName: string | null; lastName: string | null; primaryEmail: string | null }; checkedInAt: Date | null; status: string; qrCodeToken: string }[] = [];
    let selectedEvent: { title: string } | null = null;

    if (eventId) {
        selectedEvent = events.find(e => e.id === eventId) || null;
        if (selectedEvent) {
            participants = await prisma.eventParticipation.findMany({
                where: { eventId },
                include: { person: true },
                orderBy: { createdAt: 'desc' },
            });
        }
    }

    const checkedInCount = participants.filter(p => p.checkedInAt).length;

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                <QrCode size={28} /> QR Check-In
            </h1>

            {/* Event Selector */}
            <div className="card" style={{ marginBottom: '1.5rem', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>Select Event</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {events.map((e: any) => (
                        <Link key={e.id} href={`/organizer/checkin?event=${e.id}`}
                            style={{
                                padding: '0.5rem 1rem', borderRadius: '8px', textDecoration: 'none',
                                fontSize: '0.85rem', fontWeight: 500,
                                background: eventId === e.id ? '#0f172a' : '#f8fafc',
                                color: eventId === e.id ? '#fff' : '#475569',
                                border: `1px solid ${eventId === e.id ? '#0f172a' : '#e2e8f0'}`,
                            }}>
                            {e.title}
                        </Link>
                    ))}
                    {events.length === 0 && (
                        <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Create an event to start checking in participants.</span>
                    )}
                </div>
            </div>

            {/* Manual Check-in */}
            {eventId && selectedEvent && (
                <div className="card" style={{ marginBottom: '1.5rem', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                    <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>Scan / Enter QR Code</h3>
                    <form method="GET" action="/organizer/checkin" style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="hidden" name="event" value={eventId} />
                        <input name="token" placeholder="Enter QR token..." defaultValue=""
                            style={{ flex: 1, padding: '0.625rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem', outline: 'none' }} />
                        <button type="submit" className="btn" style={{ background: '#0f172a', color: 'white', padding: '0.625rem 1rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 500 }}>
                            <Search size={16} /> Check In
                        </button>
                    </form>

                    {/* Check-in Result */}
                    {checkinResult && (
                        <div style={{
                            marginTop: '1.25rem', padding: '1rem', borderRadius: '8px',
                            background: checkinResult.success ? '#ecfdf5' : '#fef2f2',
                            border: `1px solid ${checkinResult.success ? '#6ee7b7' : '#fecaca'}`,
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                        }}>
                            {checkinResult.success ? <CheckCircle size={24} style={{ color: '#10b981' }} /> : <XCircle size={24} style={{ color: '#ef4444' }} />}
                            <div>
                                {checkinResult.person && <div style={{ fontWeight: 600, color: '#0f172a' }}>{checkinResult.person}</div>}
                                <div style={{ fontSize: '0.875rem', color: checkinResult.success ? '#047857' : '#b91c1c', marginTop: '0.125rem' }}>
                                    {checkinResult.message}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Participants List */}
            {eventId && selectedEvent && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                            {selectedEvent.title} — Attendees
                        </h3>
                        <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500, background: '#e2e8f0', padding: '0.25rem 0.75rem', borderRadius: '9999px' }}>
                            {checkedInCount} / {participants.length} checked in
                        </span>
                    </div>
                    {participants.length === 0 ? (
                        <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', margin: 0 }}>No registrations yet.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ padding: '0.75rem 1.5rem', color: '#475569', fontWeight: 600 }}>Name</th>
                                    <th style={{ padding: '0.75rem 1.5rem', color: '#475569', fontWeight: 600 }}>Email</th>
                                    <th style={{ padding: '0.75rem 1.5rem', textAlign: 'center', color: '#475569', fontWeight: 600 }}>Status</th>
                                    <th style={{ padding: '0.75rem 1.5rem', color: '#475569', fontWeight: 600 }}>Checked In</th>
                                    <th style={{ padding: '0.75rem 1.5rem' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {participants.map((p: any) => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '1rem 1.5rem', fontWeight: 500, color: '#0f172a' }}>
                                            {p.person.firstName} {p.person.lastName}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', color: '#64748b' }}>{p.person.primaryEmail || '—'}</td>
                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                                            {p.checkedInAt ? (
                                                <CheckCircle size={18} style={{ color: '#10b981', display: 'inline-block', verticalAlign: 'middle' }} />
                                            ) : (
                                                <span style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>—</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.875rem' }}>
                                            {p.checkedInAt ? new Date(p.checkedInAt).toLocaleTimeString() : '—'}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                            {!p.checkedInAt && (
                                                <Link href={`/organizer/checkin?event=${eventId}&token=${p.qrCodeToken}`}
                                                    style={{ fontSize: '0.75rem', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.375rem 0.75rem', borderRadius: '4px', textDecoration: 'none', fontWeight: 500 }}>
                                                    Check In
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}
