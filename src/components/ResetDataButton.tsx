'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';

export default function ResetDataButton() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleReset = async () => {
        if (!confirm('Are you sure you want to DELETE ALL DATA? This cannot be undone.')) return;

        setLoading(true);
        setMessage('');
        try {
            const res = await fetch('/api/reset', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setMessage('Data cleared successfully.');
                window.location.reload(); // Refresh stats
            } else {
                setMessage('Error: ' + data.error);
            }
        } catch (error) {
            setMessage('Error resetting data.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button
                onClick={handleReset}
                disabled={loading}
                style={{
                    padding: '0.75rem 1.5rem',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}
            >
                <Trash2 size={18} />
                {loading ? 'Deleting...' : 'Reset All Data'}
            </button>
            {message && <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: message.includes('Error') ? 'red' : 'green' }}>{message}</p>}
        </div>
    );
}
