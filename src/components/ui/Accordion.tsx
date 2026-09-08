'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ArrowDown } from 'lucide-react';
import { gsap, REDUCED } from '@/lib/gsap';
import { Button } from './Button';
import styles from './Accordion.module.css';

export type AccordionEntry = {
  q: string;
  a: ReactNode;
};

type Props = {
  items: AccordionEntry[];
  /** Index open on first render. Pass null for all closed. */
  initialOpen?: number | null;
  /** Show only this many items, with a "View more" control for the rest. */
  showMoreAfter?: number;
  moreLabel?: string;
};

function Item({
  entry,
  open,
  onToggle,
  idBase,
}: {
  entry: AccordionEntry;
  open: boolean;
  onToggle: () => void;
  idBase: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    if (REDUCED()) {
      first.current = false;
      panel.style.height = open ? 'auto' : '0px';
      return;
    }

    const target = open ? panel.scrollHeight : 0;

    if (first.current) {
      first.current = false;
      gsap.set(panel, { height: target });
      return;
    }

    const tween = gsap.to(panel, {
      height: target,
      duration: 0.4,
      ease: 'power2.inOut',
      onComplete: () => {
        if (open) gsap.set(panel, { height: 'auto' });
      },
    });

    return () => {
      tween.kill();
    };
  }, [open]);

  return (
    <div className={`${styles.item} ${open ? styles.open : ''}`}>
      <h3>
        <button
          type="button"
          className={styles.trigger}
          aria-expanded={open}
          aria-controls={`${idBase}-panel`}
          id={`${idBase}-trigger`}
          onClick={onToggle}
        >
          <span>{entry.q}</span>
          <ArrowDown className={styles.icon} size={18} aria-hidden="true" />
        </button>
      </h3>

      <div
        className={styles.panel}
        id={`${idBase}-panel`}
        role="region"
        aria-labelledby={`${idBase}-trigger`}
        ref={panelRef}
      >
        <div className={styles.panelInner}>{entry.a}</div>
      </div>
    </div>
  );
}

/**
 * Accordion with a GSAP height transition (0.4s power2.inOut) and an arrow icon
 * that rotates from north-east (closed) to down (open). One panel open at a time,
 * matching the reference. Under reduced motion the panels snap rather than animate.
 */
export function Accordion({
  items,
  initialOpen = 0,
  showMoreAfter,
  moreLabel = 'View more',
}: Props) {
  const [open, setOpen] = useState<number | null>(initialOpen);
  const [expanded, setExpanded] = useState(false);
  const uid = useId();

  const limit = showMoreAfter && !expanded ? showMoreAfter : items.length;
  const visible = items.slice(0, limit);
  const hidden = items.length - visible.length;

  return (
    <div>
      <div className={styles.accordion}>
        {visible.map((entry, i) => (
          <Item
            key={entry.q}
            entry={entry}
            idBase={`${uid}-${i}`}
            open={open === i}
            onToggle={() => setOpen(open === i ? null : i)}
          />
        ))}
      </div>

      {hidden > 0 ? (
        <div className={styles.more}>
          <Button variant="ghost" onClick={() => setExpanded(true)}>
            {moreLabel} ({hidden})
          </Button>
        </div>
      ) : null}
    </div>
  );
}
