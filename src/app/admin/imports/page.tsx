import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Upload, UserPlus, CalendarDays } from 'lucide-react';

export const dynamic = 'force-dynamic';

type DataRow = {
    id: string;
    type: 'csv' | 'registration';
    name: string;
    status: string;
    total: number;
    success: number;
    errors: number;
    source: string;
    event?: string;
    eventId?: string;
    date: Date;
    hasErrorDownload: boolean;
};

function statusBadge(status: string) {
    const map: Record<string, { bg: string; color: string }> = {
        completed: { bg: '#dcfce7', color: '#166534' },
        matched: { bg: '#dcfce7', color: '#166534' },
        processing: { bg: '#dbeafe', color: '#1e40af' },
        pending: { bg: '#fef9c3', color: '#854d0e' },
        needs_review: { bg: '#fef9c3', color: '#854d0e' },
        failed: { bg: '#fee2e2', color: '#991b1b' },
        error: { bg: '#fee2e2', color: '#991b1b' },
    };
    return map[status] || { bg: '#f3f4f6', color: '#374151' };
}

function typeBadge(type: 'csv' | 'registration') {
    if (type === 'csv') return { bg: '#e0e7ff', color: '#3730a3', label: 'CSV', icon: Upload };
    return { bg: '#fce7f3', color: '#9d174d', label: 'Registration', icon: UserPlus };
}

export default async function DataImportPage() {
    // Fetch CSV imports
    const csvImports = await prisma.importJob.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
    });

    // Fetch event registration submissions
    const submissions = await prisma.registrationSubmission.findMany({
        include: {
            event: true,
            _count: { select: { participants: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });

    // Merge into a unified list
    const rows: DataRow[] = [
        ...csvImports.map((job: any): DataRow => ({
            id: job.id,
            type: 'csv',
            name: job.fileName || 'Untitled CSV',
            status: job.status,
            total: job.rowsTotal,
            success: job.rowsSuccess,
            errors: job.rowsErrors,
            source: 'CSV Upload',
            date: job.createdAt,
            hasErrorDownload: job.rowsErrors > 0,
        })),
        ...submissions.map((sub: any): DataRow => ({
            id: sub.id,
            type: 'registration',
            name: sub.event?.title || 'Unknown Event',
            status: sub.processingStatus,
            total: sub._count.participants,
            success: sub.processingStatus === 'matched' ? sub._count.participants : 0,
            errors: sub.processingStatus === 'error' ? sub._count.participants : 0,
            source: sub.source,
            event: sub.event?.title,
            eventId: sub.eventId,
            date: sub.createdAt,
            hasErrorDownload: false,
        })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const csvCount = csvImports.length;
    const regCount = submissions.length;
    const totalPeople = csvImports.reduce((sum: number, j: any) => sum + (j.rowsSuccess || 0), 0);
    const totalRegistrations = submissions.reduce((sum: number, s: any) => sum + s._count.participants, 0);

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Data Import</h1>
                <Link href="/admin" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                    ← Back to Dashboard
                </Link>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{csvCount}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>CSV Uploads</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563eb' }}>{totalPeople}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>People from CSV</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{regCount}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Registrations</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16a34a' }}>{totalRegistrations}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Registered Participants</div>
                </div>
            </div>

            {rows.length === 0 ? (
                <p style={{ color: '#6b7280' }}>No data imports yet. Upload a CSV or register for events to get started.</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <thead>
                        <tr style={{ background: '#f3f4f6' }}>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600' }}>Type</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600' }}>Name</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600' }}>Source</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600' }}>Status</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '600' }}>Total</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '600' }}>Success</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '600' }}>Errors</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600' }}>Date</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: '600' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => {
                            const badge = statusBadge(row.status);
                            const tBadge = typeBadge(row.type);
                            const TypeIcon = tBadge.icon;
                            return (
                                <tr key={`${row.type}-${row.id}`} style={{ borderTop: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                                            padding: '0.25rem 0.625rem', borderRadius: '9999px',
                                            fontSize: '0.7rem', fontWeight: 600,
                                            background: tBadge.bg, color: tBadge.color,
                                        }}>
                                            <TypeIcon size={12} /> {tBadge.label}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        {row.type === 'csv' ? (
                                            <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{row.name}</span>
                                        ) : (
                                            <Link href={`/admin/events/${row.eventId}`} style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.85rem' }}>
                                                <CalendarDays size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} />
                                                {row.name}
                                            </Link>
                                        )}
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#6b7280' }}>
                                        {row.source}
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem', borderRadius: '9999px',
                                            fontSize: '0.7rem', fontWeight: '600',
                                            background: badge.bg, color: badge.color,
                                        }}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontFamily: 'monospace' }}>
                                        {row.total}
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontFamily: 'monospace', color: '#22c55e' }}>
                                        {row.success}
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontFamily: 'monospace', color: row.errors > 0 ? '#ef4444' : '#6b7280' }}>
                                        {row.errors}
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#6b7280' }}>
                                        {new Date(row.date).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                        {row.hasErrorDownload && (
                                            <a href={`/api/imports/${row.id}/errors.csv`}
                                                style={{ color: '#ef4444', textDecoration: 'none', fontSize: '0.8rem' }}>
                                                Download Errors
                                            </a>
                                        )}
                                        {row.type === 'registration' && row.status === 'needs_review' && (
                                            <Link href={`/admin/submissions`}
                                                style={{ color: '#eab308', textDecoration: 'none', fontSize: '0.8rem' }}>
                                                Review
                                            </Link>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
}
