'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

export default function ResolveFlagButton({ transactionId }: { transactionId: string }) {
    const [loading, setLoading] = useState(false);
    const [confirmMode, setConfirmMode] = useState(false);
    const router = useRouter();

    const handleClick = async () => {
        // First click: enter confirm mode
        if (!confirmMode) {
            setConfirmMode(true);
            // Auto-reset confirm mode after 3 seconds
            setTimeout(() => setConfirmMode(false), 3000);
            return;
        }

        // Second click: actually approve
        setLoading(true);
        try {
            const res = await fetch(`/api/transactions/${transactionId}/resolve`, {
                method: 'PATCH',
            });

            if (res.ok) {
                router.refresh();
            }
        } catch (error) {
            console.error('Error resolving transaction:', error);
        } finally {
            setLoading(false);
            setConfirmMode(false);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className="btn"
            style={{
                padding: '0.4rem 0.8rem',
                fontSize: '0.75rem',
                background: confirmMode ? '#166534' : '#dcfce7',
                color: confirmMode ? 'white' : '#166534',
                border: '1px solid #bbf7d0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s'
            }}
        >
            <CheckCircle size={14} />
            {loading ? 'Processing...' : confirmMode ? 'Confirm' : 'Approve'}
        </button>
    );
}

