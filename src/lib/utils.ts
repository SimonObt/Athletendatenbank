export function generateImportId(lastName: string, firstName: string, birthYear: number | string): string {
  const normalized = `${lastName.trim()}_${firstName.trim()}_${birthYear}`.toLowerCase();
  return normalized.replace(/\s+/g, '_');
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('de-DE');
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
  return /^[\d\s\-\+\(\)\/\.]+$/.test(phone);
}

// BUG-1 Fix: Jahrgang-Validierung und Korrektur
export function parseBirthYear(yearInput: string | number): number | null {
  const year = typeof yearInput === 'string' ? parseInt(yearInput.trim()) : yearInput;
  
  if (isNaN(year)) return null;
  
  // Wenn es eine 4-stellige Jahreszahl ist (1900-2099)
  if (year >= 1900 && year <= 2099) {
    return year;
  }
  
  // Wenn es eine 2-stellige Jahreszahl ist
  if (year >= 0 && year <= 99) {
    // 0-30 → 2000-2030, 31-99 → 1931-1999
    return year <= 30 ? 2000 + year : 1900 + year;
  }
  
  return null;
}

export function validateBirthYear(year: number): boolean {
  return year >= 1900 && year <= 2030;
}
