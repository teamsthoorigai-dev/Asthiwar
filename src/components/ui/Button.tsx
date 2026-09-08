import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'ghost' | 'white';

type BaseProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
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

function Inner({ children }: { children: ReactNode }) {
  return (
    <>
      <span className={styles.label}>{children}</span>
      <span className={styles.block} aria-hidden="true" />
    </>
  );
}

/**
 * Pill button with Novascape's sliding hover block: a solid colour block rises
 * from translateY(101%) to 0 while the label colour inverts.
 */
export function Button(props: Props) {
  if (isLink(props)) {
    const { children, variant = 'primary', className, href, target, rel } = props;
    return (
      <Link href={href} className={classesFor(variant, className)} target={target} rel={rel}>
        <Inner>{children}</Inner>
      </Link>
    );
  }

  const { children, variant = 'primary', className, ...rest } = props;
  return (
    <button type="button" className={classesFor(variant, className)} {...rest}>
      <Inner>{children}</Inner>
    </button>
  );
}
