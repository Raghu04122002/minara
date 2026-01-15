import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function FamiliesList() {
    const families = await prisma.family.findMany({
        include: {
            people: {
                include: {
                    transactions: { select: { amount: true, occurredAt: true } }
                }
            },
            members: { select: { id: true } }
        }
    });

    const familiesWithStats = families.map((f: any) => {
        // Rollup transactions from all people in family
        const allTransactions = f.people.flatMap((p: any) => p.transactions);
        const totalSpent = allTransactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
        const lastActivity = allTransactions.length > 0
            ? allTransactions.reduce((latest: any, t: any) => t.occurredAt > latest ? t.occurredAt : latest, allTransactions[0].occurredAt)
            : f.createdAt; // Default to creation if no info

        return {
            ...f,
            memberCount: f.members.length, // or f.people.length
            totalSpent,
            lastActivity
        };
    });

    // Sort by spent desc
    familiesWithStats.sort((a: any, b: any) => b.totalSpent - a.totalSpent);

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="heading" style={{ margin: 0 }}>Families</h1>
                <div>
                    <Link href="/" className="btn" style={{ marginRight: '1rem' }}>Back to Dashboard</Link>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>Family Name</th>
                            <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Members</th>
                            <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>Total Spent</th>
                            <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>Last Activity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {familiesWithStats.map((f: any) => (
                            <tr key={f.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '0.75rem 1.5rem' }}>
                                    <Link href={`/families/${f.id}`} style={{ color: '#2563eb', fontWeight: 500, textDecoration: 'none' }}>
                                        {f.name}
                                    </Link>
                                </td>
                                <td style={{ padding: '0.75rem 1.5rem', textAlign: 'center' }}>
                                    {f.memberCount}
                                </td>
                                <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right', fontWeight: 500 }}>
                                    ${f.totalSpent.toLocaleString()}
                                </td>
                                <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right', color: '#6b7280' }}>
                                    {new Date(f.lastActivity).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {familiesWithStats.length === 0 && (
                            <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No families formed yet. Run householding logic!</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
