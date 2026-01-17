import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ChevronLeft, AlertCircle, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function FlaggedPage() {
    const flaggedTransactions = await prisma.transaction.findMany({
        where: { is_flagged: true },
        include: {
            person: true,
            importFile: true
        },
        orderBy: { occurredAt: 'desc' }
    });

    return (
        <main className="container">
            <header style={{ marginBottom: '2rem' }}>
                <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', color: '#6b7280', textDecoration: 'none', marginBottom: '1rem' }}>
                    <ChevronLeft size={16} style={{ marginRight: '0.4rem' }} /> Back to Dashboard
                </Link>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <AlertCircle size={28} style={{ color: '#dc2626' }} />
                        Flagged Transactions
                    </h1>
                    <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                        Records detected as summary rows, price anomalies, or missing critical data.
                    </p>
                </div>
            </header>

            <div className="card" style={{ padding: 0 }}>
                {flaggedTransactions.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                        No flagged transactions found.
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ padding: '1rem' }}>Date</th>
                                <th style={{ padding: '1rem' }}>Person</th>
                                <th style={{ padding: '1rem' }}>Description</th>
                                <th style={{ padding: '1rem' }}>Amount</th>
                                <th style={{ padding: '1rem' }}>Reason</th>
                                <th style={{ padding: '1rem' }}>Source File</th>
                                <th style={{ padding: '1rem' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {flaggedTransactions.map((t: any) => (
                                <tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '1rem', color: '#6b7280' }}>
                                        {new Date(t.occurredAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                                        {t.person.firstName} {t.person.lastName}
                                    </td>
                                    <td style={{ padding: '1rem' }}>{t.description}</td>
                                    <td style={{ padding: '1rem', fontWeight: 700, color: '#dc2626' }}>
                                        ${Number(t.amount).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            background: '#fee2e2',
                                            color: '#991b1b',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600
                                        }}>
                                            {t.flag_reason?.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.75rem' }}>
                                        {t.importFile?.filename || t.sourceSystem}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <Link href={`/people/${t.personId}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                                            <ExternalLink size={16} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </main>
    );
}
