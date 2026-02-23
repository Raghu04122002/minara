import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FileText, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

function statusIcon(status: string) {
    switch (status) {
        case 'matched': return <CheckCircle size={16} style={{ color: '#16a34a' }} />;
        case 'needs_review': return <AlertTriangle size={16} style={{ color: '#eab308' }} />;
        case 'error': return <XCircle size={16} style={{ color: '#dc2626' }} />;
        default: return <FileText size={16} style={{ color: '#6b7280' }} />;
    }
}

function statusBadge(status: string) {
    const map: Record<string, { bg: string; color: string }> = {
        matched: { bg: '#dcfce7', color: '#166534' },
        needs_review: { bg: '#fef9c3', color: '#854d0e' },
        error: { bg: '#fee2e2', color: '#991b1b' },
        pending: { bg: '#f3f4f6', color: '#374151' },
        resolved: { bg: '#dbeafe', color: '#1e40af' },
    };
    return map[status] || { bg: '#f3f4f6', color: '#374151' };
}

export default async function AdminSubmissionsPage() {
    const submissions = await prisma.registrationSubmission.findMany({
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
        <div className="container">
            <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={28} /> Submissions
            </h1>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.total}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Total</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16a34a' }}>{stats.matched}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Matched</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#eab308' }}>{stats.needsReview}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Needs Review</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#dc2626' }}>{stats.errors}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Errors</div>
                </div>
            </div>

            {submissions.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                    <p>No submissions yet.</p>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb' }}>Source</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb' }}>Event</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb' }}>Participants</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map((sub: any) => {
                                const badge = statusBadge(sub.processingStatus);
                                return (
                                    <tr key={sub.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <Link href={`/admin/submissions/${sub.id}`} style={{ textDecoration: 'none' }}>
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
                                        <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>{sub.source}</td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <Link href={`/admin/events/${sub.eventId}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                                                {sub.event.title}
                                            </Link>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            {sub.participants.map((p: any, i: number) => (
                                                <div key={p.id} style={{ fontSize: '0.8rem' }}>
                                                    {p.firstName} {p.lastName}
                                                    {p.person && (
                                                        <Link href={`/admin/people/${p.personId}`}
                                                            style={{ color: '#2563eb', textDecoration: 'none', marginLeft: '0.25rem', fontSize: '0.7rem' }}>
                                                            (→ {p.person.firstName})
                                                        </Link>
                                                    )}
                                                    {p.matchConfidence && (
                                                        <span style={{ fontSize: '0.65rem', color: '#9ca3af', marginLeft: '0.25rem' }}>
                                                            [{p.matchConfidence}]
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.8rem' }}>
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
