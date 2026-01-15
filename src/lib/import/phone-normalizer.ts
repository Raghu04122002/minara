export function normalizePhone(phone: string | null | undefined): string | null {
    if (!phone) return null;
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // If no digits found, return null
    if (!digits) return null;

    return digits;
}
