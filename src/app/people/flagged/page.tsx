import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import FlagActions from '@/components/FlagActions';

export const dynamic = 'force-dynamic';

export default async function FlaggedPeoplePage() {
    // Fetch ALL flag records (flags + merges), ordered by most recent
    const allFlags = await prisma.personFlag.findMany({
        include: {
            person: true
        },
        orderBy: { createdAt: 'desc' }
    });

    const activeFlags = allFlags.filter((f: any) => !f.undoneAt && !f.permanentlyDeletedAt);
    const resolvedFlags = allFlags.filter((f: any) => f.undoneAt || f.permanentlyDeletedAt);

    return (
        <div className="container" style={{ maxWidth: '1100px' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/people" style={{ display: 'inline-flex', alignItems: 'center', color: '#6b7280', textDecoration: 'none', marginBottom: '1rem' }}>
                    <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Back to People
                </Link>
                <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={24} color="#dc2626" /> Flagged People & Merge History
                </h1>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.5rem 0 0' }}>
                    {activeFlags.length} active · {resolvedFlags.length} resolved
                </p>
            </div>

            {/* Active Flags & Merges */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '2rem' }}>
                <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', borderBottom: '1px solid #fecaca', fontWeight: 600, fontSize: '0.875rem', color: '#991b1b' }}>
                    Active Flags & Merges
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                        <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                            <th style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #e5e7eb' }}>Person</th>
                            <th style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #e5e7eb' }}>Type</th>
                            <th style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #e5e7eb' }}>Reason</th>
                            <th style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #e5e7eb' }}>Notes</th>
                            <th style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                            <th style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeFlags.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                    No active flags or merges. Everything is clean! ✅
                                </td>
                            </tr>
                        ) : (
                            activeFlags.map((f: any) => (
                                <tr key={f.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '0.6rem 1rem' }}>
                                        {f.person ? (
                                            <Link href={`/people/${f.person.id}`} style={{ color: '#2563eb', fontWeight: 500, textDecoration: 'none' }}>
                                                {f.person.firstName} {f.person.lastName}
                                            </Link>
                                        ) : (
                                            <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Deleted</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '0.6rem 1rem' }}>
                                        <span style={{
                                            padding: '0.15rem 0.4rem',
                                            borderRadius: '0.25rem',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            background: f.actionType === 'merge' ? '#fee2e2' : '#fef9c3',
                                            color: f.actionType === 'merge' ? '#991b1b' : '#92400e'
                                        }}>
                                            {f.actionType}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.6rem 1rem', color: '#4b5563' }}>
                                        {f.reason?.replace(/_/g, ' ')}
                                    </td>
                                    <td style={{ padding: '0.6rem 1rem', color: '#6b7280', fontSize: '0.8rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {f.notes || '-'}
                                    </td>
                                    <td style={{ padding: '0.6rem 1rem', color: '#6b7280', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                        {new Date(f.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '0.6rem 1rem' }}>
                                        <FlagActions
                                            flagId={f.id}
                                            actionType={f.actionType}
                                            undoneAt={f.undoneAt?.toISOString() || null}
                                            permanentlyDeletedAt={f.permanentlyDeletedAt?.toISOString() || null}
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Resolved History */}
            {resolvedFlags.length > 0 && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '0.75rem 1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: '0.875rem', color: '#374151' }}>
                        Resolved History ({resolvedFlags.length})
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                                <th style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #e5e7eb' }}>Person</th>
                                <th style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #e5e7eb' }}>Type</th>
                                <th style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #e5e7eb' }}>Reason</th>
                                <th style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #e5e7eb' }}>Notes</th>
                                <th style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resolvedFlags.map((f: any) => (
                                <tr key={f.id} style={{ borderBottom: '1px solid #f3f4f6', opacity: 0.7 }}>
                                    <td style={{ padding: '0.6rem 1rem' }}>
                                        {f.person ? (
                                            <Link href={`/people/${f.person.id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                                                {f.person.firstName} {f.person.lastName}
                                            </Link>
                                        ) : (
                                            <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Deleted</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '0.6rem 1rem' }}>
                                        <span style={{
                                            padding: '0.15rem 0.4rem',
                                            borderRadius: '0.25rem',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            background: '#f3f4f6',
                                            color: '#6b7280'
                                        }}>
                                            {f.actionType}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.6rem 1rem', color: '#6b7280' }}>
                                        {f.reason?.replace(/_/g, ' ')}
                                    </td>
                                    <td style={{ padding: '0.6rem 1rem', color: '#6b7280', fontSize: '0.8rem' }}>
                                        {f.notes || '-'}
                                    </td>
                                    <td style={{ padding: '0.6rem 1rem' }}>
                                        <FlagActions
                                            flagId={f.id}
                                            actionType={f.actionType}
                                            undoneAt={f.undoneAt?.toISOString() || null}
                                            permanentlyDeletedAt={f.permanentlyDeletedAt?.toISOString() || null}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
