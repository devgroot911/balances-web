import { parseExcelData } from './excelParser';
import { BudgetRecord } from '../types';

export async function fetchSharePointExcelWithToken(url: string, accessToken: string): Promise<BudgetRecord[]> {
  // Convert SharePoint sharing URL to Graph API shares URL
  const encodedUrl = btoa(url).replace(/=/g, '').replace(/\//g, '_').replace(/\+/g, '-');
  const graphUrl = `https://graph.microsoft.com/v1.0/shares/u!${encodedUrl}/driveItem/content`;

  const response = await fetch(graphUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch file from SharePoint: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return parseExcelData(arrayBuffer);
}
