import { Facebook, Instagram, Youtube } from 'lucide-react';
import type { ComponentType } from 'react';
import { socials } from '@/data/nav';
import styles from './SocialDock.module.css';

/** lucide has no WhatsApp mark, so this one is drawn. */
function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 7.021 2.91 9.825 9.825 0 0 1 2.9 7.008c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.53-8.413Z" />
    </svg>
  );
}

const channels: ReadonlyArray<{ label: string; Icon: ComponentType<{ size?: number }> }> = [
  { label: 'Instagram', Icon: Instagram },
  { label: 'YouTube', Icon: Youtube },
  { label: 'WhatsApp', Icon: WhatsAppIcon },
  { label: 'Facebook', Icon: Facebook },
];

/**
 * The four channel marks, docked bottom-right.
 *
 * The URLs are still unconfirmed (`socials` in data/nav.ts is empty), so each
 * mark renders as an inert, non-focusable label rather than a link to nowhere.
 * The moment a URL lands in `socials` under a matching label, that mark becomes
 * a real anchor — no change needed here.
 */
export function SocialDock() {
  return (
    <nav className={styles.dock} aria-label="Social media">
      <ul className={styles.list}>
        {channels.map(({ label, Icon }) => {
          const href = socials.find((s) => s.label === label)?.href;
          return (
            <li key={label}>
              {href ? (
                <a
                  className={styles.item}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`ASTHIWAR on ${label}`}
                >
                  <Icon size={20} />
                </a>
              ) : (
                <span className={styles.item} title={`${label} — link to be confirmed`}>
                  <Icon size={20} />
                  <span className={styles.srOnly}>{label} link to be confirmed</span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
