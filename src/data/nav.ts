export type NavLink = { label: string; href: string };

/** Header nav, carried over from the previous ASTHIWAR site. */
export const primaryNav: NavLink[] = [
  { label: 'Projects', href: '/projects' },
  { label: 'Cost', href: '/cost-calculator' },
  { label: 'Services', href: '/services' },
  { label: 'Studio', href: '/about' },
];

export const serviceNav: NavLink[] = [
  { label: 'Architecture', href: '/services#architecture' },
  { label: 'Interior', href: '/services#interiors' },
  { label: 'Construction', href: '/services#construction' },
  { label: 'Structural', href: '/services#structural' },
  { label: 'Green Building', href: '/services#green-building' },
];

export const footerNav: NavLink[] = [
  ...primaryNav,
  { label: 'Sustainable', href: '/sustainable-construction' },
  { label: 'Contact', href: '/contact' },
];

export const legalNav: NavLink[] = [
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
];

/**
 * Contact details are unconfirmed in the source repo. Rendered as-is rather than
 * invented — see docs/01-MASTER-PLAN.md section 9.
 */
export const contact = {
  address: 'To be confirmed',
  phone: 'To be confirmed',
  email: 'To be confirmed',
} as const;

/** Social URLs to be supplied. Empty until then — nothing is rendered. */
export const socials: NavLink[] = [];
