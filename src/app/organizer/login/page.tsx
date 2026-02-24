'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function OrganizerLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Local fallback bypass
            if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('mock')) {
                console.log('[LOGIN] Local auth bypass engaged');
                router.refresh();
                router.push('/organizer/events');
                return;
            }

            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError(error.message);
            } else {
                router.refresh();
                router.push('/organizer/events');
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', // Dark theme for organizers
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '420px',
                padding: '2.5rem',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '1rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: '#111827',
                        margin: '0 0 0.5rem 0',
                        letterSpacing: '-0.025em'
                    }}>
                        Minara
                    </h1>
                    <p style={{ color: '#6b7280', margin: 0, fontSize: '0.95rem' }}>
                        Organizer Portal Login
                    </p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #d1d5db',
                                fontSize: '1rem',
                                transition: 'border-color 0.15s ease-in-out',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#0f172a'}
                            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            placeholder="organizer@example.com"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #d1d5db',
                                fontSize: '1rem',
                                transition: 'border-color 0.15s ease-in-out',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#0f172a'}
                            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div style={{
                            color: '#b91c1c',
                            fontSize: '0.875rem',
                            background: '#fef2f2',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid #fecaca',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            justifyContent: 'center',
                            marginTop: '0.5rem',
                            width: '100%',
                            padding: '0.875rem',
                            background: 'linear-gradient(to right, #0f172a, #1e293b)',
                            color: 'white',
                            fontWeight: 600,
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '1rem',
                            transition: 'opacity 0.2s',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>

                    <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#6b7280', margin: '1rem 0 0 0' }}>
                        Need an account?{' '}
                        <Link href="/organizer/register" style={{ color: '#0f172a', fontWeight: 600, textDecoration: 'none' }}>
                            Register here
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
