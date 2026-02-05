import { NextRequest, NextResponse } from 'next/server';
import { processCSVImport } from '@/lib/import/importer';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    let importJobId: string | undefined;

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const content = await file.text();
        const mode = (formData.get('mode') as 'append' | 'replace') || 'append';
        const dataType = (formData.get('dataType') as 'event' | 'donation') || 'event';

        // Phase 1B: Create ImportJob at start
        const importJob = await prisma.importJob.create({
            data: {
                fileName: file.name || 'Upload',
                status: 'processing',
                startedAt: new Date(),
            }
        });
        importJobId = importJob.id;

        const result = await processCSVImport(content, file.name || 'Upload', {
            mode,
            dataType,
            importJobId
        });

        // Phase 1B: Finalize job with stats
        await prisma.importJob.update({
            where: { id: importJobId },
            data: {
                status: 'completed',
                finishedAt: new Date(),
                rowsTotal: result.totalRows,
                rowsSuccess: result.rowsSuccess,
                rowsErrors: result.rowsErrors,
                summaryStats: {
                    createdPeople: result.createdPeople,
                    createdTransactions: result.createdTransactions,
                    errorMessages: result.errors.slice(0, 10) // Store first 10 errors
                }
            }
        });

        return NextResponse.json({ ...result, importJobId });
    } catch (error) {
        console.error('Upload error:', error);

        // Phase 1B: Mark job as failed if it exists
        if (importJobId) {
            await prisma.importJob.update({
                where: { id: importJobId },
                data: {
                    status: 'failed',
                    finishedAt: new Date(),
                    summaryStats: { error: (error as Error).message }
                }
            }).catch(console.error);
        }

        return NextResponse.json(
            { error: 'Failed to process file', details: (error as Error).message },
            { status: 500 }
        );
    }
}

