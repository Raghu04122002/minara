'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

interface DeletePersonButtonProps {
    personId: string;
    personName: string;
}

export default function DeletePersonButton({ personId, personName }: DeletePersonButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/people/${personId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                router.push('/people');
                router.refresh();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete person');
            }
        } catch (error) {
            alert('Failed to delete person');
        } finally {
            setIsDeleting(false);
            setShowConfirm(false);
        }
    };

    if (showConfirm) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                padding: '1rem',
                background: '#fee2e2',
                borderRadius: '0.5rem',
                border: '1px solid #fecaca'
            }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#991b1b' }}>
                    Delete {personName}?
                </div>
                <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>
                    This will also delete all transactions and family memberships.
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        style={{
                            padding: '0.5rem 1rem',
                            background: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: isDeleting ? 'not-allowed' : 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600
                        }}
                    >
                        {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                    <button
                        onClick={() => setShowConfirm(false)}
                        disabled={isDeleting}
                        style={{
                            padding: '0.5rem 1rem',
                            background: 'white',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={() => setShowConfirm(true)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: '#fee2e2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500
            }}
        >
            <Trash2 size={14} />
            Delete Person
        </button>
    );
}
