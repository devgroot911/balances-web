# Budget Balance Report

Interactive monthly budget balance reporting with Excel, CSV, SharePoint, and Google Sheets synchronization.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

To create a self-contained browser file:
`npm run build:standalone`

## Deploy to Vercel

The hosted app uses the `/api/sync-url` serverless function to fetch SharePoint or Google Sheets files without browser CORS errors. It refreshes the configured workbook every five minutes without requiring VS Code or a local server.

1. Push this repository to GitHub.
2. Import the repository at [vercel.com/new](https://vercel.com/new).
3. Keep the detected Vite settings, or use:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Deploy the project.

The deployed app must use a workbook link that the serverless function can access. Do not put SharePoint passwords or private API tokens in frontend code or environment variables exposed to the browser.

## Automatic Excel Sync

The default source is the configured Google Sheet. The report loads the sheet when opened and refreshes it every five minutes.

For another workbook or sheet, you can override the default with the `excel` query parameter:

`standalone.html?excel=Budget_Balance.xlsx`

The Google Sheet must be shared so the deployed sync function can access it. A locally opened standalone file fetches the sheet directly from the browser, so the sheet must also allow browser access.
