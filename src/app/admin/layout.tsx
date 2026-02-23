import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Home,
    CalendarDays,
    ShoppingCart,
    FileText,
    QrCode,
    Database,
    Settings,
    LogOut
} from 'lucide-react';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const isMiftaah = user.email === 'miftaah@minara.org.in';

    const navItems = [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/people', label: 'People', icon: Users },
        { href: '/admin/families', label: 'Families', icon: Home },
        { href: '/admin/events', label: 'Events', icon: CalendarDays, superAdminOnly: false },
        { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, superAdminOnly: true },
        { href: '/admin/submissions', label: 'Submissions', icon: FileText, superAdminOnly: true },
        { href: '/admin/checkin', label: 'Check-In', icon: QrCode, superAdminOnly: false },
        { href: '/admin/imports', label: 'Data Import', icon: Database, superAdminOnly: false },
        { href: '/admin/settings', label: 'Settings', icon: Settings, superAdminOnly: true },
    ];

    const filteredNav = isMiftaah
        ? navItems.filter(item => !item.superAdminOnly)
        : navItems;

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <aside style={{
                width: '240px',
                background: '#111827',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                padding: '1.5rem 0',
                flexShrink: 0,
            }}>
                <div style={{ padding: '0 1.25rem', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
                        {isMiftaah ? 'Miftaah by Minara' : 'Minara Admin'}
                    </h1>
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.25rem 0 0' }}>
                        {user.email}
                    </p>
                </div>
                <nav style={{ flex: 1 }}>
                    {filteredNav.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.625rem 1.25rem',
                                color: '#d1d5db',
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
                </nav>
                <div style={{ padding: '0 1.25rem', borderTop: '1px solid #374151', paddingTop: '1rem' }}>
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
                                color: '#9ca3af',
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
            <main style={{ flex: 1, background: '#f9fafb', overflow: 'auto' }}>
                {children}
            </main>
        </div>
    );
}
