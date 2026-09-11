'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { SmoothScroll } from './SmoothScroll';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { ArchitecturalCursor } from '@/components/ui/ArchitecturalCursor';
import { ScrollbarWidth } from './ScrollbarWidth';

/**
 * The marketing chrome — header, footer, architectural cursor, and Lenis smooth scroll.
 *
 * /admin is a tool, not a page: it gets none of these. Doing this here rather
 * than with route groups keeps every existing route path untouched.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') ?? false;

  if (isAdmin) {
    return (
      <>
        <ScrollbarWidth />
        <main id="main-content">{children}</main>
      </>
    );
  }

  return (
    <SmoothScroll>
      <ScrollbarWidth />
      <ArchitecturalCursor />
      <SiteHeader />
      <main id="main-content">{children}</main>
      <SiteFooter />
    </SmoothScroll>
  );
}
