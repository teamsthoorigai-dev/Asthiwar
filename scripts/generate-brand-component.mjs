/**
 * Generates src/components/brand/AsthiwarWordmark.tsx from
 * public/brand/asthiwar-wordmark.svg.
 *
 * The wordmark is inlined rather than loaded as an <img> because the logo
 * reveal has to address its three groups (ASTH / building mark / WAR) from
 * GSAP, and because the same file then serves the header at 28px without a
 * second network request.
 *
 * The mark geometry that the reveal needs — where the building sits inside the
 * wordmark — is measured here from the real path data and emitted alongside the
 * markup, so re-tracing the logo can never leave the animation pointing at the
 * wrong slice of the viewBox.
 *
 * Run: node scripts/generate-brand-component.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const SOURCE = 'public/brand/asthiwar-wordmark.svg';
const TARGET = 'src/components/brand/AsthiwarWordmark.tsx';

const svg = readFileSync(SOURCE, 'utf8');

const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1];
if (!viewBox) throw new Error(`No viewBox in ${SOURCE}`);
const [, , vbWidth, vbHeight] = viewBox.split(/\s+/).map(Number);

/* ---- geometry ---------------------------------------------------------- */

/** Tokenises path data into [command, ...numbers] steps. */
function parsePath(d) {
  const steps = [];
  const re = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
  let match;
  while ((match = re.exec(d)) !== null) {
    const nums = (match[2].match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []).map(Number);
    steps.push([match[1], nums]);
  }
  return steps;
}

/**
 * Bounding box of a path. Curves are bounded by their control-point hull, which
 * can only overestimate — safe for deciding where to open a reveal mask.
 */
function pathBounds(d) {
  const box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;

  const hit = (px, py) => {
    if (px < box.minX) box.minX = px;
    if (py < box.minY) box.minY = py;
    if (px > box.maxX) box.maxX = px;
    if (py > box.maxY) box.maxY = py;
  };

  for (const [command, nums] of parsePath(d)) {
    const relative = command === command.toLowerCase();
    const type = command.toUpperCase();

    if (type === 'Z') {
      x = startX;
      y = startY;
      continue;
    }

    const stride = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2 }[type];
    if (!stride) throw new Error(`Unsupported path command "${command}" in ${SOURCE}`);

    for (let i = 0; i + stride <= nums.length; i += stride) {
      const chunk = nums.slice(i, i + stride);

      if (type === 'H') {
        x = relative ? x + chunk[0] : chunk[0];
      } else if (type === 'V') {
        y = relative ? y + chunk[0] : chunk[0];
      } else {
        for (let p = 0; p + 1 < chunk.length; p += 2) {
          const px = relative ? x + chunk[p] : chunk[p];
          const py = relative ? y + chunk[p + 1] : chunk[p + 1];
          hit(px, py);
        }
        x = relative ? x + chunk[chunk.length - 2] : chunk[chunk.length - 2];
        y = relative ? y + chunk[chunk.length - 1] : chunk[chunk.length - 1];
      }

      hit(x, y);

      // Only the first pair of an M run is a move; the rest are implicit L.
      if (type === 'M' && i === 0) {
        startX = x;
        startY = y;
      }
    }
  }

  return box;
}

/** `translate(tx,ty) scale(sx,sy)` — the only transform the trace emits. */
function parseTransform(transform) {
  const translate = transform.match(/translate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)\s*\)/);
  const scale = transform.match(/scale\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)\s*\)/);
  if (!translate || !scale) throw new Error(`Unexpected transform "${transform}"`);
  return {
    tx: Number(translate[1]),
    ty: Number(translate[2]),
    sx: Number(scale[1]),
    sy: Number(scale[2]),
  };
}

const outerTransform = parseTransform(svg.match(/<g fill="currentColor" transform="([^"]+)"/)[1]);

const markGroup = svg.match(/<g id="asthiwar-building-mark">([\s\S]*?)<\/g>/)[1];
const markPaths = [...markGroup.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]);
if (markPaths.length === 0) throw new Error('No paths found in the building mark group');

const markBox = markPaths
  .map(pathBounds)
  .reduce((acc, box) => ({
    minX: Math.min(acc.minX, box.minX),
    minY: Math.min(acc.minY, box.minY),
    maxX: Math.max(acc.maxX, box.maxX),
    maxY: Math.max(acc.maxY, box.maxY),
  }));

// Into viewBox units. A negative y scale flips min and max.
const toX = (v) => outerTransform.tx + v * outerTransform.sx;
const toY = (v) => outerTransform.ty + v * outerTransform.sy;
const markLeft = toX(markBox.minX);
const markRight = toX(markBox.maxX);
const markTop = Math.min(toY(markBox.minY), toY(markBox.maxY));
const markBottom = Math.max(toY(markBox.minY), toY(markBox.maxY));

const pct = (v) => Number(((v / vbWidth) * 100).toFixed(4));
const MARK = {
  leftPct: pct(markLeft),
  rightPct: pct(markRight),
  centerPct: pct((markLeft + markRight) / 2),
  /** Mark height as a fraction of the rendered wordmark height. */
  heightRatio: Number(((markBottom - markTop) / vbHeight).toFixed(4)),
};

/* ---- markup ------------------------------------------------------------ */

// Ids are dropped: the wordmark renders twice on the homepage (header and
// hero), and duplicate ids would break both aria references and the reveal's
// own selectors. Groups are addressed by data-part instead.
const body = svg
  .replace(/^[\s\S]*?<g fill="currentColor"/, '<g fill="currentColor"')
  .replace(/<\/svg>\s*$/, '')
  .replace(/ id="asthiwar-left-letters"/, ' data-part="left"')
  .replace(/ id="asthiwar-building-mark"/, ' data-part="mark"')
  .replace(/ id="asthiwar-right-letters"/, ' data-part="right"')
  .trimEnd()
  .split('\n')
  .map((line) => (line.trim() ? `      ${line.replace(/^ {2}/, '')}` : ''))
  .join('\n');

const file = `/**
 * GENERATED FILE — do not edit.
 * Source: ${SOURCE}
 * Regenerate: node scripts/generate-brand-component.mjs
 */
import type { SVGProps } from 'react';

/** Where the building mark sits inside the wordmark, in percentages of its box. */
export const WORDMARK_GEOMETRY = {
  viewBox: '${viewBox}',
  /** Wordmark height as a fraction of its width — the intrinsic aspect ratio. */
  aspect: ${Number((vbHeight / vbWidth).toFixed(6))},
  markLeftPct: ${MARK.leftPct},
  markRightPct: ${MARK.rightPct},
  markCenterPct: ${MARK.centerPct},
  markHeightRatio: ${MARK.heightRatio},
} as const;

/**
 * The ASTHIWAR wordmark, traced from the supplied logo and split into
 * ASTH / building mark / WAR so the homepage reveal can address each group.
 *
 * Decorative by default: it carries no title and no ids, so the caller owns the
 * accessible name (a heading, or aria-label on the link that wraps it).
 */
export function AsthiwarWordmark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="${viewBox}"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
${body}
    </svg>
  );
}
`;

mkdirSync(dirname(TARGET), { recursive: true });
writeFileSync(TARGET, file);

console.log(`Wrote ${TARGET}`);
console.log(`  viewBox        ${viewBox}`);
console.log(`  mark x         ${markLeft.toFixed(2)} → ${markRight.toFixed(2)} (${MARK.leftPct}% → ${MARK.rightPct}%)`);
console.log(`  mark centre    ${MARK.centerPct}%`);
console.log(`  mark y         ${markTop.toFixed(2)} → ${markBottom.toFixed(2)} (ratio ${MARK.heightRatio})`);
