import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDirectory = path.join(projectRoot, 'dist');
const indexPath = path.join(distDirectory, 'index.html');
const standalonePath = path.join(projectRoot, 'standalone.html');

let html = await fs.readFile(indexPath, 'utf8');
const assetPattern = /<(link|script)\b[^>]+(?:href|src)="([^"]+)"[^>]*>\s*<\/script>|<(link)\b[^>]+href="([^"]+)"[^>]*\/?>(?!<\/link>)/g;

const references = [];
for (const match of html.matchAll(assetPattern)) {
  const assetReference = match[2] || match[4];
  if (assetReference?.startsWith('/')) references.push({ match: match[0], assetReference });
}

for (const { match, assetReference } of references) {
  const assetPath = path.join(distDirectory, assetReference.slice(1));
  const assetContents = await fs.readFile(assetPath);
  if (match.startsWith('<script')) {
    const scriptContents = assetContents.toString('base64');
    html = html.replace(
      match,
      `<script>addEventListener('DOMContentLoaded',()=>{const bytes=Uint8Array.from(atob('${scriptContents}'),character=>character.charCodeAt(0));eval(new TextDecoder().decode(bytes))})</script>`,
    );
  } else if (match.startsWith('<link')) {
    html = html.replace(match, `<style>${assetContents.toString('utf8')}</style>`);
  }
}

const sampleWorkbookPath = path.join(projectRoot, 'public', 'sample_data.xlsx');
const sampleWorkbook = await fs.readFile(sampleWorkbookPath);
const sampleWorkbookDataUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${sampleWorkbook.toString('base64')}`;
html = html.replaceAll('/sample_data.xlsx', sampleWorkbookDataUrl);
html = html.replace(/<script type="module"[^>]*><\/script>/g, '');
await fs.writeFile(standalonePath, html, 'utf8');
console.log(`Created ${path.relative(projectRoot, standalonePath)}`);