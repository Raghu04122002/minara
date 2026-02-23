import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const submissions = await prisma.registrationSubmission.findMany({
        where: { processingStatus: 'needs_review' },
        include: { participants: true }
    });

    console.log('--- NEEDS REVIEW SUBMISSIONS ---');
    submissions.forEach(s => {
        console.log(`\nSubmission ID: ${s.id}`);
        s.participants.forEach(p => {
            console.log(`  Participant: ${p.firstName} ${p.lastName}`);
            console.log(`  Explanation: ${JSON.stringify(p.matchExplanationJson, null, 2)}`);
        });
    });
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
