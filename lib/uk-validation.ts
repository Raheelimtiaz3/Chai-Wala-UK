const UK_POSTCODE_REGEX = /^([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})$/i;

export function validateUKPostcode(raw: string): { valid: boolean; formatted: string } {
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, '');
  if (cleaned.length < 5 || cleaned.length > 7) {
    return { valid: false, formatted: raw.trim().toUpperCase() };
  }
  const match = cleaned.match(/^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})$/);
  if (!match) {
    return { valid: false, formatted: raw.trim().toUpperCase() };
  }
  const formatted = `${match[1]} ${match[2]}`;
  if (!UK_POSTCODE_REGEX.test(formatted)) {
    return { valid: false, formatted };
  }
  return { valid: true, formatted };
}

export function validateUKPhone(raw: string): boolean {
  const digits = raw.replace(/[\s\-().]/g, '');
  return /^(\+44\d{9,10}|0\d{9,10})$/.test(digits);
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function formatGBP(pence: number): string {
  const pounds = (pence || 0) / 100;
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(pounds);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
