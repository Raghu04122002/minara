/**
 * Normalizes email for consistent matching.
 * - Lowercase
 * - Trim whitespace
 */
export function normalizeEmail(email: string | null | undefined): string | null {
    if (!email) return null;
    const cleaned = email.trim().toLowerCase();
    if (!cleaned || cleaned.length === 0) return null;
    return cleaned;
}
