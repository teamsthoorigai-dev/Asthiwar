import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { contact, footerNav, legalNav, serviceNav, socials } from '@/data/nav';
import styles from './SiteFooter.module.css';

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.cta}>
          <div className={styles.ctaLeft}>
            <p className={styles.ctaEyebrow}>BEGIN WITH THE SITE</p>
            <h2 className={styles.ctaTitle}>
              Bring us the land. We’ll reveal what it can hold.
            </h2>
          </div>

          <div className={styles.ctaRight}>
            <p className={styles.ctaBody}>
              Share your location, approximate area, and what you want the building to make possible.
            </p>
            <Button href="/contact" variant="white" className={styles.ctaButton}>
              START A PROJECT ↗
            </Button>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.brandCol}>
            <Link href="/" aria-label="ASTHIWAR home">
              <Image
                src="/brand/asthiwar-logo-white.png"
                alt="ASTHIWAR"
                width={160}
                height={28}
                className={styles.logo}
              />
            </Link>
            <p className={styles.positioning}>
              Architecture, engineering and construction in Coimbatore, coordinated through
              one process.
            </p>
            {socials.length > 0 ? (
              <ul className={styles.list}>
                {socials.map((s) => (
                  <li key={s.href}>
                    <Link href={s.href} className={styles.link}>
                      {s.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <nav className={styles.col} aria-labelledby="footer-navigate">
            <h2 id="footer-navigate">Navigate</h2>
            <ul className={styles.list}>
              {footerNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={styles.link}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className={styles.col} aria-labelledby="footer-services">
            <h2 id="footer-services">Services</h2>
            <ul className={styles.list}>
              {serviceNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={styles.link}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className={`${styles.col} ${styles.contactCol}`}>
            <h2 id="footer-contact">Contact</h2>
            <ul className={styles.list}>
              <li>
                <p className={styles.value}>{contact.address}</p>
              </li>
              <li>
                <p className={styles.value}>{contact.phone}</p>
              </li>
              <li>
                <p className={styles.value}>{contact.email}</p>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.legal}>
          <p style={{ margin: 0 }}>© 2026 ASTHIWAR Design &amp; Build</p>
          <ul className={styles.legalLinks}>
            {legalNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={styles.link}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
