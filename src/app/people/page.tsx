import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PeopleList({
    searchParams,
}: {
    searchParams: { sort?: string };
}) {
    const sort = (await searchParams).sort || 'updatedAt';

    // Sorting logic basic mapping
    const orderBy: any = {};
    if (sort === 'createdAt') orderBy.createdAt = 'desc';
    else if (sort === 'lastName') orderBy.lastName = 'asc';
    else orderBy.updatedAt = 'desc';

    // Fetch people with basic stats
    // Note: Aggregating stats on the fly might be slow for huge data but fine for MVP.
    // Alternatively, include transactions to sum them in JS (not ideal but works for <1000 rows).
    // Or Prisma aggregate? Prisma helper doesn't easily allow "findMany with aggregate per row".
    // I'll fetch transactions and sum them for now or just show basic info.
    // Requirement: "Sort by total spent, activity".
    // If I need to sort by spent, I should probably do it in DB or fetch all and sort in memory (dangerous for scale).
    // For MVP with small CSVs, in-memory sort is acceptable.

    const people = await prisma.person.findMany({
        include: {
            transactions: {
                select: { amount: true, occurredAt: true }
            },
            family: {
                select: { name: true }
            }
        },
        take: 200 // Limit for MVP performance
    });

    const peopleWithStats = people.map((p: any) => {
        const totalSpent = p.transactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
        const lastActivity = p.transactions.length > 0
            ? p.transactions.reduce((latest: any, t: any) => t.occurredAt > latest ? t.occurredAt : latest, p.transactions[0].occurredAt)
            : p.createdAt;

        return {
            ...p,
            totalSpent,
            lastActivity
        };
    });

    // Sort in memory
    if (sort === 'spent') {
        peopleWithStats.sort((a: any, b: any) => b.totalSpent - a.totalSpent);
    } else if (sort === 'activity') {
        peopleWithStats.sort((a: any, b: any) => b.lastActivity.getTime() - a.lastActivity.getTime());
    } else {
        // Default fallback to array sort based on what we fetched?
        // We already sorted in DB by field if possible, but for mixed sort logic, memory is easier.
    }

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="heading" style={{ margin: 0 }}>People</h1>
                <div>
                    <Link href="/" className="btn" style={{ marginRight: '1rem' }}>Back to Dashboard</Link>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', gap: '1rem' }}>
                    <span>Sort by: </span>
                    <Link href="/people?sort=activity" style={{ fontWeight: sort === 'activity' ? 'bold' : 'normal' }}>Last Activity</Link>
                    <Link href="/people?sort=spent" style={{ fontWeight: sort === 'spent' ? 'bold' : 'normal' }}>Total Spent</Link>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>Name</th>
                            <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>Email</th>
                            <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>Family</th>
                            <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>Total Spent</th>
                            <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>Last Activity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {peopleWithStats.map((p: any) => (
                            <tr key={p.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '0.75rem 1.5rem' }}>
                                    <Link href={`/people/${p.id}`} style={{ color: '#2563eb', fontWeight: 500, textDecoration: 'none' }}>
                                        {p.firstName || ''} {p.lastName || 'Person ' + p.id.substring(0, 6)}
                                    </Link>
                                </td>
                                <td style={{ padding: '0.75rem 1.5rem', color: '#6b7280' }}>{p.email || '-'}</td>
                                <td style={{ padding: '0.75rem 1.5rem' }}>
                                    {p.family ? (
                                        <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '0.125rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem' }}>
                                            {p.family.name}
                                        </span>
                                    ) : '-'}
                                </td>
                                <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right', fontWeight: 500 }}>
                                    ${p.totalSpent.toLocaleString()}
                                </td>
                                <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right', color: '#6b7280' }}>
                                    {p.lastActivity.toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {peopleWithStats.length === 0 && (
                            <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No people found. Import some data!</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
