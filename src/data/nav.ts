export type NavLink = { label: string; href: string };

/** Header nav, carried over from the previous ASTHIWAR site. */
export const primaryNav: NavLink[] = [
  { label: 'Projects', href: '/projects' },
  { label: 'Cost', href: '/cost-calculator' },
  { label: 'Services', href: '/services' },
  { label: 'Studio', href: '/studio' },
];

export const serviceNav: NavLink[] = [
  { label: 'Real Estate', href: '/services#real-estate' },
  { label: 'Architecture', href: '/services#architecture' },
  { label: 'Structural', href: '/services#structural' },
  { label: 'Construction', href: '/services#construction' },
  { label: 'Interior', href: '/services#interiors' },
  { label: 'Green Buildings', href: '/services#green-building' },
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
 * Verified studio hubs in Coimbatore and Virudhunagar, Tamil Nadu.
 */
export const contact = {
  address: 'Coimbatore & Virudhunagar, Tamil Nadu',
  phone: 'To be confirmed',
  email: 'To be confirmed',
} as const;

/** Social URLs to be supplied. Empty until then — nothing is rendered. */
export const socials: NavLink[] = [];
