import type { Metadata } from 'next';
import { MapReveal } from '@/components/contact/MapReveal';
import { EnquiryForm } from '@/components/home/EnquiryForm';
import { Faq } from '@/components/home/Faq';
import { ServiceRadiusMap } from '@/components/contact/ServiceRadiusMap';
import { contactPage } from '@/data/contact';
import { enquiryForm, faqContent } from '@/data/home';
import styles from './contact.module.css';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Start a project with ASTHIWAR. Share your site and what you want to build.',
  openGraph: {
    title: 'Contact — ASTHIWAR',
    description:
      'Start a project with ASTHIWAR. Share your site and what you want to build.',
    url: '/contact',
  },
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactPage() {
  return (
    <div className={styles.page}>
      <section className={styles.contactSection} aria-labelledby="contact-title">
        <div className={styles.inner}>
          <div className={styles.grid}>
            <div className={styles.intro}>
              <p className={styles.eyebrow}>{contactPage.eyebrow}</p>
              <h1 className={styles.title} id="contact-title">
                {contactPage.title}
              </h1>
              <p className={styles.body}>{contactPage.body}</p>

              <dl className={styles.details}>
                {contactPage.details.map((detail) => (
                  <div className={styles.detail} key={detail.label}>
                    <dt className={styles.detailLabel}>{detail.label}</dt>
                    <dd className={styles.placeholder}>{detail.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className={styles.form}>
              <EnquiryForm content={enquiryForm} variant="page" />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.radiusSection} aria-label="Operational territory" style={{ paddingBlock: 'var(--section-y-sm)', borderBlockStart: '1px solid var(--hairline)' }}>
        <div className={styles.inner}>
          <ServiceRadiusMap />
        </div>
      </section>

      <Faq content={faqContent} />

      <section className={styles.mapSection} aria-label="Coimbatore studio location">
        <div className={styles.inner}>
          <MapReveal {...contactPage.map} />
        </div>
      </section>
    </div>
  );
}
