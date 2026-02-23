/**
 * registration_ingest() — The core registration pipeline.
 * 
 * ALL registration sources must call this function:
 * - Public household form
 * - Stripe ticket purchase
 * - Stripe webhook
 * - CSV import
 * 
 * Steps:
 * 1. Persist raw payload → RegistrationSubmission
 * 2. Create RegistrationParticipant rows
 * 3. Resolve Person for each participant (identity rules)
 * 4. Assign Household
 * 5. Create EventParticipation (unique per event+person, QR UUID)
 * 6. Finalize submission status
 */

import { prisma } from '@/lib/prisma';

// ─── Types ───

export interface ParticipantInput {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    dob?: string;         // ISO date string
    role?: string;        // primary, spouse, child, guest
    gender?: string;
    ticketTierId?: string;
}

export interface IngestPayload {
    participants: ParticipantInput[];
    notes?: string;
}

export interface IngestResult {
    submissionId: string;
    status: 'matched' | 'needs_review' | 'error';
    participations: { personId: string; qrCodeToken: string; participantName: string }[];
    errors: string[];
}

// ─── Normalization helpers ───

function normalizeEmail(email?: string): string | null {
    if (!email) return null;
    return email.trim().toLowerCase();
}

function normalizePhone(phone?: string): string | null {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return digits;
    if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
    return digits || null;
}

// ─── Person Resolution ───

interface MatchResult {
    personId: string | null;
    confidence: string;
    method: string;
    candidateIds?: string[];
}

async function resolvePerson(p: ParticipantInput, institutionId?: string): Promise<{ personId: string | null; confidence: string; method: string, candidateIds?: string[] }> {
    const normEmail = normalizeEmail(p.email);
    const normPhone = normalizePhone(p.phone);
    const lastName = p.lastName?.trim().toLowerCase();
    const firstName = p.firstName?.trim().toLowerCase();

    const highMatches: { id: string; method: string }[] = [];
    const mediumMatches: { id: string; method: string }[] = [];

    // HIGH confidence: first + last + email
    if (normEmail && lastName && firstName) {
        const match = await prisma.person.findFirst({
            where: {
                normalizedEmail: normEmail,
                lastName: { equals: p.lastName, mode: 'insensitive' },
                firstName: { equals: p.firstName, mode: 'insensitive' },
            },
        });
        if (match) highMatches.push({ id: match.id, method: 'first+last+email' });
    }

    // HIGH confidence: first + last + phone
    if (normPhone && lastName && firstName) {
        const match = await prisma.person.findFirst({
            where: {
                normalizedPhone: normPhone,
                lastName: { equals: p.lastName, mode: 'insensitive' },
                firstName: { equals: p.firstName, mode: 'insensitive' },
            },
        });
        if (match && !highMatches.find(m => m.id === match.id)) {
            highMatches.push({ id: match.id, method: 'first+last+phone' });
        }
    }

    // HIGH confidence: first + last + DOB
    if (firstName && lastName && p.dob) {
        const match = await prisma.person.findFirst({
            where: {
                firstName: { equals: p.firstName, mode: 'insensitive' },
                lastName: { equals: p.lastName, mode: 'insensitive' },
                dateOfBirth: new Date(p.dob),
            },
        });
        if (match && !highMatches.find(m => m.id === match.id)) {
            highMatches.push({ id: match.id, method: 'first+last+dob' });
        }
    }

    // MEDIUM confidence: email alone (or email + lastname without firstname)
    if (normEmail && highMatches.length === 0) {
        const matches = await prisma.person.findMany({
            where: { normalizedEmail: normEmail },
        });
        matches.forEach(match => mediumMatches.push({ id: match.id, method: 'email_only' }));
    }

    // MEDIUM confidence: phone alone
    if (normPhone && highMatches.length === 0) {
        const matches = await prisma.person.findMany({
            where: { normalizedPhone: normPhone },
        });
        matches.forEach(match => {
            if (!mediumMatches.find(m => m.id === match.id)) {
                mediumMatches.push({ id: match.id, method: 'phone_only' });
            }
        });
    }

    // Decision
    const uniqueHighIds = [...new Set(highMatches.map(m => m.id))];

    if (uniqueHighIds.length === 1) {
        return { personId: uniqueHighIds[0], confidence: 'high', method: highMatches[0].method };
    }

    if (uniqueHighIds.length > 1) {
        // Multiple high matches → ambiguous, needs_review
        return {
            personId: null,
            confidence: 'ambiguous',
            method: 'multiple_high_matches',
            candidateIds: uniqueHighIds
        };
    }

    // No HIGH matches
    if (mediumMatches.length === 0) {
        // No matches at all → create new person
        return { personId: null, confidence: 'none', method: 'no_match' };
    }

    // Only MEDIUM matches → needs_review
    const uniqueMediumIds = [...new Set(mediumMatches.map(m => m.id))];
    return {
        personId: null,
        confidence: 'ambiguous',
        method: 'medium_only: ' + [...new Set(mediumMatches.map(m => m.method))].join(', '),
        candidateIds: uniqueMediumIds
    };
}

// ─── Create Person ───

async function createPerson(p: ParticipantInput, source: string, institutionId?: string): Promise<string> {
    const person = await prisma.person.create({
        data: {
            firstName: p.firstName || null,
            lastName: p.lastName || null,
            primaryEmail: p.email || null,
            primaryPhone: p.phone || null,
            normalizedEmail: normalizeEmail(p.email),
            normalizedPhone: normalizePhone(p.phone),
            dateOfBirth: p.dob ? new Date(p.dob) : null,
            gender: p.gender || null,
            createdSource: source,
            institutionId: institutionId || 'unassigned',
        },
    });
    return person.id;
}

// ─── Household Assignment ───

async function assignHousehold(personId: string, lastName: string, role: string, canCreate: boolean = false) {
    const person = await prisma.person.findUnique({
        where: { id: personId },
        include: { householdMembers: true }
    });

    if (!person) return null;

    // 1. If already in a household, return that
    if (person.householdMembers.length > 0) {
        return person.householdMembers[0].householdId;
    }

    // 2. Try to find a matching household via contact info (email or phone)
    const normEmail = person.normalizedEmail;
    const normPhone = person.normalizedPhone;

    if (normEmail || normPhone) {
        const matchingMember = await prisma.householdMember.findFirst({
            where: {
                person: {
                    OR: [
                        normEmail ? { normalizedEmail: normEmail } : {},
                        normPhone ? { normalizedPhone: normPhone } : {},
                    ].filter(cond => Object.keys(cond).length > 0)
                }
            },
            select: { householdId: true }
        });

        if (matchingMember) {
            // Join existing household
            await prisma.householdMember.create({
                data: {
                    householdId: matchingMember.householdId,
                    personId: personId,
                    roleInHousehold: role,
                    groupedBy: 'AUTO_MATCH'
                },
            });
            return matchingMember.householdId;
        }
    }

    // 3. If no match found and primary, create new household automatically
    // ONLY if canCreate is true (usually means multiple participants)
    if (role === 'primary' && canCreate) {
        const householdName = `${lastName} Household`;
        const household = await prisma.household.create({
            data: {
                householdName: householdName,
                source: 'public_form',
                primaryContactPersonId: personId,
            },
        });
        await prisma.householdMember.create({
            data: {
                householdId: household.id,
                personId,
                roleInHousehold: 'primary',
                isPrimaryGuardian: true,
                groupedBy: 'AUTO_CREATE'
            },
        });
        return household.id;
    }

    return null;
}

// ─── Main Pipeline ───

export async function registrationIngest(
    payload: IngestPayload,
    source: string,
    eventId: string,
    institutionId: string,
    orderId?: string,
): Promise<IngestResult> {
    const errors: string[] = [];
    const participations: IngestResult['participations'] = [];
    let overallStatus: 'matched' | 'needs_review' | 'error' = 'matched';

    try {
        // 1. Persist raw payload → RegistrationSubmission
        const submission = await prisma.registrationSubmission.create({
            data: {
                eventId,
                submissionChannel: source,
                rawPayloadJson: payload as any,
                processingStatus: 'pending',
                institutionId: institutionId,
                orderId: orderId || null,
            },
        });

        let primaryFamilyId: string | null = null;

        // 2-5. Process each participant
        for (const p of payload.participants) {
            try {
                const role = p.role || 'guest';

                // 2. Create RegistrationParticipant
                const participant = await prisma.registrationParticipant.create({
                    data: {
                        submissionId: submission.id,
                        firstName: p.firstName,
                        lastName: p.lastName,
                        email: p.email || null,
                        phone: p.phone || null,
                        dob: p.dob ? new Date(p.dob) : null,
                        role,
                    },
                });

                // 3. Resolve Person
                const match = await resolvePerson(p);

                let personId: string;

                if (match.confidence === 'high' && match.personId) {
                    personId = match.personId;
                    // Update participant with resolution
                    await prisma.registrationParticipant.update({
                        where: { id: participant.id },
                        data: {
                            personId: personId,
                            matchExplanationJson: {
                                confidence: match.confidence,
                                method: match.method,
                            }
                        },
                    });
                } else if (match.confidence === 'none') {
                    // Create new person
                    personId = await createPerson(p, source, institutionId);
                    await prisma.registrationParticipant.update({
                        where: { id: participant.id },
                        data: {
                            personId: personId,
                            matchExplanationJson: {
                                confidence: 'none',
                                method: 'new_person_created',
                            }
                        },
                    });
                } else {
                    // Ambiguous → needs_review
                    overallStatus = 'needs_review';
                    // Still create person but mark as needs review
                    personId = await createPerson(p, source, institutionId);
                    await prisma.registrationParticipant.update({
                        where: { id: participant.id },
                        data: {
                            personId: personId,
                            matchExplanationJson: {
                                confidence: match.confidence,
                                method: match.method,
                                candidateIds: match.candidateIds,
                            }
                        },
                    });
                    continue; // Skip EventParticipation for ambiguous
                }

                // 3.5. Link Order to Person if primary
                if (role === 'primary' && orderId) {
                    await prisma.order.update({
                        where: { id: orderId },
                        data: { personId: personId }
                    });
                }

                // 4. Assign Household
                if (role === 'primary') {
                    // Only allow household creation if there are multiple participants (family registration)
                    const canCreateHousehold = payload.participants.length > 1;
                    primaryFamilyId = await assignHousehold(personId, p.lastName, 'primary', canCreateHousehold);
                } else if (primaryFamilyId) {
                    // Attach non-primary to primary's household
                    const existingMember = await prisma.householdMember.findFirst({
                        where: { householdId: primaryFamilyId, personId },
                    });
                    if (!existingMember) {
                        await prisma.householdMember.create({
                            data: { householdId: primaryFamilyId, personId, roleInHousehold: role, groupedBy: 'REGISTRATION' },
                        });
                    }
                }

                // 5. Create EventParticipation (unique per event+person)
                const existingParticipation = await prisma.eventParticipation.findUnique({
                    where: { eventId_personId: { eventId, personId } },
                });

                if (!existingParticipation) {
                    const ep = await prisma.eventParticipation.create({
                        data: {
                            eventId,
                            personId,
                            ticketTierId: p.ticketTierId || null,
                            orderId: orderId || null,
                            participationSource: source,
                            status: 'registered',
                        },
                    });

                    // Increment quantitySold on ticket tier
                    if (p.ticketTierId) {
                        await prisma.ticketTier.update({
                            where: { id: p.ticketTierId },
                            data: { quantitySold: { increment: 1 } },
                        });
                    }

                    participations.push({
                        personId,
                        qrCodeToken: ep.qrCodeToken,
                        participantName: `${p.firstName} ${p.lastName}`.trim(),
                    });
                } else {
                    participations.push({
                        personId,
                        qrCodeToken: existingParticipation.qrCodeToken,
                        participantName: `${p.firstName} ${p.lastName}`.trim(),
                    });
                }
            } catch (err) {
                console.error(`Error processing participant ${p.firstName} ${p.lastName}:`, err);
                const msg = err instanceof Error ? err.message : 'Unknown error processing participant';
                errors.push(`${p.firstName} ${p.lastName}: ${msg}`);
            }
        }

        // 6. Finalize submission status
        const finalStatus = errors.length > 0 ? 'error' : overallStatus;

        await prisma.registrationSubmission.update({
            where: { id: submission.id },
            data: {
                processingStatus: finalStatus,
                ...(errors.length > 0 && { errorMessage: errors.join('; ') }),
            },
        });

        return {
            submissionId: submission.id,
            status: finalStatus,
            participations,
            errors,
        };
    } catch (err) {
        console.error('Pipeline error in registrationIngest:', err);
        const msg = err instanceof Error ? err.message : 'Unknown pipeline error';
        return {
            submissionId: '',
            status: 'error',
            participations: [],
            errors: [msg],
        };
    }
}
