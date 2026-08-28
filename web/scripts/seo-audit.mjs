import fs from 'node:fs';
import path from 'node:path';

const appDir = path.resolve('web/.next/server/app');

function getHtmlFiles(dir) {
  let files = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      files = files.concat(getHtmlFiles(full));
    } else if (item.name.endsWith('.html') && !item.name.startsWith('_global-error')) {
      files.push(full);
    }
  }
  return files;
}

const htmlFiles = getHtmlFiles(appDir);
console.log(`Found ${htmlFiles.length} generated public static HTML pages.\n`);

let passed = 0;
let failed = 0;

for (const file of htmlFiles) {
  const rel = path.relative(appDir, file);
  const content = fs.readFileSync(file, 'utf8');

  const checks = {
    hasTitle: /<title>/.test(content),
    hasMetaDesc: /<meta name="description" content="[^"]+"/.test(content),
    hasOgTitle: /<meta property="og:title" content="[^"]+"/.test(content),
    hasOgDescription: /<meta property="og:description" content="[^"]+"/.test(content),
    hasCanonical: /<link rel="canonical" href="[^"]+"/.test(content),
    hasLang: /<html lang="en"/.test(content),
    hasJsonLd: /<script type="application\/ld\+json">/.test(content),
    hasSkipLink: /href="#main-content"/.test(content),
  };

  const filePassed = Object.values(checks).every(Boolean);
  if (filePassed) {
    passed += 1;
    console.log(`✅ ${rel} — All 8 SEO & Accessibility checks passed.`);
  } else {
    failed += 1;
    console.log(`❌ ${rel} — Failed checks:`, checks);
  }
}

console.log(`\nAudit Summary: ${passed} passed, ${failed} failed out of ${htmlFiles.length} public pages.`);
if (failed > 0) process.exit(1);
