import { prisma } from '@/lib/prisma';
import { Person, Family, FamilyMember } from '@prisma/client';

export async function runHouseholding() {
    const log: string[] = [];
    const result = {
        familiesCreated: 0,
        peopleGrouped: 0,
        byPhone: 0,
        byEmail: 0,
        logs: log,
    };

    // Wipe existing families to recompute from scratch (Phase 1A recomputation)
    console.log('--- Wiping existing families for recomputation ---');
    await prisma.$transaction([
        prisma.familyMember.deleteMany({}),
        prisma.transaction.updateMany({ data: { familyId: null } }),
        prisma.person.updateMany({ data: { familyId: null } }),
        prisma.family.deleteMany({}),
    ]);

    // 1. Group by Phone
    // Get all people with phone, grouped by phone
    const peopleWithPhone = await prisma.person.findMany({
        where: {
            phone: { not: null },
            familyId: null // Only group ungrouped people?
            // Requirement: "Householding runs AFTER all CSVs".
            // Assuming we want to group everyone. If someone is already in a family, do we move them?
            // "Incorrect merges are not acceptable".
            // Safest: Only group people who are NOT in a family.
        },
        select: { id: true, phone: true, lastName: true }
    });

    const phoneGroups = new Map<string, typeof peopleWithPhone>();
    for (const p of peopleWithPhone) {
        if (!p.phone) continue;
        const group = phoneGroups.get(p.phone) || [];
        group.push(p);
        phoneGroups.set(p.phone, group);
    }

    for (const [phone, group] of phoneGroups) {
        const uniqueIds = Array.from(new Set(group.map((p: any) => p.id as string)));
        if (uniqueIds.length > 1) {
            await createFamilyForGroup(uniqueIds as string[], 'PHONE', phone);
            result.familiesCreated++;
            result.peopleGrouped += uniqueIds.length;
            result.byPhone++;
        }
    }

    // 2. Group by Email
    const peopleWithEmail = await prisma.person.findMany({
        where: {
            email: { not: null },
            familyId: null
        },
        select: { id: true, email: true, lastName: true }
    });

    const emailGroups = new Map<string, typeof peopleWithEmail>();
    for (const p of peopleWithEmail) {
        if (!p.email) continue;
        const key = p.email.toLowerCase().trim();
        const group = emailGroups.get(key) || [];
        group.push(p);
        emailGroups.set(key, group);
    }

    for (const [email, group] of emailGroups) {
        // Ensure we have at least 2 UNIQUE people
        const uniqueIds = Array.from(new Set(group.map((p: any) => p.id as string)));
        if (uniqueIds.length > 1) {
            await createFamilyForGroup(uniqueIds as string[], 'EMAIL', email);
            result.familiesCreated++;
            result.peopleGrouped += uniqueIds.length;
            result.byEmail++;
        }
    }

    log.push(`Grouping complete. ${result.familiesCreated} families created in total.`);

    return result;
}

async function createFamilyForGroup(personIds: string[], groupedBy: string, groupKey?: string) {
    const people = await prisma.person.findMany({
        where: { id: { in: personIds } },
        include: { address: true },
        orderBy: { createdAt: 'asc' }
    });

    if (people.length === 0) return;

    // Head is the first person (oldest record)
    const head = people[0];

    // Determine Family Name: Priority is Head's Last Name (no email/phone in name)
    const familyName = head.lastName ? `${head.lastName} Family` : `${head.firstName || 'Unknown'}'s Household`;

    // Compute confidence score based on shared identifiers
    const { score, reason } = computeConfidenceScore(people, groupedBy);

    // Create Family with confidence
    const family = await prisma.family.create({
        data: {
            name: familyName,
            confidenceScore: score,
            confidenceReason: reason,
        }
    });

    // Create Members and Update People
    for (let i = 0; i < people.length; i++) {
        const p = people[i];
        const role = i === 0 ? 'HEAD' : 'UNKNOWN';

        await prisma.person.update({
            where: { id: p.id },
            data: { familyId: family.id }
        });

        await prisma.familyMember.create({
            data: {
                familyId: family.id,
                personId: p.id,
                role: role,
                groupedBy: groupedBy
            }
        });

        await prisma.transaction.updateMany({
            where: { personId: p.id },
            data: { familyId: family.id }
        });
    }
}

// Compute confidence score based on shared identifiers
function computeConfidenceScore(people: Array<{ email?: string | null; phone?: string | null; address?: { id: string } | null }>, primaryGroupedBy: string): { score: number; reason: string } {
    // Check what identifiers are shared across ALL members
    const hasSharedEmail = people.every(p => p.email) && new Set(people.map(p => p.email?.toLowerCase())).size === 1;
    const hasSharedPhone = people.every(p => p.phone) && new Set(people.map(p => p.phone)).size === 1;
    const hasSharedAddress = people.every(p => p.address?.id) && new Set(people.map(p => p.address?.id)).size === 1;

    // Scoring rules based on the spec
    let score: number;
    let reason: string;

    if (hasSharedEmail && hasSharedPhone && hasSharedAddress) {
        score = 95;
        reason = 'email+phone+address';
    } else if (hasSharedEmail && hasSharedPhone) {
        score = 92;
        reason = 'email+phone';
    } else if (hasSharedEmail && hasSharedAddress) {
        score = 90;
        reason = 'email+address';
    } else if (hasSharedPhone && hasSharedAddress) {
        score = 88;
        reason = 'phone+address';
    } else if (hasSharedEmail) {
        score = 85;
        reason = 'email only';
    } else if (hasSharedPhone) {
        score = 82;
        reason = 'phone only';
    } else if (hasSharedAddress) {
        score = 75;
        reason = 'address only';
    } else {
        // Fallback based on primary grouped by
        score = 60;
        reason = primaryGroupedBy.toLowerCase();
    }

    return { score, reason };
}
