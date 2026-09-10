import * as XLSX from 'xlsx';

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

function getDownloadUrl(inputUrl: string): string {
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

function parseNumber(value: unknown): number {
  const number = typeof value === 'number' ? value : parseFloat(String(value || 0).replace(/,/g, ''));
  return Number.isNaN(number) ? 0 : number;
}

function normalizeMatchValue(value: unknown): string {
  const normalized = String(value ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  return normalized === '0' ? '' : normalized;
}

function parseWorkbook(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames.includes('Sheet1') ? 'Sheet1' : workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', blankrows: true });
  const budgetWorksheet = workbook.Sheets['Budget'];
  const budgetRawData: any[][] = budgetWorksheet
    ? XLSX.utils.sheet_to_json(budgetWorksheet, { header: 1, defval: '', blankrows: false })
    : [];

  if (rawData.length < 2) throw new Error('Spreadsheet does not contain enough rows.');

  const rows = [];
  for (let index = 2; index < rawData.length; index += 1) {
    const row = rawData[index];
    if (!row || row.length === 0) continue;

    const glAccount = String(row[0] || '').trim();
    const bl = String(row[1] || '').trim();
    const activityCode = String(row[2] || '').trim();
    const description = String(row[3] || '').trim();
    if (!glAccount && !bl && !activityCode && !description) continue;

    const monthValues: Record<string, number> = {};
    for (let monthIndex = 0; monthIndex < months.length; monthIndex += 1) {
      const value = row[4 + monthIndex];
      monthValues[months[monthIndex]] = parseNumber(value);
    }

    rows.push({
      id: `row-${rows.length + 1}`,
      glAccount,
      bl,
      activityCode,
      description,
      ...monthValues,
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

    for (const row of rows) {
      const recordValues = {
        description: normalizeMatchValue(row.description),
        glAccount: normalizeMatchValue(row.glAccount),
        activityCode: normalizeMatchValue(row.activityCode),
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
      row.budgetAllocations = Object.fromEntries(
        months.map((month) => [month, match.allocations[month] || 0]),
      );
    }
  }

  return rows;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const inputUrl = req.body?.url;
    if (!inputUrl || typeof inputUrl !== 'string') {
      return res.status(400).json({ error: 'URL is required' });
    }

    const response = await fetch(getDownloadUrl(inputUrl.trim()));
    if (!response.ok) {
      throw new Error(`Remote workbook request failed with status ${response.status}.`);
    }

    const rows = parseWorkbook(Buffer.from(await response.arrayBuffer()));
    return res.status(200).json({
      success: true,
      count: rows.length,
      rows,
      sourceUrl: inputUrl.trim(),
      syncedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error syncing URL:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to sync data from the provided URL.',
    });
  }
}
