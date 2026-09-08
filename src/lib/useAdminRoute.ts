'use client';

import { useMemo, useSyncExternalStore } from 'react';

/**
 * The admin console is a single client route, so its position lived only in
 * component state: every refresh threw the operator back to the dashboard,
 * whatever they had open. This keeps that position in the URL hash instead —
 * `#pricing/specifications` — so a refresh, a bookmark and the back button all
 * land where they left off.
 *
 * The hash is used rather than a query string deliberately: it needs no router
 * plumbing and no Suspense boundary around `useSearchParams`, and it never
 * reaches the server, which matters for an authenticated console.
 *
 * The URL is treated as the single source of truth and subscribed to as an
 * external store, so views derive their position during render instead of
 * mirroring it into state and resyncing through effects.
 */

export interface AdminRoute {
  /** First hash segment — the sidebar tab. Empty when there is no hash. */
  tab: string;
  /** Second hash segment — a tab's own sub-section, when it has one. */
  section: string | null;
}

export function parseAdminHash(hash: string): AdminRoute {
  const [tab = '', section = ''] = hash.replace(/^#/, '').split('/');
  return { tab, section: section || null };
}

export function formatAdminHash(tab: string, section?: string | null): string {
  return section ? `#${tab}/${section}` : `#${tab}`;
}

/**
 * `history.pushState` / `replaceState` fire no event, so writes are announced
 * here. Without this, navigating by clicking would update the address bar and
 * leave every subscriber rendering the previous position.
 */
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  // hashchange covers hand-edited URLs; popstate covers back/forward.
  window.addEventListener('hashchange', onStoreChange);
  window.addEventListener('popstate', onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener('hashchange', onStoreChange);
    window.removeEventListener('popstate', onStoreChange);
  };
}

function getSnapshot(): string {
  return window.location.hash;
}

/** No hash during SSR; the real one arrives on hydration. */
function getServerSnapshot(): string {
  return '';
}

/**
 * Write the console's position into the address bar.
 *
 * Sidebar tabs `push`, so back steps between them the way it would between
 * pages. Sub-sections `replace`, because filter-level moves are frequent and
 * filling the history with them would trap the operator behind the back button.
 */
export function writeAdminHash(
  tab: string,
  section: string | null,
  mode: 'push' | 'replace'
): void {
  if (typeof window === 'undefined') return;
  const next = formatAdminHash(tab, section);
  if (window.location.hash === next) return;
  const url = `${window.location.pathname}${window.location.search}${next}`;
  if (mode === 'push') {
    window.history.pushState(null, '', url);
  } else {
    window.history.replaceState(null, '', url);
  }
  listeners.forEach((notify) => notify());
}

/** The console's current position, kept in sync with the address bar. */
export function useAdminRoute(): AdminRoute {
  const hash = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => parseAdminHash(hash), [hash]);
}
