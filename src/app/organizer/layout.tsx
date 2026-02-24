import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
    LayoutDashboard,
    CalendarDays,
    ShoppingCart,
    FileText,
    QrCode,
    User,
    ArrowRightLeft,
    LogOut
} from 'lucide-react';

export default async function OrganizerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/organizer/login');
    }

    // Role check - ensure they are an organizer or admin
    const role = user.user_metadata?.role;
    if (role !== 'organizer' && role !== 'admin') {
        // Option 1: they are just a regular user, log them out or redirect to public
        redirect('/');
    }

    const organizationName = user.user_metadata?.organizationName || 'Organizer Portal';

    const navItems = [
        { href: '/organizer/events', label: 'Events', icon: CalendarDays },
        { href: '/organizer/orders', label: 'Orders', icon: ShoppingCart },
        { href: '/organizer/submissions', label: 'Submissions', icon: FileText },
        { href: '/organizer/checkin', label: 'Check-In', icon: QrCode },
        { href: '/organizer/profile', label: 'Profile', icon: User },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <aside style={{
                width: '240px',
                background: '#0f172a', // Dark theme slate-900 specific to organizers
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                padding: '1.5rem 0',
                flexShrink: 0,
            }}>
                <div style={{ padding: '0 1.25rem', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <LayoutDashboard size={20} />
                        {organizationName}
                    </h1>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.25rem 0 0' }}>
                        {user.email}
                    </p>
                </div>
                <nav style={{ flex: 1 }}>
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.625rem 1.25rem',
                                color: '#cbd5e1',
                                textDecoration: 'none',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                transition: 'background 0.15s',
                            }}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </Link>
                    ))}

                    {/* Switch to Participant Mode */}
                    <form action="/api/organizer/switch-mode" method="POST">
                        <button
                            type="submit"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                width: '100%',
                                padding: '0.625rem 1.25rem',
                                background: 'none',
                                border: 'none',
                                color: '#38bdf8', // Light blue to stand out
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textAlign: 'left'
                            }}
                        >
                            <ArrowRightLeft size={18} />
                            Switch to Participant
                        </button>
                    </form>
                </nav>
                <div style={{ padding: '0 1.25rem', borderTop: '1px solid #1e293b', paddingTop: '1rem' }}>
                    <form action="/api/auth/signout" method="POST">
                        <button
                            type="submit"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                width: '100%',
                                padding: '0.5rem 0',
                                background: 'none',
                                border: 'none',
                                color: '#94a3b8',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                            }}
                        >
                            <LogOut size={18} />
                            Sign Out
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, background: '#f8fafc', overflow: 'auto' }}>
                {children}
            </main>
        </div>
    );
}
