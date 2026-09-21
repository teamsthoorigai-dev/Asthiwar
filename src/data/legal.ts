/**
 * Shape of the site's legal pages (Terms & Conditions, Privacy Policy), which
 * are rendered by components/legal/LegalDocument. The words live in terms.ts
 * and privacy.ts; this file is only the vocabulary they are written in.
 */
import { contact } from './nav';

export type LegalLink = { readonly label: string; readonly href: string };

/** Body copy: a plain string, or a run of strings with inline links. */
export type LegalText = string | ReadonlyArray<string | LegalLink>;

export type LegalBlock =
  | { readonly type: 'text'; readonly text: LegalText }
  | { readonly type: 'list'; readonly items: readonly string[] }
  | {
      readonly type: 'facts';
      readonly items: ReadonlyArray<{ readonly label: string; readonly text: LegalText }>;
    };

export type LegalSection = {
  /** Anchor for deep links, e.g. /terms#cost-estimates. */
  readonly id: string;
  readonly title: string;
  readonly blocks: readonly LegalBlock[];
};

export type LegalPage = {
  readonly eyebrow: string;
  readonly title: string;
  /** `iso` feeds <time dateTime>; `label` is what the visitor reads. */
  readonly effectiveDate: { readonly iso: string; readonly label: string };
  readonly intro: LegalText;
  readonly sections: readonly LegalSection[];
  /**
   * Lead-in to a "Write to … or call …" line under the last clause. Leave it out
   * when a clause already gives the contact details.
   */
  readonly closing?: string;
};

/** The studio's contact details as links, so no legal page hard-codes them. */
export const legalContact = {
  email: { label: contact.email, href: `mailto:${contact.email}` },
  phone: { label: contact.phone, href: `tel:${contact.phone.replace(/\s/g, '')}` },
  address: contact.address,
} as const satisfies { email: LegalLink; phone: LegalLink; address: string };
