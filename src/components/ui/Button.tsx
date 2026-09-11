import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'ghost' | 'white';

type BaseProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  /** Whether to render the trailing ↗ arrow icon. Defaults to true. */
  arrow?: boolean;
};

type ButtonProps = BaseProps & {
  href?: never;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>;

type LinkProps = BaseProps & {
  href: string;
  /** Passed through to next/link for external or new-tab destinations. */
  target?: string;
  rel?: string;
};

type Props = ButtonProps | LinkProps;

function isLink(props: Props): props is LinkProps {
  return typeof (props as LinkProps).href === 'string';
}

function classesFor(variant: ButtonVariant, className?: string) {
  return [styles.button, styles[variant], className].filter(Boolean).join(' ');
}

function Inner({ children, arrow = true }: { children: ReactNode; arrow?: boolean }) {
  return (
    <>
      <span className={styles.label}>
        <span>{children}</span>
        {arrow ? <ArrowUpRight size={14} strokeWidth={2} className={styles.arrow} aria-hidden="true" /> : null}
      </span>
      <span className={styles.block} aria-hidden="true" />
    </>
  );
}

/**
 * Pill button with reference styling (outline, uppercase tracked type,
 * trailing arrow icon) and a smooth fade hover block: a solid colour block
 * fades in from opacity 0 to 1 while the label colour inverts.
 */
export function Button(props: Props) {
  if (isLink(props)) {
    const { children, variant = 'primary', className, href, target, rel, arrow = true } = props;
    return (
      <Link href={href} className={classesFor(variant, className)} target={target} rel={rel}>
        <Inner arrow={arrow}>{children}</Inner>
      </Link>
    );
  }

  const { children, variant = 'primary', className, arrow = true, ...rest } = props;
  return (
    <button type="button" className={classesFor(variant, className)} {...rest}>
      <Inner arrow={arrow}>{children}</Inner>
    </button>
  );
}
