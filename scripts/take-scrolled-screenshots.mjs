import { chromium } from 'playwright';
import path from 'node:path';

const outDir = 'C:\\Users\\sunda\\.gemini\\antigravity\\brain\\39192c3b-81b0-4eb1-8c55-214b6455d8d3';

async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Capture Novascape sections
  console.log('Capturing Novascape...');
  await page.goto('https://novascape.in', { waitUntil: 'networkidle', timeout: 30000 });

  // 1. Hero
  await page.screenshot({ path: path.join(outDir, 'ns-1-hero.png') });

  // 2. What Makes Your Home Breathe (cards)
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('h2')).find(h => h.textContent?.includes('Breathe'));
    el?.scrollIntoView();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'ns-2-cards.png') });

  // 3. Amenities
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('h2')).find(h => h.textContent?.includes('Amenities'));
    el?.scrollIntoView();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'ns-3-amenities.png') });

  // 4. Being Here Means Being Near (Fanned cards)
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('h2')).find(h => h.textContent?.includes('Being Near'));
    el?.scrollIntoView();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'ns-4-fanned-cards.png') });

  // Capture Local sections
  console.log('Capturing Localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });

  // 1. Local Hero
  await page.screenshot({ path: path.join(outDir, 'local-1-hero.png') });

  // 2. Local LastingCards
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('h3, h2')).find(h => h.textContent?.includes('Read the site'));
    el?.scrollIntoView();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'local-2-cards.png') });

  // 3. Local Disciplines
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('h3, h2')).find(h => h.textContent?.includes('Architecture'));
    el?.scrollIntoView();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'local-3-disciplines.png') });

  // 4. Local FAQ & Form
  await page.evaluate(() => {
    document.querySelector('form')?.scrollIntoView();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'local-4-form.png') });

  await browser.close();
  console.log('All screenshots saved!');
}

main().catch(console.error);
