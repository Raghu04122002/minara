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

    // 3. Create Families for Solo People (Remaining)
    // "if no families then solo should be visible"
    const soloPeople = await prisma.person.findMany({
        where: {
            familyId: null
        }
    });

    log.push(`Creating solo households for ${soloPeople.length} people.`);

    // Batch solo household creation
    const CHUNK_SIZE = 50;
    for (let i = 0; i < soloPeople.length; i += CHUNK_SIZE) {
        const chunk = soloPeople.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(async (person: any) => {
            const familyName = person.lastName
                ? `${person.firstName || ''} ${person.lastName} Household`.trim()
                : (person.firstName ? `${person.firstName}'s Household` : 'Individual Household');

            return prisma.$transaction(async (tx: any) => {
                const family = await tx.family.create({
                    data: { name: familyName }
                });

                await tx.familyMember.create({
                    data: {
                        familyId: family.id,
                        personId: person.id,
                        role: 'HEAD',
                        groupedBy: 'SOLO'
                    }
                });

                await tx.person.update({
                    where: { id: person.id },
                    data: { familyId: family.id }
                });

                await tx.transaction.updateMany({
                    where: { personId: person.id },
                    data: { familyId: family.id }
                });
            });
        }));
        result.familiesCreated += chunk.length;
    }

    log.push(`Grouping complete. ${result.familiesCreated} families created in total.`);

    return result;
}

async function createFamilyForGroup(personIds: string[], groupedBy: string, groupKey?: string) {
    const people = await prisma.person.findMany({
        where: { id: { in: personIds } },
        orderBy: { createdAt: 'asc' }
    });

    if (people.length === 0) return;

    // Head is the first person (oldest record)
    const head = people[0];

    // Determine Family Name: Priority is Head's Last Name
    let familyName = head.lastName ? `${head.lastName} Family` : `${head.firstName || 'Unknown'}'s Household`;

    // Append identifier if requested
    if (groupKey) {
        familyName += ` (${groupKey})`;
    }


    // Create Family
    const family = await prisma.family.create({
        data: {
            name: familyName,
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
