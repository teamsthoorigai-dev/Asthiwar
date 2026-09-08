'use client';

import type { ReactNode } from 'react';
import { Marquee } from '@/components/ui/Marquee';
import {
  homePrinciples,
  homePrinciplesLabel,
  type HomePrincipleIcon,
} from '@/data/home';
import styles from './PrinciplesMarquee.module.css';

const principleIcons = {
  cooling: (
    <svg viewBox="0 0 20 20" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6.5h10.5a3 3 0 1 0-3-3" />
      <path d="M2 10h15" />
      <path d="M2 13.5h8.5a2.5 2.5 0 1 1-2.5 2.5" />
    </svg>
  ),
  lowCement: (
    <svg viewBox="0 0 20 20" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 5.5h15v9h-15z" />
      <path d="M2.5 10h15M7.5 5.5V10M12.5 10v4.5" />
    </svg>
  ),
  structure: (
    <svg viewBox="0 0 20 20" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 16.5 10 3.5l7 13M5.5 12h9M3 16.5h14" />
    </svg>
  ),
  coordination: (
    <svg viewBox="0 0 20 20" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="4" r="2" />
      <circle cx="4.5" cy="14.5" r="2" />
      <circle cx="15.5" cy="14.5" r="2" />
      <path d="m8.9 5.7-3.3 6.9M11.1 5.7l3.3 6.9M6.5 14.5h7" />
    </svg>
  ),
  cost: (
    <svg viewBox="0 0 20 20" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2.5h12v15H4zM7 6h6M7 9.5h6M7 13h3" />
    </svg>
  ),
} satisfies Record<HomePrincipleIcon, ReactNode>;

const marqueeItems = homePrinciples.map((principle) => ({
  label: principle.label,
  icon: principleIcons[principle.icon],
}));

export function PrinciplesMarquee() {
  return (
    <section className={styles.section} aria-label={homePrinciplesLabel}>
      <Marquee items={marqueeItems} speed={24} />
    </section>
  );
}
