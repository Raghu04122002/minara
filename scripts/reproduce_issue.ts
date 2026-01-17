
import { prisma } from '@/lib/prisma';
import { processCSVImport } from '@/lib/import/importer';
import fs from 'fs';
import path from 'path';

async function main() {
    console.log('--- Reseting DB ---');
    await prisma.transaction.deleteMany({});
    await prisma.familyMember.deleteMany({});
    await prisma.person.deleteMany({});
    await prisma.family.deleteMany({});

    const files = [
        'phase1a_donations_phone_email.csv',
        'phase1a_events_phone_email.csv',
        'phase1a_programs_phone_email.csv'
    ];

    for (const file of files) {
        console.log(`--- Importing ${file} ---`);
        const filePath = path.join(process.cwd(), file);
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            continue;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        const result = await processCSVImport(content, file);
        console.log('Result:', result);
    }

    console.log('--- Verifying People ---');
    const people = await prisma.person.findMany();
    console.log(`Total People: ${people.length}`);
    console.log('--- Running Householding ---');
    const { runHouseholding } = require('../src/lib/householding/grouper');
    const result = await runHouseholding();
    console.log('Householding Result:', result);

    console.log('--- Verifying Families ---');
    const families = await prisma.family.findMany({
        include: { members: { include: { person: true } } }
    });
    console.log(`Total Families: ${families.length}`);
    families.forEach(f => {
        console.log(`Family: ${f.name} (${f.members.length} members)`);
        f.members.forEach((m: any) => console.log(`  - ${m.person.firstName} ${m.person.lastName} (${m.role})`));
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
