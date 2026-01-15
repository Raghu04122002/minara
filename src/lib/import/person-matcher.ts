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
 * 1. Exact Email (case-insensitive)
 * 2. Exact Phone (normalized)
 * 3. Email + Last Name (if both present) - Wait, if #1 failed, email doesn't match? 
 *    Ah, "Email + Last Name match (if both present)". 
 *    Maybe different email casing? Or maybe fuzzy? 
 *    Requirement says: "Exact email match (case-insensitive)"
 *    So #3 "Email + Last Name" implies what?
 *    Maybe checking if someone with that Last Name has that Email? 
 *    "Email + last name match (if both present)"
 *    If #1 checked "Exact email", then #3 is redundant unless #1 was checking ID? No, #1 is email.
 *    If I have email "alice@example.com", I search for Person with email "alice@example.com".
 *    If found -> Match.
 *    If NOT found -> #2 Phone.
 *    If Phone found -> Match.
 *    If NOT found -> #3 Email + Last Name.
 *    If email is "alice@example.com" and we didn't find it in #1, how can we find it in #3?
 *    Maybe I should interpret #3 as "Match if Email matches AND Last Name matches"?
 *    But if Email matched, #1 would have caught it.
 *    UNLESS #1 requires ONLY Email to match (and ignores name mismatch), and #3 requires BOTH?
 *    But matching logic says "Attempt to match ... in this exact order".
 *    If #1 succeeds, we stop.
 *    So #3 is only reachable if #1 and #2 failed.
 *    But if #1 failed (Email not found), then #3 (Email + LastName) will also fail to find that email.
 *    
 *    Maybe the requirement implies:
 *    1. Match on Email.
 *    2. Match on Phone.
 *    3. Match on (FirstName + LastName) ?? No, it says "Email + Last Name".
 *    
 *    Could mean: Match if (Email A matches Email B) OR (Phone A matches Phone B) OR (Email matches AND Last Name matches)?
 *    But that logic hierarchy implies if I have just Email, I match.
 *    
 *    Maybe #3 is for when Email is MISSING in the incoming data? No, if email is missing, #3 can't work.
 *    
 *    Let's re-read:
 *    "Exact email match (case-insensitive)"
 *    "Exact phone match (after normalization)"
 *    "Email + last name match (if both present)"
 *    
 *    Possibility:
 *    Maybe #1 is "Match by ID" (not listed).
 *    Maybe #1 is "Match by Email" (regardless of name).
 *    Maybe #3 is for cases where we might match loosely? No, "Exact".
 *    
 *    Wait, maybe the user means:
 *    If I have Email X.
 *    1. Is there a person with Email X? Yes -> Link.
 *    2. No -> Is there a person with Phone Y? Yes -> Link.
 *    3. No -> Is there a person with Email X AND Last Name Z?
 *       If step 1 failed, there is NO person with Email X. So step 3 is impossible.
 *       
 *    UNLESS step 1 is "Match by Email ALONE", and maybe step 3 is "Match by Email AND Last Name" (stricter)? 
 *    But if I match by Email alone, I implicitly match by Email + anything.
 *    
 *    Maybe the user meant "First Name + Last Name"? 
 *    "Email + last name match" might be a typo for "First Name + Last Name"?
 *    
 *    Let's assume the user knows what they wrote, or it's a hierarchy of lookup strategies.
 *    Maybe #1 is searching for Global Email.
 *    Maybe #3 is used when we don't have a confident match on email alone?
 *    But #1 is "Exact email match".
 *    
 *    Let's implement 1 and 2.
 *    If 1 and 2 fail, it's a new person.
 *    I'll implement the code to try 1 then 2.
 *    I will skip 3 for now or include it if I can make sense of it.
 *    Actually, if I look really closely:
 *    "Email + last name match" -> maybe matching someone who has that email AND that last name?
 *    But again, if they have that email, #1 finds them.
 *    
 *    Maybe matching logic is:
 *    Find by Email. If found -> Match.
 *    Find by Phone. If found -> Match.
 *    
 *    I'll stick to that. 
 *    If the user matches by email, we update the person? Or just return the ID?
 *    "If no match -> create a new Person."
 *    "Duplicates are acceptable. Incorrect merges are not."
 *    
 *    So I'll implement:
 *    findPerson(email, phone): Promise<Person | null>
 */

export async function findMatchingPerson(
    input: PersonInput
): Promise<Person | null> {
    const { email, phone, lastName } = input;
    const normalizedPhone = normalizePhone(phone);
    const cleanEmail = email?.trim().toLowerCase();

    // 1. Exact Email (case-insensitive) + Name Match
    // We only merge if the last names match or one is missing, to avoid merging Jane & John Smith.
    if (cleanEmail) {
        const potentialMatches = await prisma.person.findMany({
            where: {
                email: {
                    equals: cleanEmail,
                    mode: 'insensitive'
                }
            }
        });

        if (potentialMatches.length > 0) {
            // Find one that matches last name if provided
            if (lastName && lastName.trim()) {
                const nameMatch = potentialMatches.find((p: any) => !p.lastName || p.lastName.toLowerCase() === lastName.trim().toLowerCase());
                if (nameMatch) return nameMatch;
            } else {
                // If incoming has no last name, return the first one with same email
                return potentialMatches[0];
            }
        }
    }

    // 2. Else, same phone + Name Match
    if (normalizedPhone) {
        const potentialMatches = await prisma.person.findMany({
            where: {
                phone: normalizedPhone
            }
        });

        if (potentialMatches.length > 0) {
            if (lastName && lastName.trim()) {
                const nameMatch = potentialMatches.find((p: any) => !p.lastName || p.lastName.toLowerCase() === lastName.trim().toLowerCase());
                if (nameMatch) return nameMatch;
            } else {
                return potentialMatches[0];
            }
        }
    }

    // 3. Else, same email + same last name (already handled by #1 logic mostly, but for completeness)
    if (cleanEmail && lastName && lastName.trim()) {
        const match = await prisma.person.findFirst({
            where: {
                email: { equals: cleanEmail, mode: 'insensitive' },
                lastName: { equals: lastName.trim(), mode: 'insensitive' }
            }
        });
        if (match) return match;
    }

    return null;
}

export async function createPerson(input: PersonInput): Promise<Person> {
    const { email, phone, firstName, lastName, addressId } = input;
    const normalizedPhone = normalizePhone(phone);

    return await prisma.person.create({
        data: {
            email: email ? email.trim() : null,
            phone: normalizedPhone,
            firstName: firstName ? firstName.trim() : null,
            lastName: lastName ? lastName.trim() : null,
            addressId: addressId,
        }
    });
}
