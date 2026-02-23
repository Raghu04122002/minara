import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Target Ahmed's ID
    const personId = '450ab657-a8f4-41fe-aa44-ad67d627fd5f';

    console.log(`Checking household membership for person ${personId}...`);

    const memberships = await prisma.householdMember.findMany({
        where: { personId },
        include: { household: { include: { members: true } } }
    });

    for (const membership of memberships) {
        const householdId = membership.householdId;
        const memberCount = membership.household.members.length;

        if (memberCount === 1) {
            console.log(`Removing single-person household linkage for ${membership.household.householdName}...`);

            // Delete membership
            await prisma.householdMember.delete({
                where: { id: membership.id }
            });

            // Delete empty household
            await prisma.household.delete({
                where: { id: householdId }
            });

            console.log(`Deleted household ${householdId}`);
        } else {
            console.log(`Person is part of a multi-person household (${memberCount} members). Skipping deletion.`);
        }
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
