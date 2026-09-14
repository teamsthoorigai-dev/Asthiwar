/**
 * Display formatting for money the backend has already priced.
 *
 * Rule #5: nothing here computes a figure, it only renders one.
 */

/**
 * A running difference, written so the sign is the first thing read.
 *
 * The customisation and add-on steps show the customer what their choices
 * change rather than what the project costs, so ₹0 is a real state on both —
 * "nothing changed yet" — and it prints without a sign rather than as "+₹0".
 *
 * The minus is U+2212, not a hyphen: at the weight these figures are set in, a
 * hyphen reads as a dash between words.
 */
export function formatSignedINR(amount: number): string {
  if (!amount) return '₹0';
  const sign = amount > 0 ? '+' : '−';
  return `${sign}₹${Math.abs(amount).toLocaleString('en-IN')}`;
}

/** Which way a difference moved, for styling hooks. */
export function deltaDirection(amount: number): 'up' | 'down' | 'flat' {
  if (amount > 0) return 'up';
  if (amount < 0) return 'down';
  return 'flat';
}
