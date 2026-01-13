/**
 * Formats a date string from YYYY-MM-DD to DD/MM/YYYY
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date string in DD/MM/YYYY format
 */
export function formatDate(dateString: string): string {
  if (!dateString) return dateString;
  
  // Parse YYYY-MM-DD format
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  
  // If already in DD/MM/YYYY format or other format, return as-is
  return dateString;
}

/**
 * Formats a Date object to DD/MM/YYYY string
 * @param date - Date object
 * @returns Date string in DD/MM/YYYY format
 */
export function formatDateObject(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
