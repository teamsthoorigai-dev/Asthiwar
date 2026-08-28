'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

const primaryNav = [
  { label: 'Projects', href: '/projects' },
  { label: 'Cost', href: '/cost-calculator' },
  { label: 'Services', href: '/services' },
  { label: 'Studio', href: '/about' },
  { label: 'Journey', href: '/journey' },
] as const;

function isCurrent(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BrandMark({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className={`brand-mark${inverted ? ' brand-mark--inverted' : ''}`}>
      <span className="brand-mark__monogram" aria-hidden="true">
        <span>A</span>
      </span>
      <span className="brand-mark__word">ASTHIWAR</span>
    </span>
  );
}

export function SiteHeader() {
  const pathname = usePathname() || '/';
  const dialogRef = useRef<HTMLDialogElement>(null);

  const closeMenu = () => dialogRef.current?.close();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => document.documentElement.classList.remove('menu-open');
    dialog.addEventListener('close', onClose);
    return () => dialog.removeEventListener('close', onClose);
  }, []);

  const openMenu = () => {
    document.documentElement.classList.add('menu-open');
    dialogRef.current?.showModal();
  };

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-header__brand" aria-label="ASTHIWAR home">
          <BrandMark inverted />
        </Link>

        <nav className="site-header__nav" aria-label="Primary navigation">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="site-header__link"
              data-current={isCurrent(pathname, item.href) || undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link href="/contact" className="button button--header">
          Book consultation
          <ArrowUpRight size={15} aria-hidden="true" />
        </Link>

        <button
          type="button"
          className="site-header__menu-button"
          onClick={openMenu}
          aria-label="Open navigation"
        >
          <Menu size={22} aria-hidden="true" />
        </button>
      </div>

      <dialog ref={dialogRef} className="mobile-menu" aria-label="Site navigation">
        <div className="mobile-menu__top">
          <Link href="/" onClick={closeMenu} aria-label="ASTHIWAR home">
            <BrandMark inverted />
          </Link>
          <button
            type="button"
            className="mobile-menu__close"
            onClick={closeMenu}
            aria-label="Close navigation"
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>
        <nav className="mobile-menu__nav" aria-label="Mobile navigation">
          {primaryNav.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              className="mobile-menu__link"
              data-current={isCurrent(pathname, item.href) || undefined}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mobile-menu__foot">
          <Link href="/cost-calculator" onClick={closeMenu} className="text-link text-link--light">
            Cost calculator
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <Link href="/contact" onClick={closeMenu} className="button button--primary">
            Book consultation
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </dialog>
    </header>
  );
}

export function SiteFooter({ cta = 'conversation' }: { cta?: 'conversation' | 'land' }) {
  const isLandInvitation = cta === 'land';

  return (
    <footer className="site-footer">
      <div className="site-footer__cta shell">
        <p className="eyebrow eyebrow--light">
          {isLandInvitation ? 'Begin with the site' : 'Let’s talk'}
        </p>
        <div className="site-footer__cta-grid">
          <h2>
            {isLandInvitation
              ? 'Bring us the land. We’ll reveal what it can hold.'
              : 'Start with a conversation.'}
          </h2>
          <div>
            <p>
              {isLandInvitation
                ? 'Share your location, approximate area, and what you want the building to make possible.'
                : 'Tell us about your project, your site and what you want to build.'}
            </p>
            <Link href="/contact" className="text-link text-link--light">
              {isLandInvitation ? 'Start a project' : 'Book consultation'}{' '}
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      <div className="site-footer__base shell">
        <div className="site-footer__brand">
          <BrandMark inverted />
          <p>
            ASTHIWAR is a design &amp; build company committed to creating thoughtful, sustainable
            and timeless spaces.
          </p>
        </div>
        <nav className="site-footer__links" aria-label="Footer navigation">
          <Link href="/projects">Projects</Link>
          <Link href="/cost-calculator">Cost</Link>
          <Link href="/services">Services</Link>
          <Link href="/about">Studio</Link>
          <Link href="/journey">Journey</Link>
        </nav>
        <nav className="site-footer__links site-footer__services" aria-label="Services">
          <p className="eyebrow eyebrow--light">Services</p>
          <Link href="/services#architecture">Architecture</Link>
          <Link href="/services#interiors">Interior</Link>
          <Link href="/services#construction">Construction</Link>
          <Link href="/services#structural">Structural</Link>
          <Link href="/services#green-building">Green Building</Link>
        </nav>
        <div className="site-footer__contact">
          <p className="eyebrow eyebrow--light">Contact</p>
          <p>Contact details to be confirmed</p>
        </div>
      </div>

      <div className="site-footer__legal shell">
        <span>© {new Date().getFullYear()} ASTHIWAR</span>
        <span>Sample project content for UI demonstration</span>
      </div>
    </footer>
  );
}

export function SiteLayout({
  children,
  footerCta = 'conversation',
}: {
  children: ReactNode;
  footerCta?: 'conversation' | 'land';
}) {
  return (
    <div className="site-page">
      <SiteHeader />
      <main id="main-content">{children}</main>
      <SiteFooter cta={footerCta} />
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  light = false,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  light?: boolean;
}) {
  return (
    <div className={`section-heading${light ? ' section-heading--light' : ''}`}>
      <p className={`eyebrow${light ? ' eyebrow--light' : ''}`}>{eyebrow}</p>
      <div className="section-heading__grid">
        <h2>{title}</h2>
        {body ? <p>{body}</p> : null}
      </div>
    </div>
  );
}
