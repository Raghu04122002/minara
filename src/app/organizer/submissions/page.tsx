import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FileText, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

function statusIcon(status: string) {
    switch (status) {
        case 'matched': return <CheckCircle size={16} style={{ color: '#16a34a' }} />;
        case 'needs_review': return <AlertTriangle size={16} style={{ color: '#eab308' }} />;
        case 'error': return <XCircle size={16} style={{ color: '#dc2626' }} />;
        default: return <FileText size={16} style={{ color: '#64748b' }} />;
    }
}

function statusBadge(status: string) {
    const map: Record<string, { bg: string; color: string }> = {
        matched: { bg: '#dcfce7', color: '#166534' },
        needs_review: { bg: '#fef9c3', color: '#854d0e' },
        error: { bg: '#fee2e2', color: '#991b1b' },
        pending: { bg: '#f1f5f9', color: '#475569' },
        resolved: { bg: '#e0f2fe', color: '#0369a1' },
    };
    return map[status] || { bg: '#f1f5f9', color: '#475569' };
}

export default async function OrganizerSubmissionsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/organizer/login');
    }

    const submissions = await prisma.registrationSubmission.findMany({
        where: {
            event: {
                organizerId: user.id
            }
        },
        include: {
            event: true,
            participants: {
                include: { person: true },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
    });

    const stats = {
        total: submissions.length,
        matched: submissions.filter((s: any) => s.processingStatus === 'matched').length,
        needsReview: submissions.filter((s: any) => s.processingStatus === 'needs_review').length,
        errors: submissions.filter((s: any) => s.processingStatus === 'error').length,
    };

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                <FileText size={28} /> Submissions
            </h1>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ textAlign: 'center', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{stats.total}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</div>
                </div>
                <div className="card" style={{ textAlign: 'center', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{stats.matched}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Matched</div>
                </div>
                <div className="card" style={{ textAlign: 'center', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#eab308' }}>{stats.needsReview}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Needs Review</div>
                </div>
                <div className="card" style={{ textAlign: 'center', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{stats.errors}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Errors</div>
                </div>
            </div>

            {submissions.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                    <p>No submissions yet.</p>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>Status</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>Source</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>Event</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>Participants</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map((sub: any) => {
                                const badge = statusBadge(sub.processingStatus);
                                return (
                                    <tr key={sub.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <Link href={`/organizer/submissions/${sub.id}`} style={{ textDecoration: 'none' }}>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                                                    padding: '0.25rem 0.625rem', borderRadius: '9999px',
                                                    fontSize: '0.7rem', fontWeight: 600,
                                                    background: badge.bg, color: badge.color,
                                                    cursor: 'pointer'
                                                }}>
                                                    {statusIcon(sub.processingStatus)}
                                                    {sub.processingStatus}
                                                </span>
                                            </Link>
                                        </td>
                                        <td style={{ padding: '1rem', color: '#64748b' }}>{sub.source}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <Link href={`/organizer/events/${sub.eventId}`} style={{ color: '#0f172a', fontWeight: 500, textDecoration: 'none' }}>
                                                {sub.event.title}
                                            </Link>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {sub.participants.map((p: any) => (
                                                <div key={p.id} style={{ fontSize: '0.8rem', color: '#0f172a' }}>
                                                    {p.firstName} {p.lastName}
                                                    {p.person && (
                                                        <span style={{ color: '#475569', marginLeft: '0.25rem', fontSize: '0.7rem' }}>
                                                            (Resolved)
                                                        </span>
                                                    )}
                                                    {p.matchConfidence && (
                                                        <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginLeft: '0.25rem' }}>
                                                            [{p.matchConfidence}]
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </td>
                                        <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.8rem' }}>
                                            {new Date(sub.createdAt).toLocaleDateString()}
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
