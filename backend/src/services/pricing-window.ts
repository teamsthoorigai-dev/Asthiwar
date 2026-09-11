/**
 * Which price row is the one in force right now.
 *
 * Every price table — `package_prices`, `option_prices`, `addon_prices` — carries
 * an `effective_from` / `effective_to` pair, where a null `effective_to` means
 * "not yet superseded". Superseded rows are kept, not deleted, so an estimate
 * issued last year can still be explained against the rates that produced it.
 *
 * That only holds if every reader agrees on which row is current. The catalogue
 * endpoints and the calculation engine previously spelled this predicate out
 * separately, and the engine's copy was missing: the customer was shown a rate
 * filtered to the active row and charged from whichever row the join happened to
 * return. Both now call this, so the quoted price and the charged price cannot
 * come from different rows.
 */
import { isNull, type Column, type SQL } from '@asthiwar/database';

/**
 * A price row is in force exactly when `effective_to` is null.
 *
 * This deliberately matches the database's own guarantee rather than being more
 * permissive than it. Migration 0010 creates partial unique indexes — on
 * `package_prices(package_id)`, `addon_prices(addon_id, variant_slug,
 * package_tier)` and `option_prices(option_id, coalesce(package_id, 0))` — each
 * `WHERE effective_to IS NULL`. So at most one row per key can satisfy this, and
 * the engine's choice is provably unambiguous.
 *
 * It used to also accept `effective_to > NOW()`, which is a strictly wider
 * condition than the indexes constrain: a row with a future expiry would satisfy
 * it alongside the null row, giving two "current" prices for one key and sending
 * the add-on and option lookups back to picking whichever the query returned
 * first — the exact failure this module exists to prevent. Nothing in the code
 * writes a future expiry (repricing stamps `effective_to` at the moment of the
 * change), so nothing is lost by matching the index.
 *
 * Scheduling a price change ahead of time would need the partial indexes widened
 * to cover the future-dated window first; it is not something to enable here
 * alone.
 */
export function isCurrentPrice(effectiveTo: Column): SQL {
  return isNull(effectiveTo) as unknown as SQL;
}
