import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';

        const where = search ? {
            OR: [
                { firstName: { contains: search, mode: 'insensitive' as const } },
                { lastName: { contains: search, mode: 'insensitive' as const } },
                { primaryEmail: { contains: search, mode: 'insensitive' as const } },
                { primaryPhone: { contains: search } }
            ]
        } : {};

        const people = await prisma.person.findMany({
            where,
            include: {
                _count: { select: { transactions: true } }
            },
            orderBy: { lastName: 'asc' }
        });

        // Build CSV
        const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Transactions'];
        const rows = people.map((p: typeof people[0]) => [
            p.firstName || '',
            p.lastName || '',
            p.primaryEmail || '',
            p.primaryPhone || '',
            p._count.transactions.toString()
        ].map(v => `"${v.replace(/"/g, '""')}"`).join(','));

        const csvContent = [headers.join(','), ...rows].join('\n');

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="people-export-${new Date().toISOString().split('T')[0]}.csv"`
            }
        });
    } catch (error) {
        console.error('Error exporting people:', error);
        return NextResponse.json(
            { error: 'Failed to export people' },
            { status: 500 }
        );
    }
}
