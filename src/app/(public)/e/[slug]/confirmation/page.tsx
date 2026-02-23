import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { CheckCircle, QrCode, CalendarDays, MapPin } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ConfirmationPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ submission?: string; order?: string }>;
}) {
    const { slug } = await params;
    const { submission: submissionId, order: orderId } = await searchParams;

    const event = await prisma.event.findUnique({ where: { slug } });

    if (!event) {
        return (
            <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
                <p>Event not found.</p>
            </div>
        );
    }

    // Fetch participations for this registration
    let participations: { id: string; qrCodeToken: string; person: { firstName: string | null; lastName: string | null } }[] = [];

    if (submissionId) {
        const submission = await prisma.registrationSubmission.findUnique({
            where: { id: submissionId },
            include: {
                participants: {
                    include: { person: true },
                },
            },
        });

        if (submission) {
            const personIds = submission.participants
                .map((p: { personId: string | null }) => p.personId)
                .filter((id: string | null): id is string => !!id);

            participations = await prisma.eventParticipation.findMany({
                where: { eventId: event.id, personId: { in: personIds } },
                include: { person: true },
            });
        }
    } else if (orderId) {
        participations = await prisma.eventParticipation.findMany({
            where: { orderId },
            include: { person: true },
        });
    }

    return (
        <div style={{ maxWidth: '600px', margin: '3rem auto', padding: '0 1rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <CheckCircle size={64} style={{ color: '#22c55e', margin: '0 auto 1rem' }} />
                <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Registration Confirmed!</h1>
                <p style={{ color: '#6b7280', fontSize: '1rem' }}>You&apos;re registered for <strong>{event.title}</strong></p>
            </div>

            {/* Event Info */}
            <div style={{ padding: '1.25rem', background: '#f9fafb', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', color: '#4b5563', fontSize: '0.9rem', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CalendarDays size={16} />
                        {new Date(event.startDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        {' at '}
                        {new Date(event.startDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                    {event.locationName && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <MapPin size={16} /> {event.locationName}
                        </span>
                    )}
                </div>
            </div>

            {/* QR Codes */}
            {participations.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <QrCode size={20} /> Your QR Codes
                    </h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {participations.map(p => (
                            <div key={p.id} style={{
                                border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1.25rem',
                                display: 'flex', alignItems: 'center', gap: '1rem',
                            }}>
                                <div style={{
                                    width: '80px', height: '80px', background: '#f3f4f6', borderRadius: '8px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.65rem', color: '#6b7280', textAlign: 'center', padding: '0.25rem',
                                    fontFamily: 'monospace', wordBreak: 'break-all',
                                }}>
                                    {p.qrCodeToken.slice(0, 8)}...
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600 }}>
                                        {p.person.firstName} {p.person.lastName}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontFamily: 'monospace' }}>
                                        Token: {p.qrCodeToken}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.75rem' }}>
                        Present your QR code at the entrance for check-in.
                    </p>
                </div>
            )}

            <div style={{ textAlign: 'center' }}>
                <Link href="/org/default/events" style={{
                    display: 'inline-block', padding: '0.75rem 2rem', background: '#f3f4f6',
                    color: '#374151', borderRadius: '8px', textDecoration: 'none', fontWeight: 600,
                }}>
                    Browse More Events
                </Link>
            </div>
        </div>
    );
}
