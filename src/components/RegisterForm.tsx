'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, UserPlus } from 'lucide-react';
import Link from 'next/link';

interface Participant {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dob: string;
    role: string;
    gender: string;
}

function emptyParticipant(role: string = 'guest'): Participant {
    return { firstName: '', lastName: '', email: '', phone: '', dob: '', role, gender: '' };
}

export default function RegisterClientForm({
    event,
}: {
    event: {
        id: string;
        title: string;
        slug: string;
        eventType: string;
        tiers: { id: string; name: string; price: number; quantity: number | null; quantitySold: number; description: string | null }[];
    };
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedTier, setSelectedTier] = useState(event.tiers[0]?.id || '');
    const [participants, setParticipants] = useState<Participant[]>([
        emptyParticipant('primary'),
    ]);

    const cancelled = searchParams.get('cancelled');

    const isTicketed = event.eventType === 'ticketed_event' && event.tiers.length > 0;
    const activeTier = event.tiers.find(t => t.id === selectedTier);
    const unitPrice = activeTier ? Number(activeTier.price) : 0;
    const total = unitPrice * participants.length;

    const addFamilyMember = () => {
        setParticipants([...participants, emptyParticipant('child')]);
    };

    const removeParticipant = (index: number) => {
        if (index === 0) return;
        setParticipants(participants.filter((_, i) => i !== index));
    };

    const updateParticipant = (index: number, field: string, value: string) => {
        const updated = [...participants];
        updated[index] = { ...updated[index], [field]: value };
        setParticipants(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const primary = participants[0];
        if (!primary.firstName || !primary.lastName) {
            setError('Primary contact name is required');
            setLoading(false);
            return;
        }

        if (!primary.email && !primary.phone) {
            setError('Email or phone is required for the primary contact');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: event.id,
                    tierId: selectedTier || null,
                    participants,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            if (data.type === 'stripe_checkout' && data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
                return;
            }

            // Free registration — redirect to confirmation
            router.push(`/e/${event.slug}/confirmation?submission=${data.submissionId}`);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '0.625rem 0.75rem',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '0.875rem',
        outline: 'none',
    };

    const labelStyle = {
        display: 'block' as const,
        fontSize: '0.8rem',
        fontWeight: 600 as const,
        marginBottom: '0.25rem',
        color: '#374151',
    };

    return (
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 1rem' }}>
            <Link href={`/e/${event.slug}`} style={{ display: 'inline-flex', alignItems: 'center', color: '#6b7280', textDecoration: 'none', marginBottom: '1rem', fontSize: '0.875rem' }}>
                <ArrowLeft size={16} style={{ marginRight: '0.25rem' }} /> Back to Event
            </Link>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Register for {event.title}</h1>

            {cancelled && (
                <div style={{ padding: '0.75rem', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem', color: '#92400e' }}>
                    Payment was cancelled. You can try again below.
                </div>
            )}

            {error && (
                <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem', color: '#dc2626' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Ticket Tier Selection */}
                {isTicketed && (
                    <div style={{ marginBottom: '1.5rem', padding: '1.25rem', border: '1px solid #e5e7eb', borderRadius: '10px', background: '#f9fafb' }}>
                        <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>Select Ticket</h3>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {event.tiers.map(tier => {
                                const available = tier.quantity ? tier.quantity - tier.quantitySold : null;
                                const soldOut = available !== null && available <= 0;
                                return (
                                    <label key={tier.id} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                                        padding: '0.75rem', border: `2px solid ${selectedTier === tier.id ? '#2563eb' : '#e5e7eb'}`,
                                        borderRadius: '8px', cursor: soldOut ? 'not-allowed' : 'pointer',
                                        opacity: soldOut ? 0.5 : 1, background: '#fff',
                                    }}>
                                        <input type="radio" name="tier" value={tier.id} checked={selectedTier === tier.id}
                                            onChange={e => setSelectedTier(e.target.value)} disabled={soldOut} />
                                        <div style={{ flex: 1 }}>
                                            <span style={{ fontWeight: 600 }}>{tier.name}</span>
                                            {tier.description && <span style={{ color: '#6b7280', fontSize: '0.8rem', marginLeft: '0.5rem' }}>— {tier.description}</span>}
                                        </div>
                                        <span style={{ fontWeight: 700 }}>{Number(tier.price) === 0 ? 'Free' : `$${Number(tier.price).toFixed(2)}`}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Participants */}
                {participants.map((p, i) => (
                    <div key={i} style={{ marginBottom: '1.5rem', padding: '1.25rem', border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>
                                {i === 0 ? '👤 Primary Contact' : `👦 Household Member ${i}`}
                            </h3>
                            {i > 0 && (
                                <button type="button" onClick={() => removeParticipant(i)}
                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Trash2 size={14} /> Remove
                                </button>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={labelStyle}>First Name *</label>
                                <input style={inputStyle} value={p.firstName} onChange={e => updateParticipant(i, 'firstName', e.target.value)} required />
                            </div>
                            <div>
                                <label style={labelStyle}>Last Name *</label>
                                <input style={inputStyle} value={p.lastName} onChange={e => updateParticipant(i, 'lastName', e.target.value)} required />
                            </div>
                            {i === 0 && (
                                <>
                                    <div>
                                        <label style={labelStyle}>Email {!p.phone ? '*' : ''}</label>
                                        <input style={inputStyle} type="email" value={p.email} onChange={e => updateParticipant(i, 'email', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Phone {!p.email ? '*' : ''}</label>
                                        <input style={inputStyle} type="tel" value={p.phone} onChange={e => updateParticipant(i, 'phone', e.target.value)} />
                                    </div>
                                </>
                            )}
                            <div>
                                <label style={labelStyle}>Date of Birth</label>
                                <input style={inputStyle} type="date" value={p.dob} onChange={e => updateParticipant(i, 'dob', e.target.value)} />
                            </div>
                            {i > 0 && (
                                <div>
                                    <label style={labelStyle}>Relationship</label>
                                    <select style={inputStyle} value={p.role} onChange={e => updateParticipant(i, 'role', e.target.value)}>
                                        <option value="child">Child</option>
                                        <option value="spouse">Spouse</option>
                                        <option value="guest">Guest</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                <button type="button" onClick={addFamilyMember}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%',
                        padding: '0.75rem', border: '2px dashed #d1d5db', borderRadius: '10px',
                        background: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.875rem',
                        fontWeight: 500, justifyContent: 'center', marginBottom: '1.5rem',
                    }}>
                    <UserPlus size={18} /> Add Household Member
                </button>

                {/* Total / Submit */}
                <div style={{
                    padding: '1.25rem', background: '#f0f9ff', border: '1px solid #bae6fd',
                    borderRadius: '10px', marginBottom: '1rem',
                }}>
                    {isTicketed && total > 0 ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>{participants.length} × ${unitPrice.toFixed(2)}</span>
                            <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>Total: ${total.toFixed(2)}</span>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#166534', fontWeight: 600 }}>Free Registration</div>
                    )}
                </div>

                <button type="submit" disabled={loading}
                    style={{
                        width: '100%', padding: '1rem', background: '#2563eb', color: 'white',
                        border: 'none', borderRadius: '10px', fontSize: '1.1rem', fontWeight: 700,
                        cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1,
                    }}>
                    {loading
                        ? 'Processing...'
                        : isTicketed && total > 0
                            ? `Pay $${total.toFixed(2)} & Register`
                            : 'Register Now'
                    }
                </button>
            </form>
        </div>
    );
}
