'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, UserPlus, Trash2, Shield } from 'lucide-react';

interface User {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at?: string;
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else if (res.status === 403) {
                setError('Access denied. Only livoranger@gmail.com can access this page.');
            }
        } catch (e) {
            console.error(e);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setCreating(true);
        setError('');

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (res.ok) {
                setEmail('');
                setPassword('');
                fetchUsers();
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to create user');
            }
        } catch (e) {
            setError('Error creating user');
        } finally {
            setCreating(false);
        }
    }

    async function handleDelete(id: string, userEmail: string) {
        if (!confirm(`Are you sure you want to delete ${userEmail}?`)) return;

        try {
            const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchUsers();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete user');
            }
        } catch (e) {
            alert('Failed to delete');
        }
    }

    if (error && error.includes('Access denied')) {
        return (
            <div className="container">
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <Shield size={48} style={{ margin: '0 auto 1rem', color: '#ef4444' }} />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Access Denied</h2>
                    <p style={{ color: '#6b7280' }}>{error}</p>
                    <Link href="/" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', color: '#6b7280', textDecoration: 'none', marginBottom: '2rem' }}>
                <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Back to Dashboard
            </Link>

            <header style={{ marginBottom: '2rem' }}>
                <h1 className="heading">User Management</h1>
                <p style={{ color: '#6b7280' }}>Manage admin access to the Minara Dashboard (Super Admin Only)</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Create New User</h2>
                    <div className="card">
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Email</label>
                                <input
                                    className="input"
                                    type="email"
                                    required
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="user@example.com"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Password</label>
                                <input
                                    className="input"
                                    type="password"
                                    required
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>

                            {error && !error.includes('Access denied') && (
                                <p style={{ color: 'red', fontSize: '0.875rem' }}>{error}</p>
                            )}

                            <button type="submit" className="btn btn-primary" disabled={creating} style={{ justifyContent: 'center' }}>
                                <UserPlus size={18} style={{ marginRight: '0.5rem' }} />
                                {creating ? 'Creating...' : 'Create User'}
                            </button>
                        </form>
                    </div>
                </div>

                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Existing Users</h2>
                    <div className="card" style={{ padding: 0 }}>
                        {loading ? (
                            <p style={{ padding: '1rem' }}>Loading...</p>
                        ) : (
                            <div>
                                {users.map(user => (
                                    <div key={user.id} style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{user.email}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                                Created: {new Date(user.created_at).toLocaleDateString()}
                                            </div>
                                            {user.email === 'livoranger@gmail.com' && (
                                                <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                                    <span style={{
                                                        background: '#dbeafe',
                                                        color: '#1e40af',
                                                        padding: '0.125rem 0.375rem',
                                                        borderRadius: '999px',
                                                        fontWeight: 600
                                                    }}>
                                                        SUPER ADMIN
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {user.email !== 'livoranger@gmail.com' && (
                                            <button
                                                onClick={() => handleDelete(user.id, user.email)}
                                                className="btn"
                                                style={{ color: '#ef4444', padding: '0.5rem' }}
                                                title="Delete User"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
