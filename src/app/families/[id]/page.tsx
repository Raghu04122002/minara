import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, User } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function FamilyDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const family = await prisma.family.findUnique({
        where: { id },
        include: {
            members: {
                include: {
                    person: true
                }
            },
            // Also fetch transactions of all people to rollup
            people: {
                include: {
                    transactions: true
                }
            }
        }
    });

    if (!family) notFound();

    // Metrics Rollup
    const allTransactions = family.people.flatMap(p =>
        p.transactions.map(t => ({ ...t, personName: p.firstName + ' ' + p.lastName }))
    );
    allTransactions.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

    const totalSpent = allTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const programCount = allTransactions.filter(t => t.type.toLowerCase().includes('program')).length;
    const ticketCount = allTransactions.filter(t => t.type.toLowerCase().includes('ticket')).length;

    return (
        <div className="container" style={{ maxWidth: '1000px' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/families" style={{ display: 'inline-flex', alignItems: 'center', color: '#6b7280', textDecoration: 'none', marginBottom: '1rem' }}>
                    <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Back to Families
                </Link>
                <h1 className="heading" style={{ margin: 0, marginBottom: '0.5rem' }}>
                    {family.name}
                </h1>
                <p style={{ color: '#6b7280' }}>Combined Household View</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Household Spend</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669' }}>${totalSpent.toLocaleString()}</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Member Count</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{family.members.length}</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Actions</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{allTransactions.length}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Members</h2>
                    <div className="card" style={{ padding: 0 }}>
                        {family.members.map(m => (
                            <div key={m.id} style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center' }}>
                                <div style={{ marginRight: '1rem', background: '#f3f4f6', padding: '0.5rem', borderRadius: '50%' }}>
                                    <User size={16} color="#6b7280" />
                                </div>
                                <div>
                                    <Link href={`/people/${m.person.id}`} style={{ fontWeight: 500, color: '#1f2937', textDecoration: 'none', display: 'block' }}>
                                        {m.person.firstName} {m.person.lastName}
                                    </Link>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                        {m.role} • Grouped by {m.groupedBy}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Household History</h2>
                    <div className="card group-list">
                        {allTransactions.length === 0 ? (
                            <p style={{ padding: '1rem', color: '#6b7280' }}>No activity found.</p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                                        <th style={{ padding: '0.75rem' }}>Date</th>
                                        <th style={{ padding: '0.75rem' }}>Member</th>
                                        <th style={{ padding: '0.75rem' }}>Type</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allTransactions.map(t => (
                                        <tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '0.75rem', color: '#6b7280' }}>{new Date(t.occurredAt).toLocaleDateString()}</td>
                                            <td style={{ padding: '0.75rem' }}>{t.personName}</td>
                                            <td style={{ padding: '0.75rem' }}>{t.type}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>${Number(t.amount).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
