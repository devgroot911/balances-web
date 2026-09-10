/**
 * Formats a number as standard currency / decimal (e.g., 415,000.00)
 */
export function formatCurrency(value: number): string {
  if (value === 0) return '0.00';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats a number in Millions or Thousands (e.g. 1.5M, 200K, -0.2M)
 */
export function formatCompactNumber(value: number): string {
  if (value === 0) return '0M';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    const formatted = (value / 1_000_000).toFixed(1);
    return `${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}M`;
  }
  if (abs >= 1_000) {
    const formatted = (value / 1_000).toFixed(1);
    return `${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}K`;
  }
  return value.toFixed(0);
}

/**
 * Month metadata mapping
 */
import { MonthKey, MonthMeta } from '../types';

export const MONTHS: MonthMeta[] = [
  { key: 'january', label: 'January', shortName: 'Jan', columnTitle: 'Sum of January', chartTitlePrefix: 'Sum of January' },
  { key: 'february', label: 'February', shortName: 'Feb', columnTitle: 'Sum of Accumulated tillFebruary', chartTitlePrefix: 'Sum of Accumulated tillFebruary' },
  { key: 'march', label: 'March', shortName: 'Mar', columnTitle: 'Sum of Accumulated tillMarch', chartTitlePrefix: 'Sum of Accumulated tillMarch' },
  { key: 'april', label: 'April', shortName: 'Apr', columnTitle: 'Sum of Accumulated tillApril', chartTitlePrefix: 'Sum of Accumulated tillApril' },
  { key: 'may', label: 'May', shortName: 'May', columnTitle: 'Sum of Accumulated tillMay', chartTitlePrefix: 'Sum of Accumulated tillMay' },
  { key: 'june', label: 'June', shortName: 'Jun', columnTitle: 'Sum of Accumulated tillJune', chartTitlePrefix: 'Sum of Accumulated tillJune' },
  { key: 'july', label: 'July', shortName: 'Jul', columnTitle: 'Sum of Accumulated tillJuly', chartTitlePrefix: 'Sum of Accumulated tillJuly' },
  { key: 'august', label: 'August', shortName: 'Aug', columnTitle: 'Sum of Accumulated tillAugust', chartTitlePrefix: 'Sum of Accumulated tillAugust' },
  { key: 'september', label: 'September', shortName: 'Sep', columnTitle: 'Sum of Accumulated tillSeptember', chartTitlePrefix: 'Sum of Accumulated tillSeptember' },
  { key: 'october', label: 'October', shortName: 'Oct', columnTitle: 'Sum of Accumulated tillOctober', chartTitlePrefix: 'Sum of Accumulated tillOctober' },
  { key: 'november', label: 'November', shortName: 'Nov', columnTitle: 'Sum of Accumulated tillNovember', chartTitlePrefix: 'Sum of Accumulated tillNovember' },
  { key: 'december', label: 'December', shortName: 'Dec', columnTitle: 'Sum of Accumulated tillDecember', chartTitlePrefix: 'Sum of Accumulated tillDecember' },
];
