import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/people/flags/[flagId]/undo
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ flagId: string }> }
) {
    try {
        const { flagId } = await params;

        const flag = await prisma.personFlag.findUnique({ where: { id: flagId } });

        if (!flag) {
            return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
        }

        if (flag.undoneAt) {
            return NextResponse.json({ error: 'This flag has already been undone' }, { status: 400 });
        }

        if (flag.permanentlyDeletedAt) {
            return NextResponse.json({ error: 'This merge has been permanently finalized and cannot be undone' }, { status: 400 });
        }

        const snapshot = flag.snapshot as any;

        if (flag.actionType === 'flag') {
            // --- Undo Flag ---
            if (flag.personId) {
                await prisma.person.update({
                    where: { id: flag.personId },
                    data: {
                        is_flagged: false,
                        flag_reason: null,
                        flagged_at: null
                    }
                });
            }

            await prisma.personFlag.update({
                where: { id: flagId },
                data: {
                    undoneAt: new Date(),
                    undoneByUserId: 'system'
                }
            });

            return NextResponse.json({ success: true, message: 'Flag removed successfully' });
        }

        if (flag.actionType === 'merge') {
            // --- Undo Merge ---
            if (!snapshot?.person) {
                return NextResponse.json({ error: 'No snapshot data available to restore this merge' }, { status: 400 });
            }

            const personData = snapshot.person;
            const transactionIds = snapshot.transactionIds || [];
            const memberships = snapshot.memberships || [];

            // A. Recreate the deleted person
            await prisma.person.create({
                data: {
                    id: personData.id,
                    institutionId: 'unassigned', // Required
                    createdSource: 'system', // Required
                    firstName: personData.firstName,
                    lastName: personData.lastName,
                    primaryEmail: personData.email,
                    primaryPhone: personData.phone,
                    normalizedEmail: personData.normalizedEmail,
                    normalizedPhone: personData.normalizedPhone,
                    addressId: personData.addressId
                }
            });

            // B. Move transactions back to restored person
            if (transactionIds.length > 0) {
                await prisma.transaction.updateMany({
                    where: { id: { in: transactionIds } },
                    data: { personId: personData.id }
                });
            }

            // C. Recreate household memberships
            for (const membership of memberships) {
                // Check if this membership still exists (it was either moved or deleted)
                const existing = await prisma.householdMember.findUnique({
                    where: { id: membership.id }
                });

                if (existing) {
                    // It was moved to target person — move it back
                    await prisma.householdMember.update({
                        where: { id: membership.id },
                        data: { personId: personData.id }
                    });
                } else {
                    // It was deleted (target already had membership in that household) — recreate
                    await prisma.householdMember.create({
                        data: {
                            personId: personData.id,
                            householdId: membership.householdId,
                            roleInHousehold: membership.role,
                            groupedBy: membership.groupedBy,
                            manualAssignment: membership.manualAssignment
                        }
                    });
                }
            }

            // D. Clear mergedFromPersonId on the target person
            if (flag.targetPersonId) {
                await prisma.person.update({
                    where: { id: flag.targetPersonId },
                    data: { mergedFromPersonId: null }
                });
            }

            // E. Mark flag as undone
            await prisma.personFlag.update({
                where: { id: flagId },
                data: {
                    undoneAt: new Date(),
                    undoneByUserId: 'system'
                }
            });

            return NextResponse.json({
                success: true,
                message: 'Merge undone. Person has been restored.',
                restoredPersonId: personData.id
            });
        }

        return NextResponse.json({ error: 'Unknown action type' }, { status: 400 });
    } catch (error) {
        console.error('Error undoing flag:', error);
        return NextResponse.json(
            { error: 'Failed to undo flag' },
            { status: 500 }
        );
    }
}
