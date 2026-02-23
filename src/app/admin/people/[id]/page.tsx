import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Calendar, Users, CreditCard, Home as HomeIcon, AlertTriangle } from 'lucide-react';
import ResolveFlagButton from '@/components/ResolveFlagButton';
import AddToFamily from '@/components/AddToFamily';
import DeletePersonButton from '@/components/DeletePersonButton';
import EditPersonButton from '@/components/EditPersonButton';
import FlagPersonButton from '@/components/FlagPersonButton';

export const dynamic = 'force-dynamic';

export default async function PersonDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const isRestricted = authUser?.email === 'miftaah@minara.org.in';
    const isSuperAdmin = !isRestricted;

    const person = await prisma.person.findUnique({
        where: { id },
        include: {
            transactions: {
                orderBy: { occurredAt: 'desc' }
            },
            Order: {
                include: { event: true },
                orderBy: { createdAt: 'desc' }
            },
            eventParticipations: {
                include: { event: true },
                orderBy: { createdAt: 'desc' }
            },
            registrationParticipants: {
                include: {
                    submission: {
                        include: { event: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            },
            householdMembers: {
                include: {
                    household: {
                        include: {
                            members: {
                                include: { person: true }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!person) notFound();

    const flaggedCount = person.transactions.filter((t: any) => t.is_flagged).length;
    const totalSpent = person.transactions
        .filter((t: any) => !t.is_flagged)
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    const ticketCount = person.transactions.filter((t: any) => !t.is_flagged && t.type.toLowerCase().includes('ticket')).length;
    const programCount = person.transactions.filter((t: any) => !t.is_flagged && t.type.toLowerCase().includes('program')).length;
    const donationCount = person.transactions.filter((t: any) => !t.is_flagged && t.type.toLowerCase().includes('donation')).length;

    const activity = [
        ...person.transactions.map((t: any) => ({
            id: t.id,
            date: t.occurredAt,
            type: t.type,
            description: t.description,
            source: t.sourceSystem,
            amount: Number(t.amount),
            isFlagged: t.is_flagged,
            flagReason: t.flag_reason,
            isTransaction: true
        })),
        ...person.Order.map((o: any) => ({
            id: o.id,
            date: o.createdAt,
            type: 'Order',
            description: `${o.event.title} (${o.quantity} tickets)`,
            source: 'stripe',
            amount: Number(o.totalCents) / 100,
            isFlagged: false,
            isTransaction: true,
            status: o.orderStatus
        })),
        ...person.eventParticipations.map((ep: any) => ({
            id: ep.id,
            date: ep.createdAt,
            type: 'Event Registration',
            description: ep.event.title,
            source: ep.participationSource,
            amount: 0,
            isFlagged: false,
            isTransaction: false,
            status: ep.status
        })),
        ...person.registrationParticipants
            .filter((rp: any) => !person.eventParticipations.some((ep: any) => ep.eventId === rp.submission.eventId))
            .map((rp: any) => ({
                id: rp.id,
                date: rp.createdAt,
                type: 'Pending Registration',
                description: rp.submission.event.title,
                source: rp.submission.submissionChannel,
                amount: 0,
                isFlagged: false,
                isTransaction: false,
                status: 'NEEDS REVIEW'
            }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="container" style={{ maxWidth: '1000px' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/admin/people" style={{ display: 'inline-flex', alignItems: 'center', color: '#6b7280', textDecoration: 'none', marginBottom: '1rem' }}>
                    <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Back to People
                </Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                        <h1 className="heading" style={{ margin: 0, marginBottom: '0.5rem' }}>
                            {person.firstName} {person.lastName}
                        </h1>
                        <div style={{ display: 'flex', gap: '1.5rem', color: '#4b5563', fontSize: '0.9rem' }}>
                            {person.primaryEmail && <div style={{ display: 'flex', alignItems: 'center' }}><Mail size={14} style={{ marginRight: '0.5rem' }} /> {person.primaryEmail}</div>}
                            {person.primaryPhone && <div style={{ display: 'flex', alignItems: 'center' }}><Phone size={14} style={{ marginRight: '0.5rem' }} /> {person.primaryPhone}</div>}
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        {person.householdMembers.length > 0 && person.householdMembers[0].household && (
                            <div className="card" style={{ padding: '0.75rem 1rem', background: '#eff6ff', borderColor: '#bfdbfe' }}>
                                <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 600, textTransform: 'uppercase' }}>Household</div>
                                <Link href={`/admin/families/${person.householdMembers[0].household.id}`} style={{ fontWeight: 600, color: '#1e40af', textDecoration: 'none' }}>
                                    {person.householdMembers[0].household.householdName} &rarr;
                                </Link>
                            </div>
                        )}
                        {isSuperAdmin && (
                            <>
                                <AddToFamily personId={person.id} currentFamilyId={person.householdMembers[0]?.householdId} />
                                <FlagPersonButton personId={person.id} personName={`${person.firstName} ${person.lastName}`} />
                                <EditPersonButton personId={person.id} />
                                <DeletePersonButton personId={person.id} personName={`${person.firstName} ${person.lastName}`} />
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Spent</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669' }}>${totalSpent.toLocaleString()}</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Tickets</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{ticketCount}</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Programs</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{programCount}</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Donations</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{donationCount}</div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Activity Timeline</h2>
                {flaggedCount > 0 && (
                    <div style={{ fontSize: '0.875rem', background: '#fee2e2', color: '#991b1b', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontWeight: 600 }}>
                        Flagged Transactions: {flaggedCount}
                    </div>
                )}
            </div>

            <div className="card group-list">
                {activity.length === 0 ? (
                    <p style={{ color: '#6b7280', textAlign: 'center' }}>No activity found.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ padding: '0.75rem' }}>Date</th>
                                <th style={{ padding: '0.75rem' }}>Type</th>
                                <th style={{ padding: '0.75rem' }}>Description</th>
                                <th style={{ padding: '0.75rem' }}>Source</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activity.map((item: any) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                                        {new Date(item.date).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <span style={{
                                            display: 'inline-block', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 500,
                                            background: item.type.toLowerCase().includes('ticket') ? '#e0e7ff' :
                                                item.type.toLowerCase().includes('donation') ? '#dcfce7' :
                                                    item.type.toLowerCase().includes('registration') ? '#fdf2f8' : '#f3f4f6',
                                            color: item.type.toLowerCase().includes('ticket') ? '#3730a3' :
                                                item.type.toLowerCase().includes('donation') ? '#166534' :
                                                    item.type.toLowerCase().includes('registration') ? '#9d174d' : '#374151'
                                        }}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        {item.description}
                                        {item.isFlagged && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                                                <div style={{ fontSize: '0.65rem', color: '#dc2626', fontWeight: 700 }}>
                                                    FLAGGED: {item.flagReason?.replace(/_/g, ' ')}
                                                </div>
                                                {isSuperAdmin && <ResolveFlagButton transactionId={item.id} />}
                                            </div>
                                        )}
                                        {!item.isTransaction && item.status && (
                                            <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '0.2rem', textTransform: 'uppercase' }}>
                                                Status: {item.status}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '0.75rem', color: '#6b7280', fontSize: '0.75rem' }}>{item.source}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 500, color: item.isFlagged ? '#9ca3af' : 'inherit' }}>
                                        {item.amount > 0 ? `$${item.amount.toFixed(2)}` : '—'}
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
