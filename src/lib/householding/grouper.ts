import { prisma } from '@/lib/prisma';
import { Person, Family, FamilyMember } from '@prisma/client';

export async function runHouseholding() {
    const log: string[] = []; // Initialize log array with explicit type
    const result = {
        familiesCreated: 0,
        peopleGrouped: 0,
        byPhone: 0,
        byEmail: 0,
        byAddress: 0,
        logs: log, // Add logs to the result object
    };

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
        if (group.length > 1) {
            await createFamilyForGroup(group.map((p: any) => p.id), 'PHONE');
            result.familiesCreated++;
            result.peopleGrouped += group.length;
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
        // Email normalization for grouping? Requirement: "Exact email match (case-insensitive)"
        const key = p.email.toLowerCase().trim();
        const group = emailGroups.get(key) || [];
        group.push(p);
        emailGroups.set(key, group);
    }

    for (const [email, group] of emailGroups) {
        if (group.length > 1) {
            await createFamilyForGroup(group.map((p: any) => p.id), 'EMAIL');
            result.familiesCreated++;
            result.peopleGrouped += group.length;
            result.byEmail++;
        }
    }

    // 3. Group by Address
    const peopleWithAddress = await prisma.person.findMany({
        where: {
            addressId: { not: null },
            familyId: null
        },
        select: { id: true, addressId: true, lastName: true }
    });

    const addressGroups = new Map<string, typeof peopleWithAddress>();
    for (const p of peopleWithAddress) {
        if (!p.addressId) continue;
        const group = addressGroups.get(p.addressId) || [];
        group.push(p);
        addressGroups.set(p.addressId, group);
    }

    for (const [addressId, group] of addressGroups) {
        if (group.length > 1) {
            await createFamilyForGroup(group.map((p: any) => p.id), 'ADDRESS');
            result.familiesCreated++;
            result.peopleGrouped += group.length;
            result.byAddress++;
        }
    }

    log.push(`Grouping complete. ${result.familiesCreated} families created.`);

    return result;
}

async function createFamilyForGroup(personIds: string[], groupedBy: string) {
    // Fetch full details to decide name
    const people = await prisma.person.findMany({
        where: { id: { in: personIds } }
    });

    // Determine Family Name
    // "Same last name -> <LastName> Family"
    // "Otherwise -> Shared Household"
    const lastNames = new Set(people.map((p: any) => p.lastName).filter(Boolean));
    let familyName = 'Shared Household';
    if (lastNames.size === 1) {
        familyName = `${Array.from(lastNames)[0]} Family`;
    } else {
        // If mixed, check if majority? No, rule is "Same last name". implies ALL same.
        // Or maybe just pick one? "Otherwise -> Shared Household".
        // I'll stick to strict rule.
    }

    // Create Family
    const family = await prisma.family.create({
        data: {
            name: familyName,
        }
    });

    // Create Members and Update People
    // "First person -> HEAD. Others -> UNKNOWN"
    // Order by what? CreatedAt? Or just list order?
    // I'll sort by createdAt or ID.
    const sorted = people.sort((a: any, b: any) => a.createdAt.getTime() - b.createdAt.getTime());

    for (let i = 0; i < sorted.length; i++) {
        const p = sorted[i];
        const role = i === 0 ? 'HEAD' : 'UNKNOWN'; // First as HEAD

        // Update Person
        await prisma.person.update({
            where: { id: p.id },
            data: { familyId: family.id }
        });

        // Create Member
        await prisma.familyMember.create({
            data: {
                familyId: family.id,
                personId: p.id,
                role: role,
                groupedBy: groupedBy
            }
        });

        // Update Transactions?
        // "Set: person.family_id, transaction.family_id"
        await prisma.transaction.updateMany({
            where: { personId: p.id },
            data: { familyId: family.id }
        });
    }
}
