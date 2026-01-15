import { prisma } from '@/lib/prisma';
import UploadDropzone from '@/components/UploadDropzone';
import RunHouseholdingButton from '@/components/RunHouseholdingButton';
import ResetDataButton from '@/components/ResetDataButton';
import LogoutButton from '@/components/LogoutButton';
import { Users, CreditCard, Home as HomeIcon, Settings } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

// Helper for stats card
function StatCard({ title, value, icon, link }: { title: string, value: string | number, icon: any, link?: string }) {
    return (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: '#eff6ff', borderRadius: '50%', color: '#2563eb' }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{title}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</div>
                {link && <Link href={link} style={{ fontSize: '0.8rem', color: '#2563eb', textDecoration: 'none' }}>View All &rarr;</Link>}
            </div>
        </div>
    );
}

export const dynamic = 'force-dynamic'; // Ensure stats define latest data

export default async function Home() {
    const peopleCount = await prisma.person.count();
    const txCount = await prisma.transaction.count();
    const familyCount = await prisma.family.count();

    // Calculate total amount (might be slow if large, usually aggregate)
    const totalAmount = await prisma.transaction.aggregate({
        _sum: { amount: true }
    });

    // Check if current user is super admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const isSuperAdmin = user?.email === 'livoranger@gmail.com';

    return (
        <main className="container">
            <header style={{ marginBottom: '3rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', marginBottom: '0.25rem' }}>Minara Admin</h1>
                    <p style={{ color: '#6b7280', margin: 0 }}>Engagement Insights Validation MVP</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {isSuperAdmin && (
                        <Link href="/settings/users" className="btn" style={{ background: '#f3f4f6', color: '#374151' }}>
                            <Settings size={16} style={{ marginRight: '0.5rem' }} />
                            Manage Users
                        </Link>
                    )}
                    <LogoutButton />
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <StatCard
                    title="Total People"
                    value={peopleCount.toLocaleString()}
                    icon={<Users size={24} />}
                    link="/people"
                />
                <StatCard
                    title="Total Families"
                    value={familyCount.toLocaleString()}
                    icon={<HomeIcon size={24} />}
                    link="/families"
                />
                <StatCard
                    title="Transactions"
                    value={txCount.toLocaleString()}
                    icon={<CreditCard size={24} />}
                />
                <StatCard
                    title="Total Volume"
                    value={'$' + (totalAmount._sum.amount?.toString() || '0')}
                    icon={<div style={{ fontWeight: 'bold' }}>$</div>}
                />
            </div>

            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <UploadDropzone />
                <RunHouseholdingButton />
                <ResetDataButton />
            </div>
        </main>
    );
}
