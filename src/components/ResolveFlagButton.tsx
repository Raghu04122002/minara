'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

export default function ResolveFlagButton({ transactionId }: { transactionId: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleResolve = async () => {
        if (!confirm('Are you sure you want to approve this transaction and remove the flag?')) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/transactions/${transactionId}/resolve`, {
                method: 'PATCH',
            });

            if (res.ok) {
                router.refresh();
            } else {
                alert('Failed to resolve transaction.');
            }
        } catch (error) {
            console.error('Error resolving transaction:', error);
            alert('An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleResolve}
            disabled={loading}
            className="btn"
            style={{
                padding: '0.4rem 0.8rem',
                fontSize: '0.75rem',
                background: '#dcfce7',
                color: '#166534',
                border: '1px solid #bbf7d0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
            }}
        >
            <CheckCircle size={14} />
            {loading ? 'Processing...' : 'Approve'}
        </button>
    );
}
