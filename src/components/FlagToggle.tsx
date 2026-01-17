'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function FlagToggle({ initialChecked }: { initialChecked: boolean }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        const params = new URLSearchParams(searchParams.toString());
        if (checked) {
            params.set('includeFlagged', 'true');
        } else {
            params.delete('includeFlagged');
        }
        router.push(`/?${params.toString()}`);
    };

    return (
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#374151' }}>
            <input
                type="checkbox"
                checked={initialChecked}
                onChange={handleChange}
                style={{ cursor: 'pointer' }}
            />
            Include flagged transactions
        </label>
    );
}
