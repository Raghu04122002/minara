import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
    FileText,
    User,
    ArrowRight,
    CheckCircle,
    AlertTriangle,
    Users,
    Calendar,
    Mail,
    Phone
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OrganizerSubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/organizer/login');
    }

    const submission = await prisma.registrationSubmission.findUnique({
        where: { id },
        include: {
            event: true,
            participants: {
                include: {
                    person: true,
                    // Cannot view household globally, so we skip detailed global includes
                }
            },
        }
    });

    if (!submission || submission.event.organizerId !== user.id) {
        notFound();
    }

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <Link href="/organizer/submissions" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#64748b', textDecoration: 'none', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 500 }}>
                <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back to Submissions
            </Link>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: '#0f172a' }}>
                        <FileText size={28} /> Submission Details
                    </h1>
                    <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
                        ID: {submission.id} • {new Date(submission.createdAt).toLocaleString()}
                    </div>
                </div>
                <div style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '9999px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    background: submission.processingStatus === 'matched' ? '#dcfce7' : submission.processingStatus === 'needs_review' ? '#fef9c3' : '#fee2e2',
                    color: submission.processingStatus === 'matched' ? '#166534' : submission.processingStatus === 'needs_review' ? '#854d0e' : '#991b1b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem'
                }}>
                    {submission.processingStatus === 'matched' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                    {submission.processingStatus.toUpperCase()}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Event Info */}
                    <div className="card" style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                            <Calendar size={18} /> Event Information
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Event Title</label>
                                <Link href={`/organizer/events/${submission.eventId}`} style={{ color: '#0f172a', textDecoration: 'none', fontWeight: 600 }}>
                                    {submission.event.title}
                                </Link>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Source Channel</label>
                                <div style={{ fontWeight: 500, color: '#334155' }}>{submission.submissionChannel}</div>
                            </div>
                        </div>
                    </div>

                    {/* Participants */}
                    <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                            <Users size={18} /> Participants
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {submission.participants.map((p: any) => (
                                <div key={p.id} className="card" style={{ padding: '1.25rem', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '40px', height: '40px', background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>{p.firstName} {p.lastName}</h3>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Role: {p.role || 'Member'}</div>
                                            </div>
                                        </div>

                                        {p.person && (
                                            <div style={{ textAlign: 'right' }}>
                                                <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b' }}>System Record</label>
                                                <span style={{ color: '#0f172a', fontSize: '0.875rem', fontWeight: 600 }}>
                                                    {p.person.firstName} {p.person.lastName}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b' }}><Mail size={10} style={{ marginRight: '0.25rem' }} />Email</label>
                                            <div style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 500 }}>{p.email || '-'}</div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b' }}><Phone size={10} style={{ marginRight: '0.25rem' }} />Phone</label>
                                            <div style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 500 }}>{p.phone || '-'}</div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b' }}><Calendar size={10} style={{ marginRight: '0.25rem' }} />DOB</label>
                                            <div style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 500 }}>{p.dob ? new Date(p.dob).toLocaleDateString() : '-'}</div>
                                        </div>
                                    </div>

                                    {submission.processingStatus === 'needs_review' && (
                                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '1rem' }}>
                                            <p style={{ fontSize: '0.875rem', color: '#854d0e', margin: 0, fontWeight: 500 }}>
                                                <AlertTriangle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                                                This submission requires review by an Administrator.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div>
                    <div className="card" style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#0f172a' }}>Raw Submission</h2>
                        <pre style={{
                            fontSize: '0.65rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '0.375rem',
                            overflow: 'auto', maxHeight: '400px', margin: 0, border: '1px solid #e2e8f0', color: '#475569'
                        }}>
                            {JSON.stringify(submission.rawPayloadJson, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
