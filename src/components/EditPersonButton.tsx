'use client';

import { useRouter } from 'next/navigation';
import { Edit } from 'lucide-react';

interface EditPersonButtonProps {
    personId: string;
}

export default function EditPersonButton({ personId }: EditPersonButtonProps) {
    const router = useRouter();

    return (
        <button
            onClick={() => router.push(`/people/${personId}/edit`)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: '#eff6ff',
                color: '#2563eb',
                border: '1px solid #bfdbfe',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500
            }}
        >
            <Edit size={14} />
            Edit Person
        </button>
    );
}
