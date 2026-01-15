'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';

export default function RunHouseholdingButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    async function run() {
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch('/api/householding', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setResult(`Created ${data.familiesCreated} families from ${data.peopleGrouped} people.`);
            router.refresh();
        } catch (err) {
            setResult(`Error: ${(err as Error).message}`);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button
                onClick={run}
                disabled={loading}
                className="btn"
                style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }}
            >
                <Users size={16} style={{ marginRight: '0.5rem' }} />
                {loading ? 'Running...' : 'Run Householding Logic'}
            </button>
            {result && <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#4b5563' }}>{result}</p>}
        </div>
    );
}
