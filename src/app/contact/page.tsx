import type { Metadata } from 'next';
import { EnquiryForm } from '@/components/home/EnquiryForm';
import { getLocationsForSite } from '@/lib/api/locations';
import { contactPage } from '@/data/contact';
import { enquiryForm } from '@/data/home';
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

export default async function ContactPage() {
  // Read from the catalogue rather than a hand-written duplicate: the dropdown
  // used to offer Salem, which the calculator cannot price, and omitted two
  // cities that it can.
  const locations = await getLocationsForSite();

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
              <EnquiryForm content={enquiryForm} variant="page" locations={locations} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

