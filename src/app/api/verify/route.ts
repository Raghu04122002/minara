import { NextResponse } from 'next/server';
import { processCSVImport } from '@/lib/import/importer';
import { runHouseholding } from '@/lib/householding/grouper';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    const log: string[] = [];
    try {
        log.push('--- Verification Start ---');

        // 1. Cleanup
        await prisma.familyMember.deleteMany();
        await prisma.transaction.deleteMany();
        await prisma.person.deleteMany();
        await prisma.family.deleteMany();
        log.push('Database cleaned.');

        // 2. CSV Import Simulation
        const csvContent = `
email,phone,first_name,last_name,amount,type
alice@example.com,555-0101,Alice,Smith,100,Donation
bob@example.com,555-0102,Bob,Jones,50,Ticket
charlie@example.com,555-0101,Charlie,Smith,200,Ticket
    `.trim();

        // Note: Alice and Charlie share phone -> Should become a family
        // Bob is separate.

        const importResult = await processCSVImport(csvContent, 'VerificationCSV');
        log.push(`Imported: ${importResult.createdPeople} people, ${importResult.createdTransactions} rows.`);

        // 3. Householding
        const householdResult = await runHouseholding();
        log.push(`Householding: Created ${householdResult.familiesCreated} families.`);

        // 4. Assertions
        const families = await prisma.family.findMany({ include: { members: { include: { person: true } } } });
        const people = await prisma.person.findMany({ include: { family: true } });

        if (families.length !== 1) {
            log.push(`ERROR: Expected 1 family, found ${families.length}`);
        } else {
            log.push(`SUCCESS: Found 1 family: "${families[0].name}"`);
            const members = families[0].members.map((m: any) => m.person.firstName);
            log.push(`Members: ${members.join(', ')}`);
            if (members.includes('Alice') && members.includes('Charlie')) {
                log.push('SUCCESS: Family contains Alice and Charlie (via Phone 555-0101)');
            } else {
                log.push('ERROR: Family members incorrect.');
            }
        }

        const bob = people.find((p: any) => p.firstName === 'Bob');
        if (bob && !bob.familyId) {
            log.push('SUCCESS: Bob is not in a family.');
        } else {
            log.push('ERROR: Bob should be solo.');
        }

        return NextResponse.json({ log });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message, log }, { status: 500 });
    }
}
