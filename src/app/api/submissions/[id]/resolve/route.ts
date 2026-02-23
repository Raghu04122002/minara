import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id: submissionId } = await params;
    const formData = await req.formData();
    const action = formData.get('action') as string;
    const participantId = formData.get('participantId') as string;
    const targetPersonId = formData.get('targetPersonId') as string;

    const submission = await prisma.registrationSubmission.findUnique({
        where: { id: submissionId },
        include: { participants: true }
    });

    if (!submission) {
        return new NextResponse('Submission not found', { status: 404 });
    }

    const participant = await prisma.registrationParticipant.findUnique({
        where: { id: participantId },
        include: { person: true }
    });

    if (!participant) {
        return new NextResponse('Participant not found', { status: 404 });
    }

    try {
        if (action === 'merge' && targetPersonId) {
            const tempPersonId = participant.personId;

            // 1. Re-link participant to existing person
            await prisma.registrationParticipant.update({
                where: { id: participantId },
                data: {
                    personId: targetPersonId,
                    matchExplanationJson: {
                        ...(participant.matchExplanationJson as any),
                        resolvedAction: 'merged',
                        mergedInto: targetPersonId,
                        resolvedAt: new Date().toISOString()
                    }
                }
            });

            // 2. Transfer Order to target person if it was linked to the temp person
            if (tempPersonId) {
                await prisma.order.updateMany({
                    where: { personId: tempPersonId },
                    data: { personId: targetPersonId }
                });
            }

            // 3. Create EventParticipation for target person
            await prisma.eventParticipation.upsert({
                where: {
                    eventId_personId: {
                        eventId: submission.eventId,
                        personId: targetPersonId
                    }
                },
                update: {
                    status: 'registered',
                    participationSource: submission.submissionChannel
                },
                create: {
                    eventId: submission.eventId,
                    personId: targetPersonId,
                    participationSource: submission.submissionChannel,
                    status: 'registered'
                }
            });

            // 4. Delete temporary person record
            if (tempPersonId && tempPersonId !== targetPersonId) {
                // Check if temp person has other participations or data we shouldn't delete
                const otherSubmissions = await prisma.registrationParticipant.count({
                    where: { personId: tempPersonId, id: { not: participantId } }
                });

                if (otherSubmissions === 0) {
                    await prisma.person.delete({ where: { id: tempPersonId } });
                }
            }

        } else if (action === 'confirm') {
            const personId = participant.personId;

            if (personId) {
                // 1. Mark as confirmed
                await prisma.registrationParticipant.update({
                    where: { id: participantId },
                    data: {
                        matchExplanationJson: {
                            ...(participant.matchExplanationJson as any),
                            resolvedAction: 'confirmed_new',
                            resolvedAt: new Date().toISOString()
                        }
                    }
                });

                // 2. Create EventParticipation
                await prisma.eventParticipation.upsert({
                    where: {
                        eventId_personId: {
                            eventId: submission.eventId,
                            personId: personId
                        }
                    },
                    update: {
                        status: 'registered',
                        participationSource: submission.submissionChannel
                    },
                    create: {
                        eventId: submission.eventId,
                        personId: personId,
                        participationSource: submission.submissionChannel,
                        status: 'registered'
                    }
                });
            }
        }

        // Check if overall submission can be marked as matched
        const allParticipants = await prisma.registrationParticipant.findMany({
            where: { submissionId }
        });

        // A participant is resolved if their matchExplanationJson has a resolvedAction OR if their confidence was already HIGH
        const unresolvedCount = allParticipants.filter((p: any) => {
            const explanation = p.matchExplanationJson as any;
            return explanation?.confidence !== 'high' && !explanation?.resolvedAction;
        }).length;

        if (unresolvedCount === 0) {
            await prisma.registrationSubmission.update({
                where: { id: submissionId },
                data: { processingStatus: 'matched' }
            });
        }

    } catch (error) {
        console.error('Resolution Error:', error);
        return new NextResponse('Resolution Failed', { status: 500 });
    }

    // Redirect back to the submission detail page
    redirect(`/admin/submissions/${submissionId}`);
}
