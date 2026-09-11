'use client';

import type { ReactNode } from 'react';
import {
  EnvironmentalResponsibilityIcon,
  LongTermWellbeingIcon,
  LowCementIcon,
  NaturalCoolingIcon,
} from '@/components/brand/PrincipleIcons';
import { Marquee } from '@/components/ui/Marquee';
import {
  homePrinciples,
  homePrinciplesLabel,
  type HomePrincipleIcon,
} from '@/data/home';
import styles from './PrinciplesMarquee.module.css';

const principleIcons = {
  cooling: <NaturalCoolingIcon />,
  lowCement: <LowCementIcon />,
  wellbeing: <LongTermWellbeingIcon />,
  environment: <EnvironmentalResponsibilityIcon />,
} satisfies Record<HomePrincipleIcon, ReactNode>;

const marqueeItems = homePrinciples.map((principle) => ({
  label: principle.label,
  lines: principle.lines,
  icon: principleIcons[principle.icon],
}));

/**
 * The four sustainability principles, running as a full-bleed band.
 *
 * In v1 this was welded to the foot of a photographic hero; here it is the
 * first thing under the logo reveal, so it carries the practice's position
 * before the work is shown. The marks travel left to right, which is the
 * direction v1's own label documented.
 */
export function PrinciplesMarquee() {
  return (
    <section className={styles.section}>
      <Marquee
        items={marqueeItems}
        variant="band"
        direction="right"
        aria-label={homePrinciplesLabel}
      />
    </section>
  );
}
