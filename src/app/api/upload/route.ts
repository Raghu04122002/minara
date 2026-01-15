import { NextRequest, NextResponse } from 'next/server';
import { processCSVImport } from '@/lib/import/importer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const content = await file.text();
        const mode = (formData.get('mode') as 'append' | 'replace') || 'append';

        const result = await processCSVImport(content, file.name || 'Upload', { mode });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Failed to process file', details: (error as Error).message },
            { status: 500 }
        );
    }
}
