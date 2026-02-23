import { Settings } from 'lucide-react';
import Link from 'next/link';

export default function AdminSettingsPage() {
    return (
        <div className="container">
            <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings size={28} /> Settings
            </h1>
            <div style={{ display: 'grid', gap: '1rem', maxWidth: '500px' }}>
                <Link href="/admin/settings/users" className="card" style={{ textDecoration: 'none', color: 'inherit', padding: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 0.25rem', fontWeight: 600 }}>Manage Users</h3>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Add, edit, or remove admin users.</p>
                </Link>
            </div>
        </div>
    );
}
