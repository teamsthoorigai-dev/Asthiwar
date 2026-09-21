import Image from 'next/image';
import Link from 'next/link';
import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';
import type { ComponentType } from 'react';
import { Button } from '@/components/ui/Button';
import { contact, footerNav, legalNav, serviceNav, socials } from '@/data/nav';
import styles from './SiteFooter.module.css';

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 7.021 2.91 9.825 9.825 0 0 1 2.9 7.008c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.53-8.413Z" />
    </svg>
  );
}

const socialChannels: ReadonlyArray<{ label: string; Icon: ComponentType<{ size?: number }> }> = [
  { label: 'Instagram', Icon: Instagram },
  { label: 'YouTube', Icon: Youtube },
  { label: 'WhatsApp', Icon: WhatsAppIcon },
  { label: 'Facebook', Icon: Facebook },
  { label: 'LinkedIn', Icon: Linkedin },
];

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
              START A PROJECT
            </Button>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.brandCol}>
            <Link href="/" aria-label="ASTHIWAR home">
              <Image
                src="/brand/asthiwar-logo-white.png"
                alt="ASTHIWAR"
                width={190}
                height={28}
                className={styles.logo}
              />
            </Link>
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

            <ul className={styles.socialList} aria-label="Social media channels">
              {socialChannels.map(({ label, Icon }) => {
                const href = socials.find((s) => s.label.toLowerCase() === label.toLowerCase())?.href;
                return (
                  <li key={label}>
                    <a
                      href={href || '#'}
                      target={href ? '_blank' : undefined}
                      rel={href ? 'noreferrer noopener' : undefined}
                      aria-label={href ? `ASTHIWAR on ${label}` : `${label} (To be confirmed)`}
                      title={href ? `ASTHIWAR on ${label}` : `${label} — link to be confirmed`}
                      className={styles.socialIconLink}
                    >
                      <Icon size={18} />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className={styles.legal}>
          <p className={styles.copyright}>
            © 2026 <span className={styles.holder}>DreamLand Pictures.</span> All Rights Reserved.
          </p>
          <ul className={styles.legalLinks}>
            {legalNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={styles.link}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className={styles.credit}>
            Crafted by <span className={styles.creditName}>DreamLand Pictures</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
