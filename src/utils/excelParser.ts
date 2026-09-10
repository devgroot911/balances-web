import * as XLSX from 'xlsx';
import { BudgetRecord } from '../types';

export function getSpreadsheetDownloadUrl(inputUrl: string): string {
  const url = new URL(inputUrl);

  if (url.hostname.includes('sharepoint.com') || url.hostname === '1drv.ms' || url.hostname.includes('onedrive.live.com')) {
    url.searchParams.set('download', '1');
  }

  if (url.hostname === 'docs.google.com' && url.pathname.includes('/spreadsheets')) {
    if (url.pathname.endsWith('/edit')) {
      url.pathname = url.pathname.slice(0, -'/edit'.length) + '/export';
      url.search = '?format=xlsx';
    } else if (!url.pathname.endsWith('/export')) {
      url.pathname = `${url.pathname.replace(/\/$/, '')}/export`;
      url.search = '?format=xlsx';
    }
  }

  return url.toString();
}

export async function fetchSpreadsheetRows(inputUrl: string): Promise<BudgetRecord[]> {
  const response = await fetch(getSpreadsheetDownloadUrl(inputUrl), { cache: 'no-store' });
  if (!response.ok) throw new Error(`Workbook request failed with status ${response.status}.`);
  return parseExcelData(await response.arrayBuffer());
}

function parseNumber(value: unknown): number {
  const number = typeof value === 'number' ? value : parseFloat(String(value || 0).replace(/,/g, ''));
  return Number.isNaN(number) ? 0 : number;
}

function normalizeMatchValue(value: unknown): string {
  const normalized = String(value ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  return normalized === '0' ? '' : normalized;
}

export function parseExcelData(data: ArrayBuffer | Uint8Array | string): BudgetRecord[] {
  const workbook = XLSX.read(data, { type: typeof data === 'string' ? 'string' : 'array' });
  const sheetName = workbook.SheetNames.includes('Sheet1') ? 'Sheet1' : workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', blankrows: true });
  const budgetWorksheet = workbook.Sheets['Budget'];
  const budgetRawData: any[][] = budgetWorksheet
    ? XLSX.utils.sheet_to_json(budgetWorksheet, { header: 1, defval: '', blankrows: false })
    : [];

  if (rawData.length < 2) {
    throw new Error('Spreadsheet does not contain enough data.');
  }

  const months = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ];

  const records: BudgetRecord[] = [];

  for (let i = 2; i < rawData.length; i++) {
    const r = rawData[i];
    if (!r || r.length === 0) continue;

    const gl = String(r[0] || '').trim();
    const bl = String(r[1] || '').trim();
    const act = String(r[2] || '').trim();
    const desc = String(r[3] || '').trim();

    // Skip trailing blank rows
    if (!gl && !bl && !act && !desc) continue;

    const monthVals: Record<string, number> = {};
    for (let mIdx = 0; mIdx < months.length; mIdx++) {
      const colVal = r[4 + mIdx];
      monthVals[months[mIdx]] = parseNumber(colVal);
    }

    records.push({
      id: `rec-${records.length + 1}`,
      glAccount: gl,
      bl,
      activityCode: act,
      description: desc,
      january: monthVals.january || 0,
      february: monthVals.february || 0,
      march: monthVals.march || 0,
      april: monthVals.april || 0,
      may: monthVals.may || 0,
      june: monthVals.june || 0,
      july: monthVals.july || 0,
      august: monthVals.august || 0,
      september: monthVals.september || 0,
      october: monthVals.october || 0,
      november: monthVals.november || 0,
      december: monthVals.december || 0,
    });
  }

  if (budgetRawData.length > 1) {
    const usedBudgetRows = new Set<number>();
    const budgetRows = budgetRawData.slice(1).map((row, index) => ({
      index,
      description: normalizeMatchValue(row[25]),
      glAccount: normalizeMatchValue(row[7]),
      activityCode: normalizeMatchValue(row[4]),
      allocations: Object.fromEntries(
        months.map((month, monthIndex) => [month, parseNumber(row[10 + monthIndex])]),
      ) as Record<string, number>,
    }));

    for (const record of records) {
      const recordValues = {
        description: normalizeMatchValue(record.description),
        glAccount: normalizeMatchValue(record.glAccount),
        activityCode: normalizeMatchValue(record.activityCode),
      };
      const candidates = budgetRows
        .map((budgetRow) => {
          if (usedBudgetRows.has(budgetRow.index)) return null;
          const sharedFields = [
            ['description', recordValues.description, budgetRow.description],
            ['glAccount', recordValues.glAccount, budgetRow.glAccount],
            ['activityCode', recordValues.activityCode, budgetRow.activityCode],
          ].filter(([, left, right]) => left && right);
          const matches = sharedFields.filter(([, left, right]) => left === right).length;
          return matches >= 2 && matches === sharedFields.length ? { budgetRow, matches } : null;
        })
        .filter((candidate): candidate is { budgetRow: (typeof budgetRows)[number]; matches: number } => candidate !== null)
        .sort((a, b) => b.matches - a.matches);

      const match = candidates[0]?.budgetRow;
      if (!match) continue;
      usedBudgetRows.add(match.index);
      record.budgetAllocations = months.reduce<Record<string, number>>((allocation, month) => {
        allocation[month] = match.allocations[month] || 0;
        return allocation;
      }, {}) as Partial<Record<(typeof months)[number], number>>;
    }
  }

  return records;
}

export function parseCSVData(csvText: string): BudgetRecord[] {
  const workbook = XLSX.read(csvText, { type: 'string' });
  const sheetName = workbook.SheetNames.includes('Sheet1') ? 'Sheet1' : workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', blankrows: true });

  const months = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ];

  const records: BudgetRecord[] = [];

  // Look for header row index
  let startRow = 2;
  if (rawData.length > 0) {
    const r0 = rawData[0].map((c) => String(c).toLowerCase());
    if (r0.some((c) => c.includes('gl') || c.includes('account') || c.includes('bl'))) {
      startRow = 1;
    }
  }

  for (let i = startRow; i < rawData.length; i++) {
    const r = rawData[i];
    if (!r || r.length === 0) continue;
    const gl = String(r[0] || '').trim();
    const bl = String(r[1] || '').trim();
    const act = String(r[2] || '').trim();
    const desc = String(r[3] || '').trim();
    if (!gl && !bl && !act && !desc) continue;

    const monthVals: Record<string, number> = {};
    for (let mIdx = 0; mIdx < months.length; mIdx++) {
      const colVal = r[4 + mIdx];
      monthVals[months[mIdx]] = parseNumber(colVal);
    }

    records.push({
      id: `rec-${records.length + 1}`,
      glAccount: gl,
      bl,
      activityCode: act,
      description: desc,
      january: monthVals.january || 0,
      february: monthVals.february || 0,
      march: monthVals.march || 0,
      april: monthVals.april || 0,
      may: monthVals.may || 0,
      june: monthVals.june || 0,
      july: monthVals.july || 0,
      august: monthVals.august || 0,
      september: monthVals.september || 0,
      october: monthVals.october || 0,
      november: monthVals.november || 0,
      december: monthVals.december || 0,
    });
  }

  return records;
}
