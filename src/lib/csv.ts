/**
 * CSV export for the admin console's list views.
 *
 * Neither the leads list nor the estimates list could leave the browser, so
 * anything a sales meeting or an accountant wanted had to be retyped from the
 * screen. Built client-side from the rows already fetched: no new endpoint, and
 * whatever filter and sort the operator is looking at is what they get.
 */

/**
 * One CSV field, escaped.
 *
 * Quoting is not optional here: customer names carry commas, requirement notes
 * carry newlines, and either one silently shifts every later column of that row
 * into the wrong field.
 *
 * The leading apostrophe on a value starting with `=`, `+`, `-` or `@` is
 * deliberate. Spreadsheets treat those as the start of a formula, so a text
 * field a stranger submitted through the public enquiry form would be *executed*
 * on open — a real attack against whoever opens the export, not a formatting
 * nicety. Phone numbers beginning `+91` are the common benign case.
 */
function escapeField(value: unknown): string {
  if (value === null || value === undefined) return '';

  let text = String(value);

  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => unknown;
}

export function toCsv<T>(rows: readonly T[], columns: ReadonlyArray<CsvColumn<T>>): string {
  const lines = [columns.map((column) => escapeField(column.header)).join(',')];

  for (const row of rows) {
    lines.push(columns.map((column) => escapeField(column.value(row))).join(','));
  }

  // CRLF per RFC 4180 — Excel on Windows is the overwhelmingly common consumer.
  return lines.join('\r\n');
}

/**
 * Hand the file to the browser.
 *
 * The BOM is what makes Excel read the file as UTF-8; without it, a rupee sign
 * or a Tamil name in a customer record opens as mojibake.
 */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/** `leads-2026-09-11.csv` — sortable, and obvious when several are downloaded. */
export function timestampedFilename(prefix: string): string {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
  return `${prefix}-${stamp}.csv`;
}
