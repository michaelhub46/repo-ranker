/**
 * Calculate days since a given date
 */
export function daysSince(date: string | Date): number {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - targetDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if a date is within a given number of days
 */
export function isWithinDays(date: string | Date, days: number): boolean {
  return daysSince(date) <= days;
}

/**
 * Format date for GitHub API queries
 */
export function formatDateForGitHub(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Parse date range for search filters
 */
export function parseDateRange(range: 'today' | 'week' | 'month' | 'year'): string {
  const now = new Date();
  let startDate: Date;

  switch (range) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
    case 'year':
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    default:
      startDate = now;
  }

  return `>=${formatDateForGitHub(startDate)}`;
}