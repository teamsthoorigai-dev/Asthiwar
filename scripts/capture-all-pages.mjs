import pkg from 'file:///C:/Users/sunda/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const { chromium } = pkg;
import path from 'node:path';

const outDir = 'C:\\Users\\sunda\\.gemini\\antigravity\\brain\\39192c3b-81b0-4eb1-8c55-214b6455d8d3';

const pages = [
  { url: 'http://localhost:3000/', name: 'eval-home.png' },
  { url: 'http://localhost:3000/services', name: 'eval-services.png' },
  { url: 'http://localhost:3000/projects', name: 'eval-projects.png' },
  { url: 'http://localhost:3000/projects/project-01', name: 'eval-project-detail.png' },
  { url: 'http://localhost:3000/about', name: 'eval-about.png' },
  { url: 'http://localhost:3000/sustainable-construction', name: 'eval-sustainable.png' },
  { url: 'http://localhost:3000/cost-calculator', name: 'eval-calculator.png' },
  { url: 'http://localhost:3000/contact', name: 'eval-contact.png' },
  { url: 'http://localhost:3000/admin', name: 'eval-admin.png' },
];

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  for (const p of pages) {
    console.log(`Capturing ${p.url}...`);
    const page = await context.newPage();
    try {
      await page.goto(p.url, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(outDir, p.name), fullPage: false });
      console.log(`Saved ${p.name}`);
    } catch (err) {
      console.error(`Failed ${p.url}:`, err.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log('All evaluation pages captured!');
}

main().catch(console.error);
