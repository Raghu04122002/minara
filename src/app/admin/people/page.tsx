import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PeopleList({
    searchParams,
}: {
    searchParams: Promise<{ sort?: string; search?: string }>;
}) {
    const params = await searchParams;

    // Check user role
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const isMiftaah = user?.email === 'miftaah@minara.org.in';
    const isSuperAdmin = !isMiftaah;

    const sort = params.sort || 'updatedAt';
    const search = params.search || '';

    // Build search filter
    const searchFilter = search ? {
        OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { primaryEmail: { contains: search, mode: 'insensitive' as const } },
            { primaryPhone: { contains: search } }
        ]
    } : {};

    // Sorting logic basic mapping
    const orderBy: Record<string, string> = {};
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
        where: searchFilter,
        include: {
            transactions: {
                select: { amount: true, occurredAt: true, type: true }
            },
            householdMembers: {
                include: {
                    household: {
                        select: { householdName: true }
                    }
                }
            }
        },
        take: 1000
    });

    const flaggedCount = await prisma.person.count({ where: { is_flagged: true } });

    type Transaction = { amount: unknown; occurredAt: Date; type: string };
    type PersonWithStats = typeof people[0] & { totalTickets: number; totalDonations: number; totalSpent: number; lastActivity: Date };

    const peopleWithStats: PersonWithStats[] = people.map((p: typeof people[0]) => {
        const ticketTransactions = p.transactions.filter((t: Transaction) => t.type !== 'donation');
        const donationTransactions = p.transactions.filter((t: Transaction) => t.type === 'donation');

        const totalTickets = ticketTransactions.reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0);
        const totalDonations = donationTransactions.reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0);
        const totalSpent = totalTickets + totalDonations;

        const lastActivity = p.transactions.length > 0
            ? p.transactions.reduce((latest: Date, t: Transaction) => t.occurredAt > latest ? t.occurredAt : latest, p.transactions[0].occurredAt)
            : p.createdAt;

        return {
            ...p,
            totalTickets,
            totalDonations,
            totalSpent,
            lastActivity
        };
    });

    // Sort in memory
    if (sort === 'spent') {
        peopleWithStats.sort((a: PersonWithStats, b: PersonWithStats) => b.totalSpent - a.totalSpent);
    } else if (sort === 'activity') {
        peopleWithStats.sort((a: PersonWithStats, b: PersonWithStats) => b.lastActivity.getTime() - a.lastActivity.getTime());
    } else {
        // Default fallback to array sort based on what we fetched?
        // We already sorted in DB by field if possible, but for mixed sort logic, memory is easier.
    }

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="heading" style={{ margin: 0 }}>People</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {isSuperAdmin && (
                        <>
                            <Link href="/admin/people/new" style={{
                                padding: '0.5rem 1rem',
                                background: '#22c55e',
                                color: '#fff',
                                borderRadius: '0.375rem',
                                textDecoration: 'none',
                                fontWeight: 500
                            }}>
                                + Add Person
                            </Link>
                            <Link href="/admin/people/flagged" style={{
                                padding: '0.5rem 1rem',
                                background: flaggedCount > 0 ? '#fef3c7' : '#f3f4f6',
                                color: flaggedCount > 0 ? '#92400e' : '#374151',
                                borderRadius: '0.375rem',
                                textDecoration: 'none',
                                fontWeight: 500,
                                border: flaggedCount > 0 ? '1px solid #fcd34d' : 'none'
                            }}>
                                🚩 Flagged ({flaggedCount})
                            </Link>
                            <a href={`/api/people/export${search ? `?search=${encodeURIComponent(search)}` : ''}`} style={{
                                padding: '0.5rem 1rem',
                                background: '#f3f4f6',
                                color: '#374151',
                                borderRadius: '0.375rem',
                                textDecoration: 'none',
                                fontWeight: 500
                            }}>
                                Export CSV
                            </a>
                        </>
                    )}
                    <Link href="/admin" className="btn">Back to Dashboard</Link>
                </div>
            </div>

            {/* Search Form */}
            <form method="GET" action="/admin/people" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        name="search"
                        defaultValue={search}
                        placeholder="Search by name, email, or phone..."
                        style={{
                            flex: 1,
                            padding: '0.5rem 1rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem'
                        }}
                    />
                    <button type="submit" style={{
                        padding: '0.5rem 1rem',
                        background: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer'
                    }}>
                        Search
                    </button>
                    {search && (
                        <Link href="/admin/people" style={{
                            padding: '0.5rem 1rem',
                            background: '#f3f4f6',
                            color: '#374151',
                            borderRadius: '0.375rem',
                            textDecoration: 'none'
                        }}>
                            Clear
                        </Link>
                    )}
                </div>
            </form>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', gap: '1rem' }}>
                    <span>Sort by: </span>
                    <Link href="/admin/people?sort=activity" style={{ fontWeight: sort === 'activity' ? 'bold' : 'normal' }}>Last Activity</Link>
                    <Link href="/admin/people?sort=spent" style={{ fontWeight: sort === 'spent' ? 'bold' : 'normal' }}>Total Spent</Link>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>Name</th>
                            <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>Email</th>
                            <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>Household</th>
                            <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>Tickets</th>
                            <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>Donations</th>
                            <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>Last Activity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {peopleWithStats.map((p: any) => (
                            <tr key={p.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '0.75rem 1.5rem' }}>
                                    <Link href={`/admin/people/${p.id}`} style={{ color: '#2563eb', fontWeight: 500, textDecoration: 'none' }}>
                                        {p.firstName || ''} {p.lastName || 'Person ' + p.id.substring(0, 6)}
                                    </Link>
                                    {p.is_flagged && isSuperAdmin && (
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            padding: '0.125rem 0.375rem',
                                            background: '#fee2e2',
                                            color: '#dc2626',
                                            borderRadius: '0.25rem',
                                            fontSize: '0.65rem',
                                            fontWeight: 700
                                        }}>
                                            🚩 FLAGGED
                                        </span>
                                    )}
                                </td>
                                <td style={{ padding: '0.75rem 1.5rem', color: '#6b7280' }}>{p.primaryEmail || '-'}</td>
                                <td style={{ padding: '0.75rem 1.5rem' }}>
                                    {p.householdMembers.length > 0 && p.householdMembers[0].household ? (
                                        <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '0.125rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem' }}>
                                            {p.householdMembers[0].household.householdName}
                                        </span>
                                    ) : '-'}
                                </td>
                                <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right', fontWeight: 500 }}>
                                    ${p.totalTickets.toLocaleString()}
                                </td>
                                <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right', fontWeight: 500, color: '#059669' }}>
                                    ${p.totalDonations.toLocaleString()}
                                </td>
                                <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right', color: '#6b7280' }}>
                                    {p.lastActivity.toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {peopleWithStats.length === 0 && (
                            <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No people found. Import some data!</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
