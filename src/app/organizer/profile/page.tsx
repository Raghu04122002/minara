'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, Save, Building } from 'lucide-react';

export default function OrganizerProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [organizationName, setOrganizationName] = useState('');
    const [email, setEmail] = useState('');

    const supabase = createClient();

    useEffect(() => {
        async function fetchUser() {
            setFetching(true);
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) {
                router.push('/organizer/login');
                return;
            }

            setEmail(user.email || '');
            setFirstName(user.user_metadata?.firstName || '');
            setLastName(user.user_metadata?.lastName || '');
            setOrganizationName(user.user_metadata?.organizationName || '');
            setFetching(false);
        }

        fetchUser();
    }, [router, supabase.auth]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                data: {
                    firstName,
                    lastName,
                    organizationName,
                }
            });

            if (updateError) throw updateError;

            setSuccess('Profile updated successfully.');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="container" style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <div style={{ color: '#64748b' }}>Loading profile...</div>
            </div>
        );
    }

    const inputStyle = {
        width: '100%',
        padding: '0.625rem 0.75rem',
        border: '1px solid #cbd5e1',
        borderRadius: '6px',
        fontSize: '0.875rem',
        outline: 'none',
        color: '#0f172a',
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: 600 as const,
        marginBottom: '0.375rem',
        color: '#475569',
    };

    return (
        <div className="container" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
            <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a', marginBottom: '2rem' }}>
                <User size={28} /> Organizer Profile
            </h1>

            {error && (
                <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                    {error}
                </div>
            )}

            {success && (
                <div style={{ padding: '1rem', background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: '8px', color: '#047857', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                    {success}
                </div>
            )}

            <form onSubmit={handleUpdate}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'white', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
                    <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '0.5rem' }}>
                        <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>Personal Details</h2>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#64748b' }}>Update your organizer information.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>First Name</label>
                            <input
                                style={{ ...inputStyle, transition: 'border-color 0.15s ease-in-out' }}
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Last Name</label>
                            <input
                                style={{ ...inputStyle, transition: 'border-color 0.15s ease-in-out' }}
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Email Address</label>
                        <input
                            style={{ ...inputStyle, background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' }}
                            value={email}
                            disabled
                            readOnly
                        />
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.25rem 0 0' }}>Email address cannot be changed directly.</p>
                    </div>

                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                        <h2 style={{ margin: '0 0 1rem', fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Building size={18} /> Organization Details
                        </h2>

                        <div>
                            <label style={labelStyle}>Organization Name</label>
                            <input
                                style={{ ...inputStyle, transition: 'border-color 0.15s ease-in-out' }}
                                value={organizationName}
                                onChange={(e) => setOrganizationName(e.target.value)}
                                required
                                placeholder="e.g. My Foundation"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.5rem',
                                background: '#0f172a',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1,
                                transition: 'opacity 0.2s',
                            }}
                        >
                            <Save size={16} />
                            {loading ? 'Saving Changes...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
