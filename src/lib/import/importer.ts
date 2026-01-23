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

interface ImportOptions {
    mode: 'append' | 'replace';
    dataType?: 'event' | 'donation';
}

export async function processCSVImport(content: string, filename: string = 'Upload', options: ImportOptions = { mode: 'append', dataType: 'event' }): Promise<ImportResult> {
    const dataType = options.dataType || 'event';
    if (options.mode === 'replace') {
        console.log('--- Wiping DB for Replace Mode ---');
        await prisma.$transaction([
            prisma.transaction.deleteMany({}),
            prisma.familyMember.deleteMany({}),
            prisma.person.deleteMany({}),
            prisma.family.deleteMany({}),
            prisma.rawImportFile.deleteMany({}),
        ]);
    }

    const rows = parseCSV(content);

    // Create RawImportFile record
    const importFile = await prisma.rawImportFile.create({
        data: {
            filename,
            rowCount: rows.length,
            sourceSystem: filename.includes('_') ? filename.split('_')[1] : 'Upload'
        }
    });

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

            // Transaction Data - different fields for event vs donation
            let amountStr: string | undefined;
            let dateStr: string | undefined;
            let description: string | undefined;
            let transactionType: string;

            if (dataType === 'donation') {
                // Donation-specific field mapping - many possible column names
                amountStr = findBestColumn(row, [
                    'amount', 'donation amount', 'contribution', 'gift amount', 'total',
                    'donated', 'gift', 'pledge', 'pledge amount', 'donation', 'giving amount',
                    'net amount', 'gross amount', 'payment amount'
                ]);
                dateStr = findBestColumn(row, ['date', 'donation date', 'gift date', 'created at', 'timestamp', 'payment date', 'received date']);
                description = findBestColumn(row, ['description', 'memo', 'note', 'campaign', 'fund', 'purpose', 'appeal', 'designation']);
                transactionType = 'donation';
            } else {
                // Event-specific field mapping
                amountStr = findBestColumn(row, ['amount', 'price', 'ticket price', 'total', 'value', 'amountpaid', 'feepaid', 'amount paid', 'fee paid']);
                dateStr = findBestColumn(row, ['date', 'order date', 'time', 'timestamp', 'created at', 'start date']);
                description = findBestColumn(row, ['event name', 'description', 'memo', 'note', 'ticket tier']);
                transactionType = findBestColumn(row, ['ticket type', 'type', 'category']) || 'ticket';
            }

            // Match or Create Person
            // Address / Household Grouping Information
            const city = sanitize(findBestColumn(row, ['city', 'purchaser city']));
            const state = sanitize(findBestColumn(row, ['state', 'purchaser state', 'province']));
            const zip = sanitize(findBestColumn(row, ['zip', 'postal code', 'purchaser postal code']));

            let addressId: string | null = null;
            if (buyerEmail || (city && state)) {
                // Create a shared identifier for grouping via Address hash
                const hashInput = `VIRTUAL_${buyerEmail || ''}_${city || ''}_${state || ''}_${zip || ''}`;
                const normalizedHash = hashInput.toLowerCase().replace(/[^a-z0-9]/g, '');

                const address = await prisma.address.upsert({
                    where: { normalizedHash },
                    update: {},
                    create: {
                        city: city,
                        state: state,
                        postalCode: zip,
                        normalizedHash: normalizedHash
                    }
                });
                addressId = address.id;
            }

            let person = await findMatchingPerson({
                email,
                phone,
                firstName: finalFirst,
                lastName: finalLast
            });

            if (!person) {
                person = await createPerson({
                    email,
                    phone,
                    firstName: finalFirst,
                    lastName: finalLast,
                    addressId: addressId
                });
                result.createdPeople++;
            } else if (addressId && !person.addressId) {
                // Update existing person with address if missing
                person = await prisma.person.update({
                    where: { id: person.id },
                    data: { addressId }
                });
            }

            if (!person) throw new Error("Failed to create or find person");

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
            let dateInvalid = false;
            if (dateStr) {
                const parsed = new Date(dateStr);
                if (!isNaN(parsed.getTime())) {
                    occurredAt = parsed;
                } else {
                    dateInvalid = true;
                }
            }

            // --- Flagging Logic ---
            const reasons: string[] = [];

            // A) Summary Row Detection - only flag if:
            //    - A cell value IS exactly a summary keyword (not just contains)
            //    - OR the row has no person info AND contains a summary keyword
            const summaryKeywords = ['total', 'grand total', 'summary', 'subtotal'];
            const hasNoPersonInfo = !email && !phone && !finalFirst && !finalLast;

            const isSummaryRow = Object.values(row).some(val => {
                const v = String(val).toLowerCase().trim();
                // Check if the value IS exactly a summary keyword
                return summaryKeywords.includes(v);
            });

            // Only flag if it's a clear summary row (exact match) OR no person info + contains keyword
            if (isSummaryRow || (hasNoPersonInfo && Object.values(row).some(val => {
                const v = String(val).toLowerCase();
                return summaryKeywords.some(kw => v === kw || v.startsWith(kw + ':') || v.startsWith(kw + ' '));
            }))) {
                reasons.push('SUMMARY_ROW');
            }

            // B) Missing Required Identifiers
            if (!email && !phone && !finalFirst && !finalLast) {
                reasons.push('MISSING_PERSON_FIELDS');
            }

            // C) Amount Anomaly
            const ceiling = Number(process.env.ANOMALY_AMOUNT_CEILING) || 5000;
            if (Number(amount) > ceiling) {
                reasons.push('AMOUNT_TOO_HIGH');
            }

            // D) Invalid Date
            if (dateInvalid) {
                reasons.push('INVALID_DATE');
            }

            const isFlagged = reasons.length > 0;
            const flagReason = reasons.length > 1 ? 'MULTIPLE' : (reasons[0] || null);

            await prisma.transaction.create({
                data: {
                    personId: person.id,
                    type: transactionType,
                    amount: amount,
                    description: description || `Imported from ${filename}`,
                    occurredAt: occurredAt,
                    sourceSystem: filename,
                    importFileId: importFile.id,
                    sourceRowIndex: i,
                    is_flagged: isFlagged,
                    flag_reason: flagReason
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
