'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Household {
    id: string;
    name: string;
}

interface AddToFamilyProps {
    personId: string;
    currentFamilyId?: string | null;
}

export default function AddToFamily({ personId, currentFamilyId }: AddToFamilyProps) {
    const router = useRouter();
    const [households, setFamilies] = useState<Household[]>([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
    const [selectedFamilyId, setSelectedFamilyId] = useState('');
    const [newFamilyName, setNewFamilyName] = useState('');
    const [mode, setMode] = useState<'existing' | 'new'>('existing');

    useEffect(() => {
        if (showForm) {
            fetch('/api/families')
                .then(res => res.json())
                .then(data => setFamilies(Array.isArray(data) ? data : []))
                .catch(console.error);
        }
    }, [showForm]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let householdId = selectedFamilyId;

            // Create new household if needed
            if (mode === 'new' && newFamilyName) {
                const res = await fetch('/api/families', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ householdName: newFamilyName })
                });
                const household = await res.json();
                householdId = household.id;
            }

            if (!householdId) {
                alert('Please select or create a household');
                setLoading(false);
                return;
            }

            // Add person to household
            await fetch(`/api/families/${householdId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ personId, roleInHousehold: 'guest' })
            });

            setShowForm(false);
            router.refresh();
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to add to household');
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async () => {
        if (!currentFamilyId) return;

        setLoading(true);
        try {
            await fetch(`/api/families/${currentFamilyId}/members?personId=${personId}`, {
                method: 'DELETE'
            });
            setShowRemoveConfirm(false);
            router.refresh();
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to remove from household');
        } finally {
            setLoading(false);
        }
    };

    // Show remove confirmation dialog
    if (showRemoveConfirm) {
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
                    Remove from household?
                </div>
                <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>
                    This person will be unlinked from the household.
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button
                        onClick={handleRemove}
                        disabled={loading}
                        style={{
                            padding: '0.5rem 1rem',
                            background: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600
                        }}
                    >
                        {loading ? 'Removing...' : 'Yes, Remove'}
                    </button>
                    <button
                        onClick={() => setShowRemoveConfirm(false)}
                        disabled={loading}
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

    if (!showForm) {
        return (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                    onClick={() => setShowForm(true)}
                    style={{
                        padding: '0.5rem 1rem',
                        background: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                    }}
                >
                    {currentFamilyId ? 'Change Household' : '+ Add to Household'}
                </button>
                {currentFamilyId && (
                    <button
                        onClick={() => setShowRemoveConfirm(true)}
                        disabled={loading}
                        style={{
                            padding: '0.5rem 1rem',
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                        }}
                    >
                        Remove
                    </button>
                )}
            </div>
        );
    }

    return (
        <div style={{
            background: '#f9fafb',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
            marginTop: '1rem'
        }}>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <input
                            type="radio"
                            checked={mode === 'existing'}
                            onChange={() => setMode('existing')}
                            style={{ marginRight: '0.5rem' }}
                        />
                        Add to existing household
                    </label>
                    {mode === 'existing' && (
                        <select
                            value={selectedFamilyId}
                            onChange={(e) => setSelectedFamilyId(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid #d1d5db'
                            }}
                        >
                            <option value="">Select a household...</option>
                            {households.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <input
                            type="radio"
                            checked={mode === 'new'}
                            onChange={() => setMode('new')}
                            style={{ marginRight: '0.5rem' }}
                        />
                        Create new household
                    </label>
                    {mode === 'new' && (
                        <input
                            type="text"
                            value={newFamilyName}
                            onChange={(e) => setNewFamilyName(e.target.value)}
                            placeholder="Household name (e.g., Smith Household)"
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid #d1d5db'
                            }}
                        />
                    )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '0.5rem 1rem',
                            background: '#22c55e',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer'
                        }}
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        style={{
                            padding: '0.5rem 1rem',
                            background: '#fff',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
