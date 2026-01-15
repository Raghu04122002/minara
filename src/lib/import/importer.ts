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

function findColumn(row: CSVRow, possibleNames: string[]): string | undefined {
    const keys = Object.keys(row);
    for (const name of possibleNames) {
        const found = keys.find(k => k.toLowerCase().replace(/[^a-z]/g, '') === name.toLowerCase().replace(/[^a-z]/g, ''));
        if (found) return row[found];
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
            // Heuristic Column Mapping
            const email = findColumn(row, ['email', 'e-mail', 'mail']);
            const phone = findColumn(row, ['phone', 'mobile', 'cell', 'telephone']);
            const firstName = findColumn(row, ['firstname', 'first name', 'given name', 'f name']);
            const lastName = findColumn(row, ['lastname', 'last name', 'surname', 'family name']);
            const name = findColumn(row, ['name', 'full name']); // Fallback if split names not found

            let finalFirst = firstName;
            let finalLast = lastName;

            if (!finalFirst && !finalLast && name) {
                // Split full name if necessary
                const parts = name.trim().split(/\s+/);
                if (parts.length > 0) finalFirst = parts[0];
                if (parts.length > 1) finalLast = parts.slice(1).join(' ');
            }

            // If no identifier, skip ? Or create anonymous?
            // "Usually have email... Sometimes have phone...".
            // If we have neither email nor phone, we can't really match or create a useful person?
            // Requirement: "False positives are worse than missing families." implies conservative.
            // But for Person creation: "If no match -> create a new Person".
            // If we have just a name, we can create a person.

            // Transaction Data
            const amountStr = findColumn(row, ['amount', 'price', 'value', 'total']);
            const dateStr = findColumn(row, ['date', 'created at', 'time', 'timestamp']);
            const typeStr = findColumn(row, ['type', 'category']) || 'unknown';
            const description = findColumn(row, ['description', 'memo', 'note']);

            // Match or Create Person
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

            // Create Transaction
            // We assume every row is a transaction of some sort?
            // Or maybe it's just a contact list?
            // "From CSV files (donations, event tickets, program enrollments)" -> implies transactions.

            // Parse Amount
            let amount: string | number = 0;
            if (amountStr) {
                const cleaned = amountStr.replace(/[^0-9.-]/g, '');
                if (cleaned && !isNaN(parseFloat(cleaned))) {
                    amount = cleaned; // Pass string to preserve precision if possible, or simplified.
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
