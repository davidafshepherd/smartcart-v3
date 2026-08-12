/**
 * Formats a Date object to DD/MM/YYYY string.
 * @param date - Date object.
 * @returns Date string in DD/MM/YYYY format.
 */
export function formatDateObject(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}


/**
 * Formats a Date object to an abbreviated "Mon YYYY" string.
 * @param date - Date object.
 * @returns Date string in "Mon YYYY" format (e.g. "Jan 2026").
 */
export function formatMonthYear(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}


/**
 * Parses a date string from DD/MM/YYYY to YYYY-MM-DD.
 * @param dateString - Date string in DD/MM/YYYY format.
 * @returns Date string in YYYY-MM-DD format, or empty string if invalid.
 */
export function parseDDMMYYYY(dateString: string): string {
  if (!dateString) return '';
  
  // Parse DD/MM/YYYY format.
  const parts = dateString.split('/');
  if (parts.length === 3) {
    // Validate the date.
    const [day, month, year] = parts;
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) return '';
    if (monthNum < 1 || monthNum > 12) return '';
    if (dayNum < 1 || dayNum > 31) return '';
    
    return `${yearNum}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
  }
  
  // If already in YYYY-MM-DD format, return as-is.
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return dateString;
  
  return '';
}


/**
 * Parses a date string from YYYY-MM-DD to DD/MM/YYYY.
 * @param dateString - Date string in YYYY-MM-DD format.
 * @returns Date string in DD/MM/YYYY format.
 */
export function parseYYYYMMDD(dateString: string): string {
  if (!dateString) return dateString;

  // Parse YYYY-MM-DD format.
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }

  // If already in DD/MM/YYYY format or other format, return as-is.
  return dateString;
}


/**
 * Parses the YYYY-MM-DD portion of a report key (e.g. "YYYY-MM-DD_mealId").
 * @param key - The report key to parse.
 * @returns Date string in YYYY-MM-DD format, or null if the key doesn't start with a valid date.
 */
export function parseDateKey(key: string): Date | null {
  const [y, m, d] = key.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

