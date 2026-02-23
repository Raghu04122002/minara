import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
    FileText,
    User,
    ArrowRight,
    CheckCircle,
    AlertTriangle,
    Users,
    Calendar,
    Mail,
    Phone,
    UserPlus,
    Merge
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SubmissionDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params;

    const submission = await prisma.registrationSubmission.findUnique({
        where: { id },
        include: {
            event: true,
            participants: {
                include: {
                    person: true,
                    household: true
                }
            },
        }
    });

    if (!submission) {
        notFound();
    }

    // Identify candidate persons for those needing review
    const participantsWithCandidates = await Promise.all(submission.participants.map(async (p: any) => {
        const explanation = p.matchExplanationJson as any;
        let candidates: any[] = [];

        if (explanation?.candidateIds && Array.isArray(explanation.candidateIds)) {
            candidates = await prisma.person.findMany({
                where: { id: { in: explanation.candidateIds } }
            });
        }

        return { ...p, candidates };
    }));

    return (
        <div className="container">
            <Link href="/admin/submissions" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#6b7280', textDecoration: 'none', marginBottom: '1rem', fontSize: '0.875rem' }}>
                <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back to Submissions
            </Link>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <FileText size={28} /> Submission Details
                    </h1>
                    <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
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
                    <div className="card">
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={18} /> Event Information
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Event Title</label>
                                <Link href={`/admin/events/${submission.eventId}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>
                                    {submission.event.title}
                                </Link>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Source Channel</label>
                                <div style={{ fontWeight: 500 }}>{submission.submissionChannel}</div>
                            </div>
                        </div>
                    </div>

                    {/* Participants */}
                    <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={18} /> Participants
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {participantsWithCandidates.map((p, idx) => (
                                <div key={p.id} className="card" style={{ padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '40px', height: '40px', background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{p.firstName} {p.lastName}</h3>
                                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Role: {p.role || 'Member'}</div>
                                            </div>
                                        </div>

                                        {p.person && (
                                            <div style={{ textAlign: 'right' }}>
                                                <label style={{ display: 'block', fontSize: '0.7rem', color: '#6b7280' }}>Created Record</label>
                                                <Link href={`/admin/people/${p.personId}`} style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
                                                    {p.person.firstName} {p.person.lastName}
                                                </Link>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: '#f9fafb', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.7rem', color: '#6b7280' }}><Mail size={10} style={{ marginRight: '0.25rem' }} />Email</label>
                                            <div style={{ fontSize: '0.8rem' }}>{p.email || '-'}</div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.7rem', color: '#6b7280' }}><Phone size={10} style={{ marginRight: '0.25rem' }} />Phone</label>
                                            <div style={{ fontSize: '0.8rem' }}>{p.phone || '-'}</div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.7rem', color: '#6b7280' }}><Calendar size={10} style={{ marginRight: '0.25rem' }} />DOB</label>
                                            <div style={{ fontSize: '0.8rem' }}>{p.dob ? new Date(p.dob).toLocaleDateString() : '-'}</div>
                                        </div>
                                    </div>

                                    {/* Resolution Options */}
                                    {submission.processingStatus === 'needs_review' && (
                                        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1rem' }}>
                                            <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#854d0e', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                <AlertTriangle size={14} /> RESOLUTION REQUIRED
                                            </h4>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {/* Candidate Matches */}
                                                {p.candidates.length > 0 ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Found potential matches. Should we merge this registration into an existing person?</p>
                                                        {p.candidates.map((c: any) => (
                                                            <div key={c.id} style={{
                                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                                padding: '0.625rem 0.875rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.5rem'
                                                            }}>
                                                                <div>
                                                                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.firstName} {c.lastName}</div>
                                                                    <div style={{ fontSize: '0.7rem', color: '#b45309' }}>{c.primaryEmail || c.primaryPhone}</div>
                                                                </div>
                                                                <form action={`/api/submissions/${submission.id}/resolve`} method="POST">
                                                                    <input type="hidden" name="action" value="merge" />
                                                                    <input type="hidden" name="participantId" value={p.id} />
                                                                    <input type="hidden" name="targetPersonId" value={c.id} />
                                                                    <button type="submit" className="button" style={{
                                                                        padding: '0.375rem 0.75rem', fontSize: '0.75rem', background: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.25rem'
                                                                    }}>
                                                                        <Merge size={12} /> Merge into this Person
                                                                    </button>
                                                                </form>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>No specific candidates identified, but the match was ambiguous (e.g., partial match on a generic field).</p>
                                                )}

                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <form action={`/api/submissions/${submission.id}/resolve`} method="POST" style={{ flex: 1 }}>
                                                        <input type="hidden" name="action" value="confirm" />
                                                        <input type="hidden" name="participantId" value={p.id} />
                                                        <button type="submit" className="button" style={{
                                                            width: '100%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem'
                                                        }}>
                                                            <UserPlus size={16} /> Confirm as New Person
                                                        </button>
                                                    </form>
                                                    <form action={`/api/submissions/${submission.id}/resolve`} method="POST" style={{ flex: 1 }}>
                                                        <input type="hidden" name="action" value="skip" />
                                                        <input type="hidden" name="participantId" value={p.id} />
                                                        <button type="submit" className="button outline" style={{
                                                            width: '100%', borderColor: '#d1d5db', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem'
                                                        }}>
                                                            Skip / Review Later
                                                        </button>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div>
                    <div className="card">
                        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Raw Submission</h2>
                        <pre style={{
                            fontSize: '0.65rem', background: '#f3f4f6', padding: '0.75rem', borderRadius: '0.375rem',
                            overflow: 'auto', maxHeight: '400px', margin: 0
                        }}>
                            {JSON.stringify(submission.rawPayloadJson, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
