'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FlagActionsProps {
    flagId: string;
    actionType: string;
    undoneAt: string | null;
    permanentlyDeletedAt: string | null;
}

export default function FlagActions({ flagId, actionType, undoneAt, permanentlyDeletedAt }: FlagActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showUndoConfirm, setShowUndoConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteText, setDeleteText] = useState('');
    const [error, setError] = useState('');

    const isUndone = !!undoneAt;
    const isFinalized = !!permanentlyDeletedAt;
    const isDisabled = isUndone || isFinalized;

    const handleUndo = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/people/flags/${flagId}/undo`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setShowUndoConfirm(false);
            router.refresh();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handlePermanentDelete = async () => {
        if (deleteText !== 'DELETE') return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/people/flags/${flagId}/delete`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setShowDeleteConfirm(false);
            setDeleteText('');
            router.refresh();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    // Status badge
    const getStatusBadge = () => {
        if (isFinalized) return { label: 'Finalized', bg: '#1e293b', color: '#fff' };
        if (isUndone) return { label: 'Undone', bg: '#dcfce7', color: '#166534' };
        if (actionType === 'merge') return { label: 'Merge Active', bg: '#fee2e2', color: '#991b1b' };
        return { label: 'Flag Active', bg: '#fef9c3', color: '#92400e' };
    };

    const badge = getStatusBadge();

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Status Badge */}
            <span style={{
                padding: '0.2rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.7rem',
                fontWeight: 700,
                background: badge.bg,
                color: badge.color,
                textTransform: 'uppercase',
                letterSpacing: '0.025em'
            }}>
                {badge.label}
            </span>

            {/* Action Buttons */}
            {!isDisabled && (
                <>
                    {actionType === 'flag' && (
                        <button
                            onClick={() => setShowUndoConfirm(true)}
                            style={{
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.75rem',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.25rem',
                                cursor: 'pointer',
                                fontWeight: 500
                            }}
                        >
                            Undo Flag
                        </button>
                    )}

                    {actionType === 'merge' && (
                        <>
                            <button
                                onClick={() => setShowUndoConfirm(true)}
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.75rem',
                                    background: '#f59e0b',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                Undo Merge
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.75rem',
                                    background: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                Delete Permanently
                            </button>
                        </>
                    )}
                </>
            )}

            {/* Undo Confirmation Modal */}
            {showUndoConfirm && (
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
                        maxWidth: '420px',
                        boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
                    }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>
                            {actionType === 'flag' ? '↩️ Undo Flag' : '↩️ Undo Merge'}
                        </h3>
                        <p style={{ color: '#4b5563', marginBottom: '1rem', fontSize: '0.875rem' }}>
                            {actionType === 'flag'
                                ? 'This will remove the flag from this person.'
                                : 'This will restore the merged person and all related records.'}
                        </p>
                        {error && (
                            <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.5rem', borderRadius: '0.25rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
                                {error}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={handleUndo}
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    padding: '0.6rem',
                                    background: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontWeight: 600
                                }}
                            >
                                {loading ? 'Processing...' : 'Confirm Undo'}
                            </button>
                            <button
                                onClick={() => { setShowUndoConfirm(false); setError(''); }}
                                disabled={loading}
                                style={{
                                    padding: '0.6rem 1rem',
                                    background: 'white',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Permanent Delete Confirmation Modal */}
            {showDeleteConfirm && (
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
                        maxWidth: '420px',
                        boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
                    }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#991b1b', marginBottom: '1rem' }}>
                            ⚠️ Permanently Finalize Merge
                        </h3>
                        <div style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '0.5rem',
                            padding: '0.75rem',
                            marginBottom: '1rem',
                            fontSize: '0.85rem',
                            color: '#991b1b'
                        }}>
                            <strong>This permanently finalizes the merge and cannot be undone.</strong>
                            <br />The snapshot data will be deleted. You will no longer be able to undo this merge.
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.25rem', color: '#4b5563' }}>
                                Type <strong>DELETE</strong> to confirm:
                            </label>
                            <input
                                type="text"
                                value={deleteText}
                                onChange={(e) => setDeleteText(e.target.value)}
                                placeholder="DELETE"
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem'
                                }}
                            />
                        </div>
                        {error && (
                            <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.5rem', borderRadius: '0.25rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
                                {error}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={handlePermanentDelete}
                                disabled={loading || deleteText !== 'DELETE'}
                                style={{
                                    flex: 1,
                                    padding: '0.6rem',
                                    background: deleteText === 'DELETE' ? '#dc2626' : '#9ca3af',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    cursor: loading || deleteText !== 'DELETE' ? 'not-allowed' : 'pointer',
                                    fontWeight: 600
                                }}
                            >
                                {loading ? 'Finalizing...' : 'Permanently Delete'}
                            </button>
                            <button
                                onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); setError(''); }}
                                disabled={loading}
                                style={{
                                    padding: '0.6rem 1rem',
                                    background: 'white',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
