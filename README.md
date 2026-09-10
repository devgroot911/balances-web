# Budget Balance PowerBI Report

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

The default source is Gayan Rathnayake's SharePoint workbook. Place `standalone.html` and the workbook in the same SharePoint folder, then open the HTML while signed in to SharePoint. The report loads the default workbook when opened and refreshes it every five minutes.

For a workbook stored beside the HTML, you can override the default with the workbook filename:

`standalone.html?excel=Budget_Balance.xlsx`

The workbook must be accessible to the signed-in SharePoint user, and the filename must be URL-encoded if it contains spaces. A locally opened standalone file uses the local sync server instead, so run `npm run dev` first.
