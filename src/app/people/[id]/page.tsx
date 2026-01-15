import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, User, Mail, Phone, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PersonDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const person = await prisma.person.findUnique({
        where: { id },
        include: {
            transactions: {
                orderBy: { occurredAt: 'desc' }
            },
            family: {
                include: {
                    members: {
                        include: { person: true }
                    }
                }
            }
        }
    });

    if (!person) notFound();

    // Metrics
    const totalSpent = person.transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const ticketCount = person.transactions.filter(t => t.type.toLowerCase().includes('ticket')).length;
    const programCount = person.transactions.filter(t => t.type.toLowerCase().includes('program')).length;
    const donationCount = person.transactions.filter(t => t.type.toLowerCase().includes('donation')).length;

    return (
        <div className="container" style={{ maxWidth: '1000px' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/people" style={{ display: 'inline-flex', alignItems: 'center', color: '#6b7280', textDecoration: 'none', marginBottom: '1rem' }}>
                    <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Back to People
                </Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                        <h1 className="heading" style={{ margin: 0, marginBottom: '0.5rem' }}>
                            {person.firstName} {person.lastName}
                        </h1>
                        <div style={{ display: 'flex', gap: '1.5rem', color: '#4b5563', fontSize: '0.9rem' }}>
                            {person.email && <div style={{ display: 'flex', alignItems: 'center' }}><Mail size={14} style={{ marginRight: '0.5rem' }} /> {person.email}</div>}
                            {person.phone && <div style={{ display: 'flex', alignItems: 'center' }}><Phone size={14} style={{ marginRight: '0.5rem' }} /> {person.phone}</div>}
                        </div>
                    </div>
                    {person.family && (
                        <div className="card" style={{ padding: '0.75rem 1rem', background: '#eff6ff', borderColor: '#bfdbfe' }}>
                            <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 600, textTransform: 'uppercase' }}>Household</div>
                            <Link href={`/families/${person.family.id}`} style={{ fontWeight: 600, color: '#1e40af', textDecoration: 'none' }}>
                                {person.family.name} &rarr;
                            </Link>
                        </div>
                    )}
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

            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Activity Timeline</h2>
            <div className="card group-list">
                {person.transactions.length === 0 ? (
                    <p style={{ color: '#6b7280', textAlign: 'center' }}>No transactions found.</p>
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
                            {person.transactions.map(t => (
                                <tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                                        {new Date(t.occurredAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <span style={{
                                            display: 'inline-block', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 500,
                                            background: t.type.includes('ticket') ? '#e0e7ff' : t.type.includes('donation') ? '#dcfce7' : '#f3f4f6',
                                            color: t.type.includes('ticket') ? '#3730a3' : t.type.includes('donation') ? '#166534' : '#374151'
                                        }}>
                                            {t.type}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>{t.description}</td>
                                    <td style={{ padding: '0.75rem', color: '#6b7280', fontSize: '0.75rem' }}>{t.sourceSystem}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 500 }}>
                                        ${Number(t.amount).toFixed(2)}
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
