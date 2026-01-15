import { parseCSV, CSVRow } from './csv-parser';
import { findMatchingPerson, createPerson } from './person-matcher';
import { prisma } from '@/lib/prisma';
// Removed Decimal import

interface ImportResult {
    totalRows: number;
    createdPeople: number;
    createdTransactions: number;
    errors: string[];
}

function sanitize(val: string | undefined | null): string | null {
    if (!val) return null;
    const v = String(val).trim();
    const lower = v.toLowerCase();
    if (lower === 'info requested' || lower === 'not provided' || lower === 'na' || lower === 'n/a' || lower === 'unknown' || lower === 'requested') {
        return null;
    }
    return v;
}

function findBestColumn(row: CSVRow, primaryKeywords: string[]): string | undefined {
    const keys = Object.keys(row);
    const normalizedKeys = keys.map(k => ({ original: k, clean: k.toLowerCase().replace(/[^a-z]/g, '') }));

    // 1. Try exact match (any keywords)
    for (const phrase of primaryKeywords) {
        const target = phrase.toLowerCase().replace(/[^a-z]/g, '');
        const found = normalizedKeys.find(k => k.clean === target);
        if (found) return row[found.original];
    }

    // 2. Try partial match (keywords included in header)
    for (const phrase of primaryKeywords) {
        const target = phrase.toLowerCase().replace(/[^a-z]/g, '');
        const found = normalizedKeys.find(k => k.clean.includes(target));
        if (found) return row[found.original];
    }

    return undefined;
}

export async function processCSVImport(content: string, sourceSystem: string = 'CSV Import'): Promise<ImportResult> {
    const rows = parseCSV(content);
    const result: ImportResult = {
        totalRows: rows.length,
        createdPeople: 0,
        createdTransactions: 0,
        errors: []
    };

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
            // Priority Mapping: Attendee -> Buyer -> General
            const attEmail = sanitize(findBestColumn(row, ['attendee email']));
            const buyerEmail = sanitize(findBestColumn(row, ['buyer email', 'purchaser email', 'customer email']));
            const genEmail = sanitize(findBestColumn(row, ['email', 'mail', 'e-mail']));

            const email = attEmail || genEmail; // We DON'T fallback to buyerEmail here to avoid merging siblings

            const attFirst = sanitize(findBestColumn(row, ['attendee first name', 'attendee name']));
            const buyerFirst = sanitize(findBestColumn(row, ['buyer first name', 'purchaser first name', 'customer first name', 'buyer name']));
            const genFirst = sanitize(findBestColumn(row, ['firstname', 'first name', 'given name']));

            const attLast = sanitize(findBestColumn(row, ['attendee last name']));
            const buyerLast = sanitize(findBestColumn(row, ['buyer last name', 'purchaser last name', 'customer last name']));
            const genLast = sanitize(findBestColumn(row, ['lastname', 'last name', 'surname']));

            const phone = sanitize(findBestColumn(row, ['phone', 'mobile', 'cell', 'telephone', 'phonenumber'])) || sanitize(findBestColumn(row, ['buyer phone', 'purchaser phone']));

            let finalFirst = attFirst || genFirst || buyerFirst;
            let finalLast = attLast || genLast || buyerLast;

            // Fallback for full name columns
            if (!finalFirst && !finalLast) {
                const fullName = sanitize(findBestColumn(row, ['name', 'full name', 'attendee full name', 'buyer full name']));
                if (fullName) {
                    const parts = fullName.split(/\s+/);
                    finalFirst = parts[0];
                    finalLast = parts.slice(1).join(' ');
                }
            }

            // Transaction Data
            const amountStr = findBestColumn(row, ['amount', 'price', 'ticket price', 'total', 'value']);
            const dateStr = findBestColumn(row, ['date', 'order date', 'time', 'timestamp', 'created at', 'start date']);
            const typeStr = findBestColumn(row, ['ticket type', 'type', 'category']) || 'unknown';
            const description = findBestColumn(row, ['event name', 'description', 'memo', 'note', 'ticket tier']);

            // Match or Create Person
            // If they have NO identifiers (email/phone), we use name + OrderID?
            // For now, names are enough to create a Person, but we won't match them to others easily without IDs.
            let person = await findMatchingPerson({ email, phone, lastName: finalLast });

            if (!person) {
                person = await createPerson({
                    email,
                    phone,
                    firstName: finalFirst,
                    lastName: finalLast
                });
                result.createdPeople++;
            }

            // Parse Amount
            let amount: string | number = 0;
            if (amountStr) {
                const cleaned = amountStr.replace(/[^0-9.-]/g, '');
                if (cleaned && !isNaN(parseFloat(cleaned))) {
                    amount = cleaned;
                }
            }

            // Parse Date
            let occurredAt = new Date();
            if (dateStr) {
                const parsed = new Date(dateStr);
                if (!isNaN(parsed.getTime())) {
                    occurredAt = parsed;
                }
            }

            await prisma.transaction.create({
                data: {
                    personId: person.id,
                    type: typeStr || 'import',
                    amount: amount,
                    description: description || `Imported from ${sourceSystem}`,
                    occurredAt: occurredAt,
                    sourceSystem: sourceSystem,
                }
            });
            result.createdTransactions++;

        } catch (error) {
            console.error(`Error processing row ${i}:`, error);
            result.errors.push(`Row ${i + 1}: ${(error as Error).message}`);
        }
    }

    return result;
}
