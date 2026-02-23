'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

export default function CreateEventPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [eventType, setEventType] = useState('ticketed_event');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [locationType, setLocationType] = useState('in_person');
    const [locationName, setLocationName] = useState('');
    const [maxCapacity, setMaxCapacity] = useState('');

    const [tiers, setTiers] = useState<{ name: string; price: string; capacity: string; description: string }[]>([]);

    // Auto-generate slug from title
    const handleTitleChange = (val: string) => {
        setTitle(val);
        setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    };

    const addTier = () => {
        setTiers([...tiers, { name: '', price: '0', capacity: '', description: '' }]);
    };

    const removeTier = (index: number) => {
        setTiers(tiers.filter((_, i) => i !== index));
    };

    const updateTier = (index: number, field: string, value: string) => {
        const updated = [...tiers];
        updated[index] = { ...updated[index], [field]: value };
        setTiers(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    slug,
                    description,
                    eventType,
                    startDate,
                    endDate: endDate || null,
                    locationType,
                    locationName,
                    maxCapacity: maxCapacity ? parseInt(maxCapacity) : null,
                    tiers: tiers.filter(t => t.name).map(t => ({
                        name: t.name,
                        price: parseFloat(t.price) || 0,
                        capacity: t.capacity ? parseInt(t.capacity) : null,
                        description: t.description || null,
                    })),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create event');
            }

            router.push('/admin/events');
            router.refresh();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
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
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: 600 as const,
        marginBottom: '0.375rem',
        color: '#374151',
    };

    return (
        <div className="container" style={{ maxWidth: '700px' }}>
            <Link href="/admin/events" style={{ display: 'inline-flex', alignItems: 'center', color: '#6b7280', textDecoration: 'none', marginBottom: '1rem', fontSize: '0.875rem' }}>
                <ArrowLeft size={16} style={{ marginRight: '0.25rem' }} /> Back to Events
            </Link>
            <h1 className="heading">Create Event</h1>

            {error && (
                <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem' }}>Event Details</h2>

                    <div>
                        <label style={labelStyle}>Event Title *</label>
                        <input style={inputStyle} value={title} onChange={e => handleTitleChange(e.target.value)} required placeholder="e.g. Annual Fundraising Gala" />
                    </div>

                    <div>
                        <label style={labelStyle}>URL Slug</label>
                        <input style={inputStyle} value={slug} onChange={e => setSlug(e.target.value)} placeholder="auto-generated-from-title" />
                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.25rem 0 0' }}>Public URL: /e/{slug || '...'}</p>
                    </div>

                    <div>
                        <label style={labelStyle}>Description</label>
                        <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the event..." />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Event Type *</label>
                            <select style={inputStyle} value={eventType} onChange={e => setEventType(e.target.value)}>
                                <option value="ticketed_event">Ticketed Event</option>
                                <option value="family_program">Household Program (Free)</option>
                                <option value="recurring_program">Recurring Program</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Max Capacity</label>
                            <input style={inputStyle} type="number" value={maxCapacity} onChange={e => setMaxCapacity(e.target.value)} placeholder="Unlimited" />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Start Date & Time *</label>
                            <input style={inputStyle} type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                        </div>
                        <div>
                            <label style={labelStyle}>End Date & Time</label>
                            <input style={inputStyle} type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Location Type *</label>
                            <select style={inputStyle} value={locationType} onChange={e => setLocationType(e.target.value)}>
                                <option value="in_person">In Person</option>
                                <option value="online">Online</option>
                                <option value="hybrid">Hybrid</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Location Name / Venue</label>
                            <input style={inputStyle} value={locationName} onChange={e => setLocationName(e.target.value)} placeholder="e.g. Convention Center, 123 Main St" />
                        </div>
                    </div>
                </div>

                {/* Ticket Tiers */}
                {eventType === 'ticketed_event' && (
                    <div className="card" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Ticket Tiers</h2>
                            <button type="button" onClick={addTier} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', fontSize: '0.8rem', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                                <Plus size={14} /> Add Tier
                            </button>
                        </div>

                        {tiers.length === 0 && (
                            <p style={{ fontSize: '0.875rem', color: '#9ca3af', textAlign: 'center', padding: '1rem' }}>No ticket tiers yet. Add one to enable paid registration.</p>
                        )}

                        {tiers.map((tier, i) => (
                            <div key={i} style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Tier {i + 1}</span>
                                    <button type="button" onClick={() => removeTier(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
                                    <div>
                                        <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Name</label>
                                        <input style={inputStyle} value={tier.name} onChange={e => updateTier(i, 'name', e.target.value)} placeholder="e.g. General Admission" />
                                    </div>
                                    <div>
                                        <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Price ($)</label>
                                        <input style={inputStyle} type="number" step="0.01" value={tier.price} onChange={e => updateTier(i, 'price', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Capacity</label>
                                        <input style={inputStyle} type="number" value={tier.capacity} onChange={e => updateTier(i, 'capacity', e.target.value)} placeholder="∞" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <Link href="/admin/events" className="btn" style={{ background: '#f3f4f6', color: '#374151' }}>Cancel</Link>
                    <button type="submit" className="btn" disabled={loading} style={{ background: '#2563eb', color: 'white', opacity: loading ? 0.6 : 1 }}>
                        {loading ? 'Creating...' : 'Create Event'}
                    </button>
                </div>
            </form>
        </div>
    );
}
