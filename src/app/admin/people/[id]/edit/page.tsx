'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';
import { Trash2, Plus } from 'lucide-react';

interface Transaction {
    id: string;
    type: string;
    description: string | null;
    amount: number;
    occurredAt: string;
}

interface EditPersonPageProps {
    params: Promise<{ id: string }>;
}

export default function EditPersonPage({ params }: EditPersonPageProps) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        primaryEmail: '',
        primaryPhone: ''
    });

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [editingTx, setEditingTx] = useState<string | null>(null);
    const [showAddTx, setShowAddTx] = useState(false);
    const [newTx, setNewTx] = useState({
        type: 'event_ticket',
        description: '',
        amount: '',
        occurredAt: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        async function fetchPerson() {
            try {
                const res = await fetch(`/api/people/${id}`);
                if (!res.ok) throw new Error('Failed to fetch person');
                const person = await res.json();
                setForm({
                    firstName: person.firstName || '',
                    lastName: person.lastName || '',
                    primaryEmail: person.primaryEmail || '',
                    primaryPhone: person.primaryPhone || ''
                });
                setTransactions(person.transactions || []);
            } catch (err) {
                setError('Failed to load person data');
            } finally {
                setFetching(false);
            }
        }
        fetchPerson();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/people/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update person');
            }

            router.push(`/people/${id}`);
            router.refresh();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTransaction = async (txId: string, txData: Transaction) => {
        try {
            const res = await fetch(`/api/transactions/${txId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(txData)
            });

            if (res.ok) {
                const updated = await res.json();
                setTransactions(prev => prev.map(t => t.id === txId ? updated : t));
                setEditingTx(null);
            }
        } catch (err) {
            alert('Failed to update transaction');
        }
    };

    const handleDeleteTransaction = async (txId: string) => {
        try {
            const res = await fetch(`/api/transactions/${txId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setTransactions(prev => prev.filter(t => t.id !== txId));
            }
        } catch (err) {
            alert('Failed to delete transaction');
        }
    };

    const handleAddTransaction = async () => {
        if (!newTx.amount) {
            alert('Amount is required');
            return;
        }

        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newTx, personId: id })
            });

            if (res.ok) {
                const created = await res.json();
                setTransactions(prev => [...prev, created]);
                setShowAddTx(false);
                setNewTx({
                    type: 'event_ticket',
                    description: '',
                    amount: '',
                    occurredAt: new Date().toISOString().split('T')[0]
                });
            }
        } catch (err) {
            alert('Failed to add transaction');
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '0.5rem',
        border: '1px solid #d1d5db',
        borderRadius: '0.375rem'
    };

    const smallInputStyle = {
        padding: '0.25rem 0.5rem',
        border: '1px solid #d1d5db',
        borderRadius: '0.25rem',
        fontSize: '0.875rem'
    };

    if (fetching) {
        return (
            <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <Link href={`/admin/people/${id}`} style={{ color: '#6b7280', textDecoration: 'none' }}>
                    ← Back to Person
                </Link>
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                Edit Person
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

            {/* Person Details Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Personal Information</h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
                            First Name *
                        </label>
                        <input
                            type="text"
                            value={form.firstName}
                            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                            required
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
                            Last Name *
                        </label>
                        <input
                            type="text"
                            value={form.lastName}
                            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                            required
                            style={inputStyle}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={form.primaryEmail}
                            onChange={(e) => setForm({ ...form, primaryEmail: e.target.value })}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
                            Phone
                        </label>
                        <input
                            type="tel"
                            value={form.primaryPhone}
                            onChange={(e) => setForm({ ...form, primaryPhone: e.target.value })}
                            style={inputStyle}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#3b82f6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: loading ? 'wait' : 'pointer',
                            fontWeight: 500
                        }}
                    >
                        {loading ? 'Saving...' : 'Save Person Details'}
                    </button>
                    <Link
                        href={`/admin/people/${id}`}
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

            {/* Transactions Section */}
            <div style={{
                padding: '1.5rem',
                background: '#f9fafb',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                        Transactions & Events ({transactions.length})
                    </h2>
                    <button
                        onClick={() => setShowAddTx(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.5rem 1rem',
                            background: '#22c55e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                        }}
                    >
                        <Plus size={14} /> Add Transaction
                    </button>
                </div>

                {/* Add New Transaction Form */}
                {showAddTx && (
                    <div style={{
                        padding: '1rem',
                        background: 'white',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem',
                        border: '1px solid #d1d5db'
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <select
                                value={newTx.type}
                                onChange={(e) => setNewTx({ ...newTx, type: e.target.value })}
                                style={smallInputStyle}
                            >
                                <option value="event_ticket">Event Ticket</option>
                                <option value="donation">Donation</option>
                                <option value="program">Program</option>
                            </select>
                            <input
                                type="text"
                                placeholder="Description"
                                value={newTx.description}
                                onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                                style={smallInputStyle}
                            />
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Amount"
                                value={newTx.amount}
                                onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                                style={smallInputStyle}
                            />
                            <input
                                type="date"
                                value={newTx.occurredAt}
                                onChange={(e) => setNewTx({ ...newTx, occurredAt: e.target.value })}
                                style={smallInputStyle}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={handleAddTransaction}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: '#22c55e',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem'
                                }}
                            >
                                Add
                            </button>
                            <button
                                onClick={() => setShowAddTx(false)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: 'white',
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
                )}

                {transactions.length === 0 ? (
                    <p style={{ color: '#6b7280', textAlign: 'center', padding: '1rem' }}>
                        No transactions yet
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {transactions.map(tx => (
                            <div
                                key={tx.id}
                                style={{
                                    padding: '0.75rem',
                                    background: 'white',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #e5e7eb'
                                }}
                            >
                                {editingTx === tx.id ? (
                                    <TransactionEditRow
                                        tx={tx}
                                        onSave={(data) => handleUpdateTransaction(tx.id, data)}
                                        onCancel={() => setEditingTx(null)}
                                    />
                                ) : (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                background: tx.type === 'donation' ? '#dcfce7' : '#dbeafe',
                                                color: tx.type === 'donation' ? '#166534' : '#1e40af',
                                                borderRadius: '0.25rem',
                                                fontSize: '0.75rem'
                                            }}>
                                                {tx.type}
                                            </span>
                                            <span style={{ color: '#374151' }}>{tx.description || '-'}</span>
                                            <span style={{ fontWeight: 600, color: '#059669' }}>
                                                ${Number(tx.amount).toFixed(2)}
                                            </span>
                                            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                                                {new Date(tx.occurredAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => setEditingTx(tx.id)}
                                                style={{
                                                    padding: '0.25rem 0.5rem',
                                                    background: '#eff6ff',
                                                    color: '#2563eb',
                                                    border: '1px solid #bfdbfe',
                                                    borderRadius: '0.25rem',
                                                    cursor: 'pointer',
                                                    fontSize: '0.75rem'
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTransaction(tx.id)}
                                                style={{
                                                    padding: '0.25rem 0.5rem',
                                                    background: '#fee2e2',
                                                    color: '#dc2626',
                                                    border: '1px solid #fecaca',
                                                    borderRadius: '0.25rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// Inline edit row component
function TransactionEditRow({
    tx,
    onSave,
    onCancel
}: {
    tx: Transaction;
    onSave: (data: Transaction) => void;
    onCancel: () => void;
}) {
    const [data, setData] = useState({
        ...tx,
        occurredAt: new Date(tx.occurredAt).toISOString().split('T')[0]
    });

    const smallInputStyle = {
        padding: '0.25rem 0.5rem',
        border: '1px solid #d1d5db',
        borderRadius: '0.25rem',
        fontSize: '0.875rem'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', gap: '0.5rem' }}>
                <select
                    value={data.type}
                    onChange={(e) => setData({ ...data, type: e.target.value })}
                    style={smallInputStyle}
                >
                    <option value="event_ticket">Event Ticket</option>
                    <option value="donation">Donation</option>
                    <option value="program">Program</option>
                </select>
                <input
                    type="text"
                    value={data.description || ''}
                    onChange={(e) => setData({ ...data, description: e.target.value })}
                    placeholder="Description"
                    style={smallInputStyle}
                />
                <input
                    type="number"
                    step="0.01"
                    value={data.amount}
                    onChange={(e) => setData({ ...data, amount: parseFloat(e.target.value) })}
                    style={smallInputStyle}
                />
                <input
                    type="date"
                    value={data.occurredAt}
                    onChange={(e) => setData({ ...data, occurredAt: e.target.value })}
                    style={smallInputStyle}
                />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                    onClick={() => onSave(data)}
                    style={{
                        padding: '0.25rem 0.75rem',
                        background: '#22c55e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                    }}
                >
                    Save
                </button>
                <button
                    onClick={onCancel}
                    style={{
                        padding: '0.25rem 0.75rem',
                        background: 'white',
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
