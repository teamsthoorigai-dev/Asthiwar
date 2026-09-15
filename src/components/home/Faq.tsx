import { JsonLd } from '@/components/JsonLd';
import { Accordion, type AccordionEntry } from '@/components/ui/Accordion';
import { Section } from '@/components/ui/Section';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { faqs } from '@/data/site';
import { getFaqJsonLd } from '@/lib/jsonld';
import styles from './Faq.module.css';

export type FaqContent = {
  title: string;
  intro?: string;
};

type Props = {
  content: FaqContent;
};

const FAQ_ITEMS: AccordionEntry[] = faqs.map((faq) => ({
  q: faq.q,
  a: faq.a,
}));

/**
 * Homepage section 14. The sticky desktop introduction keeps the approved FAQ
 * list readable while the existing Accordion owns its accessible interaction.
 */
export function Faq({ content }: Props) {
  return (
    <>
      <JsonLd data={getFaqJsonLd()} />

      <Section className={styles.faqSection} aria-labelledby="faq-title">
        <div className={styles.layout}>
          <div className={styles.intro}>
            <SectionHeader id="faq-title" title={content.title} body={content.intro} />
          </div>

          <div className={styles.accordion}>
            <Accordion items={FAQ_ITEMS} initialOpen={0} showMoreAfter={10} />
          </div>
        </div>
      </Section>
    </>
  );
}
