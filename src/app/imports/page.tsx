import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ImportsPage() {
    const imports = await prisma.importJob.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'background: #fbbf24; color: #000',
            processing: 'background: #3b82f6; color: #fff',
            completed: 'background: #22c55e; color: #fff',
            failed: 'background: #ef4444; color: #fff'
        };
        return colors[status] || 'background: #6b7280; color: #fff';
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Import History</h1>
                <Link href="/" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                    ← Back to Dashboard
                </Link>
            </div>

            {imports.length === 0 ? (
                <p style={{ color: '#6b7280' }}>No imports yet. Upload a CSV to get started.</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <thead>
                        <tr style={{ background: '#f3f4f6' }}>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600' }}>File</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600' }}>Status</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '600' }}>Total</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '600' }}>Success</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '600' }}>Errors</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600' }}>Started</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600' }}>Finished</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: '600' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {imports.map((job: typeof imports[0]) => (
                            <tr key={job.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                    <span style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                        {job.fileName}
                                    </span>
                                </td>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        fontWeight: '500',
                                        ...Object.fromEntries(getStatusBadge(job.status).split(';').map(s => s.trim().split(':')))
                                    }}>
                                        {job.status}
                                    </span>
                                </td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontFamily: 'monospace' }}>
                                    {job.rowsTotal}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontFamily: 'monospace', color: '#22c55e' }}>
                                    {job.rowsSuccess}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontFamily: 'monospace', color: job.rowsErrors > 0 ? '#ef4444' : '#6b7280' }}>
                                    {job.rowsErrors}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                    {job.startedAt ? new Date(job.startedAt).toLocaleString() : '-'}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                    {job.finishedAt ? new Date(job.finishedAt).toLocaleString() : '-'}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                    {job.rowsErrors > 0 && (
                                        <a
                                            href={`/api/imports/${job.id}/errors.csv`}
                                            style={{ color: '#ef4444', textDecoration: 'none', fontSize: '0.875rem' }}
                                        >
                                            Download Errors
                                        </a>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
