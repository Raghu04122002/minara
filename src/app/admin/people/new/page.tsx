'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewPersonPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [warning, setWarning] = useState('');

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        primaryEmail: '',
        primaryPhone: '',
        transactionType: 'event_ticket',
        description: '',
        amount: ''
    });

    const checkDuplicates = async () => {
        if (!form.primaryEmail && !form.primaryPhone) return;

        try {
            const res = await fetch(`/api/people/check-duplicate?email=${encodeURIComponent(form.primaryEmail)}&phone=${encodeURIComponent(form.primaryPhone)}`);
            const data = await res.json();

            if (data.exists) {
                setWarning(`A person with this ${data.matchedOn} already exists: ${data.existingName}`);
            } else {
                setWarning('');
            }
        } catch (e) {
            console.error('Duplicate check failed:', e);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/people', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create person');
            }

            const person = await res.json();
            router.push(`/people/${person.id}`);
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

    return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <Link href="/admin/people" style={{ color: '#6b7280', textDecoration: 'none' }}>
                    ← Back to People
                </Link>
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                Add New Person
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

            {warning && (
                <div style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem'
                }}>
                    ⚠️ {warning}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

                <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
                        Email
                    </label>
                    <input
                        type="email"
                        value={form.primaryEmail}
                        onChange={(e) => setForm({ ...form, primaryEmail: e.target.value })}
                        onBlur={checkDuplicates}
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
                        onBlur={checkDuplicates}
                        style={inputStyle}
                    />
                </div>

                {/* Transaction Section */}
                <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb'
                }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#374151' }}>
                        Add Transaction (Optional)
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
                                Type
                            </label>
                            <select
                                value={form.transactionType}
                                onChange={(e) => setForm({ ...form, transactionType: e.target.value })}
                                style={inputStyle}
                            >
                                <option value="event_ticket">Event Ticket</option>
                                <option value="donation">Donation</option>
                                <option value="program">Program</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
                                Amount ($)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.amount}
                                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                placeholder="0.00"
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
                            Description
                        </label>
                        <input
                            type="text"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="e.g., Annual Gala 2024 or Monthly Donation"
                            style={inputStyle}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
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
                        {loading ? 'Creating...' : 'Create Person'}
                    </button>
                    <Link
                        href="/admin/people"
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
