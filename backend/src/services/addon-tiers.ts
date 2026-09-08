/**
 * Which package tiers an add-on price row applies to.
 *
 * `addon_prices.package_tier` is a single text column holding one of:
 *   - 'all'                      — every package
 *   - a CSV of package slugs     — e.g. 'basic,premium'
 *   - a legacy group name        — 'basic_standard' / 'premium_luxury'
 *
 * The legacy names are what the original seed wrote, and rows still carry them.
 * Everything reads through the helpers below so the three encodings stay
 * interchangeable and no caller has to know which one a given row uses.
 *
 * The admin UI has a parallel parser in src/lib/api/admin.ts — keep the two in
 * step if the encoding ever changes.
 */

export const ADDON_TIER_ALL = 'all';

const LEGACY_TIER_GROUPS: Record<string, readonly string[]> = {
  basic_standard: ['basic', 'standard'],
  premium_luxury: ['premium', 'luxury'],
};

/** Package slugs a stored tier value covers. `'all'` needs the full roster. */
export function expandPackageTier(packageTier: string, allPackageSlugs: readonly string[]): string[] {
  const raw = (packageTier ?? '').trim();
  if (!raw || raw === ADDON_TIER_ALL) return [...allPackageSlugs];

  const legacy = LEGACY_TIER_GROUPS[raw];
  if (legacy) return [...legacy];

  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Does this price row apply to the given package? */
export function packageTierApplies(packageTier: string, packageSlug: string): boolean {
  const raw = (packageTier ?? '').trim();
  if (!raw || raw === ADDON_TIER_ALL) return true;

  const legacy = LEGACY_TIER_GROUPS[raw];
  if (legacy) return legacy.includes(packageSlug);

  return raw
    .split(',')
    .map((s) => s.trim())
    .includes(packageSlug);
}

/**
 * How narrowly a row is scoped — lower is more specific. Used to break ties when
 * two rows share a variant slug: the narrower one wins over a blanket 'all'.
 */
export function packageTierSpecificity(packageTier: string): number {
  const raw = (packageTier ?? '').trim();
  if (!raw || raw === ADDON_TIER_ALL) return Number.MAX_SAFE_INTEGER;

  const legacy = LEGACY_TIER_GROUPS[raw];
  if (legacy) return legacy.length;

  return raw.split(',').map((s) => s.trim()).filter(Boolean).length;
}

/**
 * Collapse a set of chosen package slugs into the stored form. A selection that
 * covers every package is written as 'all', so a later package added to the
 * catalogue is included rather than silently excluded by a stale CSV.
 */
export function serializePackageTiers(
  slugs: readonly string[],
  allPackageSlugs: readonly string[]
): string {
  const unique = Array.from(new Set(slugs.map((s) => s.trim()).filter(Boolean)));
  if (unique.length === 0) return ADDON_TIER_ALL;

  const coversEverything =
    allPackageSlugs.length > 0 && allPackageSlugs.every((slug) => unique.includes(slug));

  // Preserve catalogue order rather than the order the operator ticked boxes.
  return coversEverything
    ? ADDON_TIER_ALL
    : allPackageSlugs.filter((slug) => unique.includes(slug)).join(',');
}
