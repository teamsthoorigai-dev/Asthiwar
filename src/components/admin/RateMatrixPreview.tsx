'use client';

import React from 'react';
import {
  anchorOf,
  diffGrids,
  rateAt,
  type MatrixShape,
  type Paise,
  type RateChange,
  type RateGrid,
} from '@/lib/rateMatrix';

/** A rate as the matrix prints it: +₹45, −₹12.5, ₹0. */
export function formatRate(paise: Paise): string {
  if (paise === 0) return '₹0';
  const rupees = Math.abs(paise) / 100;
  return `${paise < 0 ? '−' : '+'}₹${rupees.toLocaleString('en-IN')}`;
}

/** Rate changes within one package, brand by brand — small enough for a confirmation. */
export function RateChangeList({
  changes,
  brands,
}: {
  changes: RateChange[];
  brands: Array<{ id: number; name: string }>;
}) {
  return (
    <ul className="rounded border border-border divide-y divide-border/60 text-[11px]">
      {changes.map((change) => (
        <li key={`${change.optionId}:${change.packageId}`} className="flex items-center justify-between gap-3 px-2 py-1">
          <span className="truncate">{brands.find((b) => b.id === change.optionId)?.name ?? `#${change.optionId}`}</span>
          <span className="font-mono whitespace-nowrap">
            <span className="text-muted line-through">{formatRate(change.from)}</span>
            {' → '}
            <strong>{formatRate(change.to)}</strong>
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * The matrix as it will be after a save, with every cell that moves marked.
 *
 * A linked edit reaches well past the cells the operator typed in — one brand's
 * row can move a whole column — so the dialogs show the result before anything
 * is written rather than leaving the operator to find it in the matrix after.
 */
export function RateMatrixPreview({
  shape,
  before,
  after,
  brands,
  packages,
}: {
  shape: MatrixShape;
  before: RateGrid;
  after: RateGrid;
  brands: Array<{ id: number; name: string }>;
  packages: Array<{ id: number; name: string }>;
}) {
  const changes = diffGrids(shape, before, after);
  const changedBrands = new Set(changes.map((change) => change.optionId)).size;
  const changed = new Set(changes.map((change) => `${change.optionId}:${change.packageId}`));

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold">
        {changes.length === 0
          ? 'No rates change.'
          : `${changes.length} rate${changes.length === 1 ? '' : 's'} change across ${changedBrands} brand${
              changedBrands === 1 ? '' : 's'
            }.`}
      </p>
      {/* overflow-auto, not overflow-x-auto: admin.css gives a table inside the
          latter a 640px floor, wider than the dialogs this renders in. */}
      <div className="overflow-auto rounded border border-border">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-surface-1 border-b border-border">
              <th className="text-left py-1.5 px-2 font-bold text-muted">Brand</th>
              {/* Names wrap rather than widen the table: every package has to fit
                  in view, since the cells a linked edit moves are often the ones
                  furthest from where the operator typed. */}
              {packages.map((pkg) => (
                <th key={pkg.id} className="py-1.5 px-2 font-bold text-muted text-center leading-tight">
                  {pkg.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {brands.map((brand) => (
              <tr key={brand.id}>
                <td className="py-1.5 px-2 font-semibold leading-tight min-w-[110px]">{brand.name}</td>
                {packages.map((pkg) => {
                  const to = rateAt(after, brand.id, pkg.id);
                  const from = rateAt(before, brand.id, pkg.id);
                  const isChanged = changed.has(`${brand.id}:${pkg.id}`);
                  const isIncluded = anchorOf(shape, pkg.id) === brand.id;
                  return (
                    <td
                      key={pkg.id}
                      className={`py-1.5 px-2 text-center font-mono whitespace-nowrap ${
                        isChanged ? 'bg-amber-500/15 text-amber-900 dark:text-amber-200 font-bold' : ''
                      }`}
                      title={isChanged ? `Was ${formatRate(from)}` : undefined}
                    >
                      {isIncluded ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-sans font-bold">Incl.</span>
                      ) : (
                        formatRate(to)
                      )}
                      {isChanged && (
                        <span className="block text-[9px] font-normal text-muted line-through">
                          {formatRate(from)}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
