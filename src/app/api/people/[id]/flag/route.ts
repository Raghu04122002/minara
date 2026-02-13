import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { reason, duplicatePersonId, notes } = await request.json();

        if (!reason) {
            return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
        }

        const validReasons = ['missing_details', 'repeated_person', 'summary_row', 'other'];
        if (!validReasons.includes(reason)) {
            return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });
        }

        // Prevent self-merge
        if (reason === 'repeated_person') {
            if (!duplicatePersonId) {
                return NextResponse.json({ error: 'Must select the person to merge into' }, { status: 400 });
            }
            if (duplicatePersonId === id) {
                return NextResponse.json({ error: 'Cannot merge a person with themselves' }, { status: 400 });
            }

            // Verify both people exist
            const [flaggedPerson, targetPerson] = await Promise.all([
                prisma.person.findUnique({
                    where: { id },
                    include: { memberships: true, transactions: true }
                }),
                prisma.person.findUnique({ where: { id: duplicatePersonId } })
            ]);

            if (!flaggedPerson || !targetPerson) {
                return NextResponse.json({ error: 'One or both people not found' }, { status: 404 });
            }

            // Save snapshot of the flagged person BEFORE merge for undo capability
            const snapshot = {
                person: {
                    id: flaggedPerson.id,
                    firstName: flaggedPerson.firstName,
                    lastName: flaggedPerson.lastName,
                    email: flaggedPerson.email,
                    phone: flaggedPerson.phone,
                    normalizedEmail: flaggedPerson.normalizedEmail,
                    normalizedPhone: flaggedPerson.normalizedPhone,
                    familyId: flaggedPerson.familyId,
                    addressId: flaggedPerson.addressId,
                },
                transactionIds: flaggedPerson.transactions.map((t: any) => t.id),
                memberships: flaggedPerson.memberships.map((m: any) => ({
                    id: m.id,
                    familyId: m.familyId,
                    role: m.role,
                    groupedBy: m.groupedBy,
                    manualAssignment: m.manualAssignment
                }))
            };

            // --- Perform merge ---

            // A. Move all transactions to target person
            await prisma.transaction.updateMany({
                where: { personId: id },
                data: { personId: duplicatePersonId }
            });

            // B. Move family memberships (skip if target already in that family)
            for (const membership of flaggedPerson.memberships) {
                const existing = await prisma.familyMember.findUnique({
                    where: {
                        familyId_personId: {
                            familyId: membership.familyId,
                            personId: duplicatePersonId
                        }
                    }
                });

                if (!existing) {
                    await prisma.familyMember.update({
                        where: { id: membership.id },
                        data: { personId: duplicatePersonId }
                    });
                } else {
                    await prisma.familyMember.delete({
                        where: { id: membership.id }
                    });
                }
            }

            // C. Delete the flagged person
            await prisma.person.delete({ where: { id } });

            // D. Create audit flag record on surviving person with snapshot
            await prisma.personFlag.create({
                data: {
                    personId: duplicatePersonId,
                    actionType: 'merge',
                    reason: 'repeated_person',
                    notes: notes || `Merged from ${flaggedPerson.firstName} ${flaggedPerson.lastName} (${id})`,
                    duplicatePersonId: id,
                    targetPersonId: duplicatePersonId,
                    snapshot
                }
            });

            // E. Mark target person with merged audit
            await prisma.person.update({
                where: { id: duplicatePersonId },
                data: { mergedFromPersonId: id }
            });

            return NextResponse.json({
                success: true,
                merged: true,
                targetPersonId: duplicatePersonId,
                message: `Person merged into ${targetPerson.firstName} ${targetPerson.lastName}`
            });
        }

        // --- Non-merge flag ---
        // Save a snapshot of the person for undo
        const person = await prisma.person.findUnique({ where: { id } });
        if (!person) {
            return NextResponse.json({ error: 'Person not found' }, { status: 404 });
        }

        const snapshot = {
            person: {
                id: person.id,
                firstName: person.firstName,
                lastName: person.lastName,
                email: person.email,
                phone: person.phone,
                is_flagged: person.is_flagged,
                flag_reason: person.flag_reason,
            }
        };

        await prisma.personFlag.create({
            data: {
                personId: id,
                actionType: 'flag',
                reason,
                notes: notes || null,
                snapshot
            }
        });

        await prisma.person.update({
            where: { id },
            data: {
                is_flagged: true,
                flag_reason: reason,
                flagged_at: new Date()
            }
        });

        return NextResponse.json({ success: true, merged: false });
    } catch (error) {
        console.error('Error flagging person:', error);
        return NextResponse.json(
            { error: 'Failed to flag person' },
            { status: 500 }
        );
    }
}
