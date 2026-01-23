import { prisma } from '@/lib/prisma';
import { normalizePhone } from './phone-normalizer';
import { Person } from '@prisma/client';

interface PersonInput {
    email?: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    addressId?: string | null;
}

/**
 * Matches an incoming person to an existing record.
 * Priority:
 * 1. Exact Email (case-insensitive) + Name Match
 * 2. Exact Phone (normalized) + Name Match
 * 3. Email + Last Name match (if both present)
 * 
 * Rules:
 * - Never match using last name only
 * - Never match using first name only
 * - Avoid false merges
 */
export async function findMatchingPerson(
    input: PersonInput
): Promise<Person | null> {
    const { email, phone, firstName, lastName } = input;
    const normalizedPhoneValue = normalizePhone(phone);
    const cleanEmail = email?.trim().toLowerCase();

    // 1. Exact Email (case-insensitive) + Name Match
    // We only merge if the last names match or one is missing, to avoid merging Jane & John Smith.
    if (cleanEmail) {
        const potentialMatches = await prisma.person.findMany({
            where: {
                email: cleanEmail
            }
        });

        if (potentialMatches.length > 0) {
            // Priority: Find a match where BOTH first and last names match if provided
            const fullMatch = potentialMatches.find((p: Person) => {
                const sameLast = !lastName || !p.lastName || p.lastName.toLowerCase() === lastName.trim().toLowerCase();
                const sameFirst = !firstName || !p.firstName || p.firstName.toLowerCase() === firstName.trim().toLowerCase();
                return sameLast && sameFirst;
            });
            if (fullMatch) return fullMatch;
        }
    }

    // 2. Else, same phone + Name Match
    if (normalizedPhoneValue) {
        const potentialMatches = await prisma.person.findMany({
            where: {
                phone: normalizedPhoneValue
            }
        });

        if (potentialMatches.length > 0) {
            const fullMatch = potentialMatches.find((p: Person) => {
                const sameLast = !lastName || !p.lastName || p.lastName.toLowerCase() === lastName.trim().toLowerCase();
                const sameFirst = !firstName || !p.firstName || p.firstName.toLowerCase() === firstName.trim().toLowerCase();
                return sameLast && sameFirst;
            });
            if (fullMatch) return fullMatch;
        }
    }

    // 3. Else, same email + same last name
    if (cleanEmail && lastName && lastName.trim()) {
        const potentialMatches = await prisma.person.findMany({
            where: {
                email: cleanEmail
            }
        });
        const match = potentialMatches.find((p: Person) =>
            p.lastName && p.lastName.toLowerCase() === lastName.trim().toLowerCase()
        );
        // If we found someone but they have a DIFFERENT first name, it's NOT a match
        if (match && firstName && match.firstName && match.firstName.toLowerCase() !== firstName.trim().toLowerCase()) {
            return null;
        }
        if (match) return match;
    }

    return null;
}

export async function createPerson(input: PersonInput): Promise<Person> {
    const { email, phone, firstName, lastName, addressId } = input;
    const normalizedPhoneValue = normalizePhone(phone);

    return await prisma.person.create({
        data: {
            email: email ? email.trim().toLowerCase() : null,
            phone: normalizedPhoneValue,
            firstName: firstName ? firstName.trim() : null,
            lastName: lastName ? lastName.trim() : null,
            addressId: addressId,
        }
    });
}
