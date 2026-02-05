'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Person {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
}

export default function NewFamilyPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState('');
    const [people, setPeople] = useState<Person[]>([]);
    const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
    const [familyName, setFamilyName] = useState('');

    useEffect(() => {
        async function fetchPeople() {
            try {
                // Get all people without a family
                const res = await fetch('/api/people?noFamily=true');
                const data = await res.json();
                setPeople(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Failed to fetch people:', err);
            } finally {
                setFetching(false);
            }
        }
        fetchPeople();
    }, []);

    const togglePerson = (personId: string) => {
        setSelectedPeople(prev =>
            prev.includes(personId)
                ? prev.filter(id => id !== personId)
                : [...prev, personId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedPeople.length < 2) {
            setError('Please select at least 2 people to create a family');
            return;
        }

        if (!familyName.trim()) {
            setError('Please enter a family name');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Create the family
            const familyRes = await fetch('/api/families', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: familyName })
            });

            if (!familyRes.ok) throw new Error('Failed to create family');
            const family = await familyRes.json();

            // Add each selected person to the family
            for (const personId of selectedPeople) {
                await fetch(`/api/families/${family.id}/members`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ personId, role: 'UNKNOWN' })
                });
            }

            router.push(`/families/${family.id}`);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '0.5rem',
        border: '1px solid #d1d5db',
        borderRadius: '0.375rem'
    };

    if (fetching) {
        return (
            <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
                <p>Loading people...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <Link href="/families" style={{ color: '#6b7280', textDecoration: 'none' }}>
                    ← Back to Families
                </Link>
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                Create New Family
            </h1>

            {error && (
                <div style={{
                    background: '#fee2e2',
                    color: '#dc2626',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem'
                }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
                        Family Name *
                    </label>
                    <input
                        type="text"
                        value={familyName}
                        onChange={(e) => setFamilyName(e.target.value)}
                        placeholder="e.g., Smith Family"
                        required
                        style={inputStyle}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                        Select Members (minimum 2) *
                    </label>
                    <div style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        marginBottom: '0.5rem'
                    }}>
                        {selectedPeople.length} selected
                    </div>

                    {people.length === 0 ? (
                        <div style={{
                            padding: '1rem',
                            background: '#f9fafb',
                            borderRadius: '0.5rem',
                            color: '#6b7280',
                            textAlign: 'center'
                        }}>
                            No people available without a family.
                            <br />
                            <Link href="/people/new" style={{ color: '#3b82f6' }}>Add a person first</Link>
                        </div>
                    ) : (
                        <div style={{
                            maxHeight: '300px',
                            overflow: 'auto',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem'
                        }}>
                            {people.map(person => (
                                <label
                                    key={person.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '0.75rem 1rem',
                                        borderBottom: '1px solid #e5e7eb',
                                        cursor: 'pointer',
                                        background: selectedPeople.includes(person.id) ? '#eff6ff' : 'white'
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedPeople.includes(person.id)}
                                        onChange={() => togglePerson(person.id)}
                                        style={{ marginRight: '0.75rem' }}
                                    />
                                    <div>
                                        <div style={{ fontWeight: 500 }}>
                                            {person.firstName} {person.lastName}
                                        </div>
                                        {person.email && (
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                {person.email}
                                            </div>
                                        )}
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button
                        type="submit"
                        disabled={loading || selectedPeople.length < 2}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: selectedPeople.length < 2 ? '#9ca3af' : '#3b82f6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: loading || selectedPeople.length < 2 ? 'not-allowed' : 'pointer',
                            fontWeight: 500
                        }}
                    >
                        {loading ? 'Creating...' : 'Create Family'}
                    </button>
                    <Link
                        href="/families"
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#fff',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem',
                            textDecoration: 'none',
                            fontWeight: 500
                        }}
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}
