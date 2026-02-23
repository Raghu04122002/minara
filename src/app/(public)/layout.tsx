import Link from 'next/link';

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div style={{ minHeight: '100vh', background: '#fff' }}>
            {/* Simple Header */}
            <header style={{
                borderBottom: '1px solid #e5e7eb',
                padding: '1rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <Link href="/" style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#111827',
                    textDecoration: 'none',
                }}>
                    Minara Events
                </Link>
                <Link href="/login" style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    textDecoration: 'none',
                    fontWeight: 500,
                }}>
                    Admin Login
                </Link>
            </header>
            {/* Page Content */}
            <main>
                {children}
            </main>
        </div>
    );
}
