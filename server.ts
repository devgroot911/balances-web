import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import * as XLSX from 'xlsx';

const app = express();
const PORT = 3000;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to parse XLSX buffer into report rows
export function parseWorkbookBuffer(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames.includes('Sheet1') ? 'Sheet1' : workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', blankrows: true });

  if (rawData.length < 2) {
    throw new Error('Spreadsheet does not contain enough rows.');
  }

  // Row 0 has G/L Account, BL, Activity Code, Description, January, Accumulated till...
  // Row 1 has February, March, April, May, June, July, August, September, October, November, December
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

  const rows = [];
  for (let i = 2; i < rawData.length; i++) {
    const r = rawData[i];
    if (!r || r.length === 0) continue;
    const gl = String(r[0] || '').trim();
    const bl = String(r[1] || '').trim();
    const act = String(r[2] || '').trim();
    const desc = String(r[3] || '').trim();

    // Skip entirely empty row
    if (!gl && !bl && !act && !desc) continue;

    const monthVals: Record<string, number> = {};
    for (let mIdx = 0; mIdx < months.length; mIdx++) {
      const colVal = r[4 + mIdx];
      const num = typeof colVal === 'number' ? colVal : parseFloat(String(colVal || 0).replace(/,/g, ''));
      monthVals[months[mIdx]] = isNaN(num) ? 0 : num;
    }

    rows.push({
      id: `row-${rows.length + 1}`,
      glAccount: gl,
      bl,
      activityCode: act,
      description: desc,
      ...monthVals,
    });
  }

  return rows;
}

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API: Get initial sample data
app.get('/api/sample-data', (req, res) => {
  try {
    const sampleFilePath = path.join(process.cwd(), 'public', 'sample_data.xlsx');
    if (fs.existsSync(sampleFilePath)) {
      const buffer = fs.readFileSync(sampleFilePath);
      const rows = parseWorkbookBuffer(buffer);
      return res.json({ success: true, count: rows.length, rows });
    }
    return res.status(404).json({ error: 'Sample file not found on server.' });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Error reading sample data' });
  }
});

// Helper to download remote file supporting cookies across redirects (essential for SharePoint / OneDrive)
async function downloadRemoteFile(targetUrl: string): Promise<Buffer> {
  const { execFile } = await import('child_process');
  const tempDirectory = os.tmpdir();
  const tmpCookie = path.join(tempDirectory, `cookie_${Date.now()}_${Math.random().toString(36).substring(7)}.txt`);
  const tmpOut = path.join(tempDirectory, `dl_${Date.now()}_${Math.random().toString(36).substring(7)}.tmp`);

  return new Promise<Buffer>((resolve, reject) => {
    execFile(
      'curl',
      [
        '-fsL',
        '-c',
        tmpCookie,
        '-b',
        tmpCookie,
        '-A',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        targetUrl,
        '-o',
        tmpOut,
      ],
      { maxBuffer: 50 * 1024 * 1024 },
      (err) => {
        try {
          if (fs.existsSync(tmpCookie)) fs.unlinkSync(tmpCookie);
        } catch {}

        if (err) {
          try {
            if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
          } catch {}
          return reject(err);
        }

        try {
          if (fs.existsSync(tmpOut)) {
            const buf = fs.readFileSync(tmpOut);
            fs.unlinkSync(tmpOut);
            if (buf.length === 0) {
              return reject(new Error('Downloaded file is empty.'));
            }
            return resolve(buf);
          }
          return reject(new Error('Downloaded file not found.'));
        } catch (readErr) {
          return reject(readErr);
        }
      }
    );
  });
}

// API: Sync Excel / Google Sheet by URL
app.post('/api/sync-url', async (req, res) => {
  try {
    let { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required' });
    }

    url = url.trim();

    // Format SharePoint / OneDrive link for direct download
    if (url.includes('sharepoint.com') || url.includes('1drv.ms') || url.includes('onedrive.live.com')) {
      try {
        const u = new URL(url);
        u.searchParams.set('download', '1');
        url = u.toString();
      } catch {
        url = `${url}${url.includes('?') ? '&' : '?'}download=1`;
      }
    }

    // Format Google Sheets URL for CSV or XLSX export
    if (url.includes('docs.google.com/spreadsheets')) {
      if (url.includes('/edit')) {
        url = url.replace(/\/edit.*$/, '/export?format=xlsx');
      } else if (!url.includes('/export')) {
        url = `${url}/export?format=xlsx`;
      }
    }

    // Download using cookie-aware curl
    const buffer = await downloadRemoteFile(url);

    // Parse workbook
    const rows = parseWorkbookBuffer(buffer);

    return res.json({
      success: true,
      count: rows.length,
      rows,
      sourceUrl: url,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error syncing URL:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to sync data from the provided URL.',
    });
  }
});

// Serve frontend in development or production
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

setupServer();
