'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LogoutButton() {
    const router = useRouter();
    const supabase = createClient();

    async function handleLogout() {
        await supabase.auth.signOut();
        router.refresh(); // Refresh to let middleware redirect or clear state
        router.push('/login');
    }

    return (
        <button
            onClick={handleLogout}
            className="btn"
            style={{
                background: 'transparent',
                color: '#6b7280',
                border: '1px solid #e5e7eb',
                fontSize: '0.875rem',
                marginLeft: '1rem'
            }}
        >
            <LogOut size={16} style={{ marginRight: '0.5rem' }} />
            Sign Out
        </button>
    );
}
