'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Flag } from 'lucide-react';

interface Person {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
}

interface FlagPersonButtonProps {
    personId: string;
    personName: string;
}

export default function FlagPersonButton({ personId, personName }: FlagPersonButtonProps) {
    const router = useRouter();
    const [showModal, setShowModal] = useState(false);
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const [duplicatePersonId, setDuplicatePersonId] = useState('');
    const [people, setPeople] = useState<Person[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [showMergeConfirm, setShowMergeConfirm] = useState(false);
    const [error, setError] = useState('');

    // Fetch people for duplicate selection
    useEffect(() => {
        if (reason === 'repeated_person') {
            fetch('/api/people')
                .then(res => res.json())
                .then(data => {
                    const filtered = (Array.isArray(data) ? data : []).filter(
                        (p: Person) => p.id !== personId
                    );
                    setPeople(filtered);
                })
                .catch(console.error);
        }
    }, [reason, personId]);

    const filteredPeople = people.filter(p => {
        const name = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
        const email = (p.email || '').toLowerCase();
        const term = searchTerm.toLowerCase();
        return name.includes(term) || email.includes(term);
    });

    const handleSubmit = async () => {
        if (!reason) {
            setError('Please select a reason');
            return;
        }

        if (reason === 'repeated_person' && !duplicatePersonId) {
            setError('Please select the person to merge into');
            return;
        }

        // For merge, show confirmation first
        if (reason === 'repeated_person' && !showMergeConfirm) {
            setShowMergeConfirm(true);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/people/${personId}/flag`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason, duplicatePersonId, notes })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to flag person');
            }

            setShowModal(false);
            setShowMergeConfirm(false);

            if (data.merged && data.targetPersonId) {
                // Redirect to surviving person
                router.push(`/people/${data.targetPersonId}`);
                router.refresh();
                alert('People successfully merged.');
            } else {
                router.refresh();
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const selectedPerson = people.find(p => p.id === duplicatePersonId);

    const reasons = [
        { value: 'missing_details', label: 'Missing Details' },
        { value: 'repeated_person', label: 'Repeated Person' },
        { value: 'summary_row', label: 'Total / Summary Row' },
        { value: 'other', label: 'Other' }
    ];

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.5rem 0.75rem',
                    background: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #fcd34d',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500
                }}
            >
                <Flag size={14} /> Flag Person
            </button>

            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '0.75rem',
                        padding: '2rem',
                        width: '100%',
                        maxWidth: '500px',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                    }}>
                        {/* Merge confirmation overlay */}
                        {showMergeConfirm ? (
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#991b1b', marginBottom: '1rem' }}>
                                    ⚠️ Confirm Merge
                                </h2>
                                <div style={{
                                    background: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    borderRadius: '0.5rem',
                                    padding: '1rem',
                                    marginBottom: '1rem',
                                    fontSize: '0.875rem',
                                    color: '#991b1b'
                                }}>
                                    <strong>This will permanently merge records and cannot be undone.</strong>
                                    <br /><br />
                                    <strong>{personName}</strong> will be deleted and all their transactions
                                    will be moved to <strong>{selectedPerson?.firstName} {selectedPerson?.lastName}</strong>.
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem',
                                            background: '#dc2626',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '0.375rem',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            fontWeight: 600
                                        }}
                                    >
                                        {loading ? 'Merging...' : 'Yes, Merge & Delete'}
                                    </button>
                                    <button
                                        onClick={() => setShowMergeConfirm(false)}
                                        disabled={loading}
                                        style={{
                                            padding: '0.75rem 1rem',
                                            background: 'white',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '0.375rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Back
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                                    Flag Person
                                </h2>
                                <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
                                    Flagging <strong>{personName}</strong>
                                </p>

                                {error && (
                                    <div style={{
                                        background: '#fee2e2',
                                        color: '#dc2626',
                                        padding: '0.75rem',
                                        borderRadius: '0.375rem',
                                        marginBottom: '1rem',
                                        fontSize: '0.875rem'
                                    }}>
                                        {error}
                                    </div>
                                )}

                                {/* Reason dropdown */}
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.25rem' }}>
                                        Reason *
                                    </label>
                                    <select
                                        value={reason}
                                        onChange={(e) => {
                                            setReason(e.target.value);
                                            setDuplicatePersonId('');
                                            setSearchTerm('');
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '0.375rem'
                                        }}
                                    >
                                        <option value="">Select reason...</option>
                                        {reasons.map(r => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Duplicate person selection */}
                                {reason === 'repeated_person' && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.25rem' }}>
                                            Merge into person *
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Search by name or email..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '0.375rem',
                                                marginBottom: '0.5rem'
                                            }}
                                        />

                                        {selectedPerson && (
                                            <div style={{
                                                padding: '0.5rem 0.75rem',
                                                background: '#dcfce7',
                                                borderRadius: '0.375rem',
                                                marginBottom: '0.5rem',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                fontSize: '0.875rem'
                                            }}>
                                                <span>
                                                    ✓ {selectedPerson.firstName} {selectedPerson.lastName}
                                                    {selectedPerson.email && <span style={{ color: '#6b7280' }}> ({selectedPerson.email})</span>}
                                                </span>
                                                <button
                                                    onClick={() => setDuplicatePersonId('')}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: '#dc2626',
                                                        fontWeight: 600
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}

                                        {!selectedPerson && (
                                            <div style={{
                                                maxHeight: '200px',
                                                overflow: 'auto',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '0.375rem'
                                            }}>
                                                {filteredPeople.length === 0 ? (
                                                    <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
                                                        No matching people found
                                                    </div>
                                                ) : (
                                                    filteredPeople.slice(0, 20).map(p => (
                                                        <button
                                                            key={p.id}
                                                            onClick={() => setDuplicatePersonId(p.id)}
                                                            style={{
                                                                display: 'block',
                                                                width: '100%',
                                                                padding: '0.5rem 0.75rem',
                                                                textAlign: 'left',
                                                                background: 'white',
                                                                border: 'none',
                                                                borderBottom: '1px solid #f3f4f6',
                                                                cursor: 'pointer',
                                                                fontSize: '0.875rem'
                                                            }}
                                                            onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                                                            onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                                                        >
                                                            <div style={{ fontWeight: 500 }}>
                                                                {p.firstName} {p.lastName}
                                                            </div>
                                                            {p.email && (
                                                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{p.email}</div>
                                                            )}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Notes */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.25rem' }}>
                                        Notes (optional)
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Additional details..."
                                        rows={3}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '0.375rem',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading || !reason}
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem',
                                            background: reason === 'repeated_person' ? '#dc2626' : '#f59e0b',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '0.375rem',
                                            cursor: loading || !reason ? 'not-allowed' : 'pointer',
                                            fontWeight: 600
                                        }}
                                    >
                                        {loading ? 'Processing...' : reason === 'repeated_person' ? 'Merge & Flag' : 'Flag Person'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowModal(false);
                                            setReason('');
                                            setNotes('');
                                            setDuplicatePersonId('');
                                            setError('');
                                        }}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            background: 'white',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '0.375rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
