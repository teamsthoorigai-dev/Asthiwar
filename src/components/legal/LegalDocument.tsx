import Link from 'next/link';
import {
  legalContact,
  type LegalBlock,
  type LegalLink,
  type LegalPage,
  type LegalText,
} from '@/data/legal';
import styles from './LegalDocument.module.css';

function InlineLink({ link }: { link: LegalLink }) {
  const className = [styles.link, link.href.startsWith('tel:') && styles.nowrap]
    .filter(Boolean)
    .join(' ');

  // mailto: and tel: are not routes; only paths on this site go through the router.
  return link.href.startsWith('/') ? (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  ) : (
    <a href={link.href} className={className}>
      {link.label}
    </a>
  );
}

function Inline({ text }: { text: LegalText }) {
  if (typeof text === 'string') return text;

  return text.map((part, index) =>
    typeof part === 'string' ? part : <InlineLink key={index} link={part} />,
  );
}

function Block({ block }: { block: LegalBlock }) {
  switch (block.type) {
    case 'text':
      return (
        <p className={styles.text}>
          <Inline text={block.text} />
        </p>
      );
    case 'list':
      return (
        <ul className={styles.list}>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case 'facts':
      return (
        <dl className={styles.facts}>
          {block.items.map((fact) => (
            <div className={styles.fact} key={fact.label}>
              <dt className={styles.factLabel}>{fact.label}</dt>
              <dd className={styles.factText}>
                <Inline text={fact.text} />
              </dd>
            </div>
          ))}
        </dl>
      );
  }
}

/**
 * A legal page: title block, then numbered clauses in two columns (title left,
 * body right), the way the contact page sets its details. Serves /terms and
 * /privacy; the wording lives in data/terms.ts and data/privacy.ts.
 */
export function LegalDocument({ page }: { page: LegalPage }) {
  const { eyebrow, title, effectiveDate, intro, sections, closing } = page;

  return (
    <div className={styles.page}>
      <section className={styles.section} aria-labelledby="legal-title">
        <div className={styles.inner}>
          <header className={styles.header}>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h1 className={styles.title} id="legal-title">
              {title}
            </h1>

            <div className={styles.introRow}>
              <p className={styles.effective}>
                Effective date: <time dateTime={effectiveDate.iso}>{effectiveDate.label}</time>
              </p>
              <p className={styles.lead}>
                <Inline text={intro} />
              </p>
            </div>
          </header>

          <div className={styles.clauses}>
            {sections.map((section, index) => (
              <section
                className={styles.clause}
                id={section.id}
                key={section.id}
                aria-labelledby={`${section.id}-title`}
              >
                <div className={styles.clauseHead}>
                  <span className={styles.num} aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h2 className={styles.clauseTitle} id={`${section.id}-title`}>
                    {section.title}
                  </h2>
                </div>

                <div className={styles.clauseBody}>
                  {section.blocks.map((block, blockIndex) => (
                    <Block block={block} key={blockIndex} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          {closing ? (
            <div className={styles.closing}>
              <p className={styles.text}>
                {closing} Write to <InlineLink link={legalContact.email} /> or call{' '}
                <InlineLink link={legalContact.phone} />.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
