import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

// Helper to get confidence color based on score
function getConfidenceStyle(score: number | null): { bg: string; color: string; label: string } {
    if (score === null) return { bg: '#f3f4f6', color: '#6b7280', label: 'N/A' };
    if (score >= 90) return { bg: '#dcfce7', color: '#166534', label: 'High' };
    if (score >= 60) return { bg: '#fef9c3', color: '#854d0e', label: 'Medium' };
    return { bg: '#fee2e2', color: '#991b1b', label: 'Low' };
}

export default async function FamiliesList() {
    // Check user role
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const isMiftaah = user?.email === 'miftaah@minara.org.in';
    const isSuperAdmin = !isMiftaah;

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

    type FamilyType = typeof families[0];
    type TransactionType = { amount: unknown; occurredAt: Date };

    type PersonType = FamilyType['people'][0];
    type FamilyWithStats = FamilyType & { memberCount: number; totalSpent: number; lastActivity: Date };

    const familiesWithStats: FamilyWithStats[] = families.map((f: FamilyType) => {
        // Rollup transactions from all people in family
        const allTransactions: TransactionType[] = f.people.flatMap((p: PersonType) => p.transactions);
        const totalSpent = allTransactions.reduce((sum: number, t: TransactionType) => sum + Number(t.amount), 0);
        const lastActivity = allTransactions.length > 0
            ? allTransactions.reduce((latest: Date, t: TransactionType) => t.occurredAt > latest ? t.occurredAt : latest, allTransactions[0].occurredAt)
            : f.createdAt; // Default to creation if no info

        return {
            ...f,
            memberCount: f.members.length,
            totalSpent,
            lastActivity
        };
    });

    // Sort by spent desc
    familiesWithStats.sort((a: FamilyWithStats, b: FamilyWithStats) => b.totalSpent - a.totalSpent);

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="heading" style={{ margin: 0 }}>Families</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {isSuperAdmin && <Link href="/families/new" className="btn" style={{ background: '#22c55e', color: 'white' }}>+ Create Family</Link>}
                    <Link href="/" className="btn">Back to Dashboard</Link>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>Family Name</th>
                            <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>Match Confidence</th>
                            <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Members</th>
                            <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>Total Spent</th>
                            <th style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>Last Activity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {familiesWithStats.map((f) => {
                            const confidenceStyle = getConfidenceStyle(f.confidenceScore);
                            return (
                                <tr key={f.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '0.75rem 1.5rem' }}>
                                        <Link href={`/families/${f.id}`} style={{ color: '#2563eb', fontWeight: 500, textDecoration: 'none' }}>
                                            {f.name}
                                        </Link>
                                    </td>
                                    <td style={{ padding: '0.75rem 1.5rem' }}>
                                        <span
                                            title={isSuperAdmin ? (f.confidenceReason ? `Confidence based on: ${f.confidenceReason}` : 'Confidence based on shared email, phone, and/or address.') : undefined}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: confidenceStyle.bg,
                                                color: confidenceStyle.color,
                                                cursor: 'help'
                                            }}
                                        >
                                            {f.confidenceScore !== null ? `${f.confidenceScore}%` : 'N/A'}
                                            <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>({confidenceStyle.label})</span>
                                        </span>
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
                            );
                        })}
                        {familiesWithStats.length === 0 && (
                            <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No families formed yet. Run householding logic!</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
