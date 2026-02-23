import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { QrCode, Search, CheckCircle, XCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminCheckinPage({
    searchParams,
}: {
    searchParams: Promise<{ event?: string; token?: string }>;
}) {
    const params = await searchParams;
    const eventId = params.event;
    const token = params.token;

    // List events for selection
    const events = await prisma.event.findMany({
        orderBy: { startDate: 'desc' },
        take: 20,
    });

    // Check-in result
    let checkinResult: { success: boolean; message: string; person?: string } | null = null;

    if (token && eventId) {
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

    // If event selected, show participants
    let participants: { id: string; person: { firstName: string | null; lastName: string | null; primaryEmail: string | null }; checkedInAt: Date | null; status: string; qrCodeToken: string }[] = [];
    let selectedEvent: { title: string } | null = null;

    if (eventId) {
        selectedEvent = await prisma.event.findUnique({ where: { id: eventId } });
        participants = await prisma.eventParticipation.findMany({
            where: { eventId },
            include: { person: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    const checkedInCount = participants.filter(p => p.checkedInAt).length;

    return (
        <div className="container">
            <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <QrCode size={28} /> QR Check-In
            </h1>

            {/* Event Selector */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 600 }}>Select Event</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {events.map((e: any) => (
                        <Link key={e.id} href={`/admin/checkin?event=${e.id}`}
                            style={{
                                padding: '0.5rem 1rem', borderRadius: '8px', textDecoration: 'none',
                                fontSize: '0.85rem', fontWeight: 500,
                                background: eventId === e.id ? '#2563eb' : '#f3f4f6',
                                color: eventId === e.id ? '#fff' : '#374151',
                            }}>
                            {e.title}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Manual Check-in */}
            {eventId && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 600 }}>Scan / Enter QR Code</h3>
                    <form method="GET" action="/admin/checkin" style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="hidden" name="event" value={eventId} />
                        <input name="token" placeholder="Enter QR token..." defaultValue=""
                            style={{ flex: 1, padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }} />
                        <button type="submit" className="btn" style={{ background: '#2563eb', color: 'white' }}>
                            <Search size={16} /> Check In
                        </button>
                    </form>

                    {/* Check-in Result */}
                    {checkinResult && (
                        <div style={{
                            marginTop: '1rem', padding: '1rem', borderRadius: '8px',
                            background: checkinResult.success ? '#f0fdf4' : '#fef2f2',
                            border: `1px solid ${checkinResult.success ? '#bbf7d0' : '#fecaca'}`,
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                        }}>
                            {checkinResult.success ? <CheckCircle size={24} style={{ color: '#16a34a' }} /> : <XCircle size={24} style={{ color: '#dc2626' }} />}
                            <div>
                                {checkinResult.person && <div style={{ fontWeight: 600 }}>{checkinResult.person}</div>}
                                <div style={{ fontSize: '0.85rem', color: checkinResult.success ? '#166534' : '#991b1b' }}>
                                    {checkinResult.message}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Participants List */}
            {eventId && selectedEvent && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>
                            {selectedEvent.title} — Attendees
                        </h3>
                        <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                            {checkedInCount}/{participants.length} checked in
                        </span>
                    </div>
                    {participants.length === 0 ? (
                        <p style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>No registrations yet.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                                    <th style={{ padding: '0.5rem 1rem' }}>Name</th>
                                    <th style={{ padding: '0.5rem 1rem' }}>Email</th>
                                    <th style={{ padding: '0.5rem 1rem', textAlign: 'center' }}>Status</th>
                                    <th style={{ padding: '0.5rem 1rem' }}>Checked In</th>
                                    <th style={{ padding: '0.5rem 1rem' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {participants.map((p: any) => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '0.5rem 1rem', fontWeight: 500 }}>
                                            {p.person.firstName} {p.person.lastName}
                                        </td>
                                        <td style={{ padding: '0.5rem 1rem', color: '#6b7280' }}>{p.person.primaryEmail || '—'}</td>
                                        <td style={{ padding: '0.5rem 1rem', textAlign: 'center' }}>
                                            {p.checkedInAt ? (
                                                <CheckCircle size={16} style={{ color: '#16a34a' }} />
                                            ) : (
                                                <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>—</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.5rem 1rem', color: '#6b7280', fontSize: '0.8rem' }}>
                                            {p.checkedInAt ? new Date(p.checkedInAt).toLocaleTimeString() : '—'}
                                        </td>
                                        <td style={{ padding: '0.5rem 1rem' }}>
                                            {!p.checkedInAt && (
                                                <Link href={`/admin/checkin?event=${eventId}&token=${p.qrCodeToken}`}
                                                    style={{ fontSize: '0.75rem', color: '#2563eb', textDecoration: 'none' }}>
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
