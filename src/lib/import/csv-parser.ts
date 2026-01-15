import { parse } from 'csv-parse/sync';

export interface CSVRow {
    [key: string]: string;
}

export function parseCSV(content: string): CSVRow[] {
    // Parse CSV with header detection using csv-parse
    // "columns: true" infers headers from the first line
    // "skip_empty_lines: true" is generally useful
    // "trim: true" cleans up whitespace
    const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true, // Inconsistent CSVs might have trailing commas
    });

    return records;
}
