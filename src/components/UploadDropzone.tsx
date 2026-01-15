'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// Using Lucide icons
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export default function UploadDropzone() {
    const router = useRouter();
    const [isUploading, setIsUploading] = useState(false);
    const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setStatus('idle');
        setMessage('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('mode', importMode);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Upload failed');

            setStatus('success');
            setMessage(`Processed ${data.totalRows} rows. Created ${data.createdPeople} people.`);

            // Refresh the page to show new stats
            router.refresh();
        } catch (err) {
            setStatus('error');
            setMessage((err as Error).message);
        } finally {
            setIsUploading(false);
        }
    }

    return (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                {status === 'success' ? <CheckCircle size={48} color="green" /> :
                    status === 'error' ? <AlertCircle size={48} color="red" /> :
                        <Upload size={48} color="#2563eb" />}
            </div>

            <h3 className="heading" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                {isUploading ? 'Processing CSV...' : 'Import Data'}
            </h3>

            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                Upload your CSV files from Eventbrite, Stripe, or other sources.
            </p>

            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                <button
                    onClick={() => setImportMode('append')}
                    className={importMode === 'append' ? 'btn btn-primary' : 'btn'}
                    style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                >
                    Append to Existing
                </button>
                <button
                    onClick={() => setImportMode('replace')}
                    className={importMode === 'replace' ? 'btn btn-primary' : 'btn'}
                    style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', background: importMode === 'replace' ? '#dc2626' : undefined, borderColor: importMode === 'replace' ? '#dc2626' : undefined }}
                >
                    Replace All Data
                </button>
            </div>

            <div style={{ position: 'relative', display: 'inline-block' }}>
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer',
                    }}
                    id="file-upload"
                />
                <label
                    htmlFor="file-upload"
                    className="btn btn-primary"
                    style={{ pointerEvents: 'none' }} // Let input handle clicks
                >
                    {isUploading ? 'Uploading...' : 'Select CSV File'}
                </label>
            </div>

            {message && (
                <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: status === 'error' ? '#fee2e2' : '#dcfce7',
                    color: status === 'error' ? '#991b1b' : '#166534',
                    borderRadius: '0.375rem',
                    fontSize: '0.9rem'
                }}>
                    {message}
                </div>
            )}
        </div>
    );
}
