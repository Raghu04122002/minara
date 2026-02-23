import { prisma } from '@/lib/prisma';
import { Person, Household, HouseholdMember } from '@prisma/client';

export async function runHouseholding() {
    const log: string[] = [];
    const result = {
        familiesCreated: 0,
        peopleGrouped: 0,
        byPhone: 0,
        byEmail: 0,
        logs: log,
    };

    // Wipe existing households to recompute from scratch (Phase 1A recomputation)
    console.log('--- Wiping existing households for recomputation ---');
    await prisma.$transaction([
        prisma.householdMember.deleteMany({}),
        prisma.transaction.updateMany({ data: { householdId: null } }),
        prisma.household.deleteMany({}),
    ]);

    // 1. Group by Phone
    // Get all people with phone, grouped by phone
    const peopleWithPhone = await prisma.person.findMany({
        where: {
            primaryPhone: { not: null },
            householdMembers: { none: {} } // Only group ungrouped people
            // Requirement: "Householding runs AFTER all CSVs".
            // Assuming we want to group everyone. If someone is already in a household, do we move them?
            // "Incorrect merges are not acceptable".
            // Safest: Only group people who are NOT in a household.
        },
        select: { id: true, primaryPhone: true, lastName: true }
    });

    const phoneGroups = new Map<string, typeof peopleWithPhone>();
    for (const p of peopleWithPhone) {
        if (!p.primaryPhone) continue;
        const group = phoneGroups.get(p.primaryPhone) || [];
        group.push(p);
        phoneGroups.set(p.primaryPhone, group);
    }

    for (const [phone, group] of phoneGroups) {
        const uniqueIds = Array.from(new Set(group.map((p: any) => p.id as string)));
        if (uniqueIds.length > 1) {
            await createHouseholdForGroup(uniqueIds as string[], 'PHONE', phone);
            result.familiesCreated++;
            result.peopleGrouped += uniqueIds.length;
            result.byPhone++;
        }
    }

    // 2. Group by Email
    const peopleWithEmail = await prisma.person.findMany({
        where: {
            primaryEmail: { not: null },
            householdMembers: { none: {} }
        },
        select: { id: true, primaryEmail: true, lastName: true }
    });

    const emailGroups = new Map<string, typeof peopleWithEmail>();
    for (const p of peopleWithEmail) {
        if (!p.primaryEmail) continue;
        const key = p.primaryEmail.toLowerCase().trim();
        const group = emailGroups.get(key) || [];
        group.push(p);
        emailGroups.set(key, group);
    }

    for (const [email, group] of emailGroups) {
        // Ensure we have at least 2 UNIQUE people
        const uniqueIds = Array.from(new Set(group.map((p: any) => p.id as string)));
        if (uniqueIds.length > 1) {
            await createHouseholdForGroup(uniqueIds as string[], 'EMAIL', email);
            result.familiesCreated++;
            result.peopleGrouped += uniqueIds.length;
            result.byEmail++;
        }
    }

    log.push(`Grouping complete. ${result.familiesCreated} households created in total.`);

    return result;
}

async function createHouseholdForGroup(personIds: string[], groupedBy: string, groupKey?: string) {
    const people = await prisma.person.findMany({
        where: { id: { in: personIds } },
        include: { address: true },
        orderBy: { createdAt: 'asc' }
    });

    if (people.length === 0) return;

    // Head is the first person (oldest record)
    const head = people[0];

    // Determine Household Name: Priority is Head's Last Name (no email/phone in name)
    const householdName = head.lastName ? `${head.lastName} Household` : `${head.firstName || 'Unknown'}'s Household`;

    // Compute confidence score based on shared identifiers
    const { score, reason } = computeConfidenceScore(people, groupedBy);

    // Create Household with confidence
    const household = await prisma.household.create({
        data: {
            householdName: householdName,
            confidenceScore: score,
            confidenceReason: reason,
        }
    });

    // Create Members and Update People
    for (let i = 0; i < people.length; i++) {
        const p = people[i];
        const role = i === 0 ? 'HEAD' : 'UNKNOWN';

        await prisma.householdMember.create({
            data: {
                householdId: household.id,
                personId: p.id,
                roleInHousehold: role,
                groupedBy: groupedBy
            }
        });

        await prisma.transaction.updateMany({
            where: { personId: p.id },
            data: { householdId: household.id }
        });
    }
}

// Compute confidence score based on shared identifiers
function computeConfidenceScore(people: Array<{ primaryEmail?: string | null; primaryPhone?: string | null; address?: { id: string } | null }>, primaryGroupedBy: string): { score: number; reason: string } {
    // Check what identifiers are shared across ALL members
    const hasSharedEmail = people.every(p => p.primaryEmail) && new Set(people.map(p => p.primaryEmail?.toLowerCase())).size === 1;
    const hasSharedPhone = people.every(p => p.primaryPhone) && new Set(people.map(p => p.primaryPhone)).size === 1;
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
