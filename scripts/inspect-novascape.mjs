import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const outDir = 'C:\\Users\\sunda\\.gemini\\antigravity\\brain\\39192c3b-81b0-4eb1-8c55-214b6455d8d3';

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log('Visiting https://novascape.in ...');
  try {
    await page.goto('https://novascape.in', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('Loaded Novascape');

    // Screenshot 1: Novascape Hero
    await page.screenshot({ path: path.join(outDir, 'novascape-hero.png') });
    console.log('Captured novascape-hero.png');

    // Scroll down to middle
    await page.evaluate(() => window.scrollTo(0, 1800));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'novascape-mid1.png') });

    await page.evaluate(() => window.scrollTo(0, 3600));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'novascape-mid2.png') });

    await page.evaluate(() => window.scrollTo(0, 5400));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'novascape-mid3.png') });
  } catch (err) {
    console.error('Error on Novascape:', err);
  }

  console.log('Visiting http://localhost:3000 ...');
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('Loaded Localhost');

    // Screenshot 1: Localhost Hero
    await page.screenshot({ path: path.join(outDir, 'local-hero.png') });
    console.log('Captured local-hero.png');

    await page.evaluate(() => window.scrollTo(0, 1800));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'local-mid1.png') });

    await page.evaluate(() => window.scrollTo(0, 3600));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'local-mid2.png') });
  } catch (err) {
    console.error('Error on Localhost:', err);
  }

  await browser.close();
  console.log('Finished capturing screenshots');
}

main().catch(console.error);
