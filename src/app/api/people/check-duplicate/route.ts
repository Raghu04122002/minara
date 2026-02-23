import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');
        const phone = searchParams.get('phone');

        if (!email && !phone) {
            return NextResponse.json({ exists: false });
        }

        const normalizedEmail = email ? email.trim().toLowerCase() : null;
        const normalizedPhone = phone ? phone.replace(/\D/g, '') : null;

        let existing = null;
        let matchedOn = '';

        if (normalizedEmail) {
            existing = await prisma.person.findFirst({
                where: { primaryEmail: normalizedEmail }
            });
            if (existing) matchedOn = 'email';
        }

        if (!existing && normalizedPhone) {
            existing = await prisma.person.findFirst({
                where: { primaryPhone: normalizedPhone }
            });
            if (existing) matchedOn = 'phone';
        }

        if (existing) {
            return NextResponse.json({
                exists: true,
                matchedOn,
                existingName: `${existing.firstName} ${existing.lastName}`
            });
        }

        return NextResponse.json({ exists: false });
    } catch (error) {
        console.error('Error checking duplicate:', error);
        return NextResponse.json({ exists: false });
    }
}
