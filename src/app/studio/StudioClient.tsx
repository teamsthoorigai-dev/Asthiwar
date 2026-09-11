'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { studioPage } from '@/data/studio';
import { StudioLineArtMap } from '@/components/studio/StudioLineArtMap';
import styles from './studio.module.css';

export function StudioClient() {
  const [activeOfficeId, setActiveOfficeId] = useState<string>(
    studioPage.offices.locations[0].id
  );

  const activeOffice =
    studioPage.offices.locations.find((loc) => loc.id === activeOfficeId) ??
    studioPage.offices.locations[0];

  return (
    <main className={styles.page}>
      {/* 1. Studio Profile & Story */}
      <section className={`${styles.section} ${styles.firstSection}`} aria-labelledby="studio-profile-title">
        <div className={styles.inner}>
          {/* Eyebrow with hairline rule */}
          <div className={styles.titleCard}>
            <h6 className={styles.eyebrow} id="studio-profile-title">
              {studioPage.profile.eyebrow}
            </h6>
            <div className={styles.greyLine} aria-hidden="true" />
          </div>

          <h1 className={styles.heading48}>
            {studioPage.profile.heading}
          </h1>

          <div className={styles.bodyText}>
            {studioPage.profile.paragraphs.map((p, i) => (
              <p key={i} className={styles.paragraph}>
                {p}
              </p>
            ))}
          </div>

          {/* Large Studio / Office Showcase Photo */}
          <div className={styles.heroMedia}>
            <figure className={styles.heroImageFrame}>
              <Image
                src={studioPage.profile.heroImage.src}
                alt={studioPage.profile.heroImage.alt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 78rem"
                className={styles.heroImage}
              />
            </figure>
            <div className={styles.heroCaption}>
              <span>{studioPage.profile.heroImage.caption[0]}</span>
              <span>{studioPage.profile.heroImage.caption[1]}</span>
            </div>
          </div>

          {/* Secondary Editorial Heading & Narrative */}
          <h2 className={styles.headingSecondary}>
            {studioPage.profile.secondaryHeading}
          </h2>

          <div className={styles.bodyText}>
            {studioPage.profile.secondaryParagraphs.map((p, i) => (
              <p key={i} className={styles.paragraph}>
                {p}
              </p>
            ))}
          </div>

          {/* Milestone Stats */}
          <div className={styles.states}>
            {studioPage.profile.stats.map((stat, i) => (
              <div key={i} className={styles.stateBlock}>
                <span className={styles.stateHeading}>{stat.number}</span>
                <span className={styles.stateLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Our Team Section — Styled matching unknownarchitects.in/team */}
      <section className={`${styles.section} ${styles.teamSection}`} aria-labelledby="team-heading">
        <div className={styles.inner}>
          <div className={styles.titleCard}>
            <h6 className={styles.eyebrow} id="team-heading">
              {studioPage.team.eyebrow}
            </h6>
            <div className={styles.greyLine} aria-hidden="true" />
          </div>

          <h2 className={styles.heading48}>
            {studioPage.team.heading}
          </h2>

          <p className={styles.teamLead}>
            {studioPage.team.lead}
          </p>

          {/* Top Row: Owners / Principals (Side by Side) */}
          <div className={styles.ownersContainer}>
            <span className={styles.subSectionLabel}>
              {studioPage.team.principalsHeading}
            </span>

            <div className={styles.ownersGrid}>
              {studioPage.team.principals.map((principal) => (
                <article key={principal.id} className={styles.memberItem}>
                  <div className={styles.memberImageFrame}>
                    <Image
                      src={principal.image.src}
                      alt={principal.image.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, 410px"
                      className={styles.memberImage}
                    />
                  </div>
                  <div className={styles.memberMeta}>
                    <h3 className={styles.memberName}>{principal.name}</h3>
                    <div className={styles.memberRole}>{principal.role}</div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Lower Row: Execution Team Grid */}
          <div>
            <span className={styles.subSectionLabel}>
              {studioPage.team.teamHeading}
            </span>

            <div className={styles.teamGrid}>
              {studioPage.team.executionTeam.map((member) => (
                <article key={member.id} className={styles.memberItem}>
                  <div className={styles.memberImageFrame}>
                    <Image
                      src={member.image.src}
                      alt={member.image.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, 360px"
                      className={styles.memberImage}
                    />
                  </div>
                  <div className={styles.memberMeta}>
                    <h3 className={styles.memberName}>{member.name}</h3>
                    <div className={styles.memberRole}>{member.role}</div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Studio Hubs & Locations Section with Line Art Maps + Click-to-Reveal */}
      <section className={`${styles.section} ${styles.locationsSection}`} aria-labelledby="locations-heading">
        <div className={styles.inner}>
          <div className={styles.titleCard}>
            <h6 className={styles.eyebrow} id="locations-heading">
              {studioPage.offices.eyebrow}
            </h6>
            <div className={styles.greyLine} aria-hidden="true" />
          </div>

          <div className={styles.locationHeader}>
            <h2 className={styles.heading48}>
              {studioPage.offices.heading}
            </h2>
            <p className={styles.locationIntro}>
              {studioPage.offices.description}
            </p>
          </div>

          {/* Office selector tabs */}
          <div className={styles.tabsBar} role="tablist" aria-label="ASTHIWAR Studios">
            {studioPage.offices.locations.map((office, idx) => {
              const isActive = office.id === activeOffice.id;
              return (
                <button
                  key={office.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`${styles.tabButton} ${isActive ? styles.tabActive : ''}`}
                  onClick={() => setActiveOfficeId(office.id)}
                >
                  <span className={styles.tabIndex}>0{idx + 1}</span>
                  <span>{office.city} — {office.region}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Office & Line Art Map Display */}
          <div className={styles.officeDisplayGrid}>
            <div className={styles.officeInfo}>
              <div>
                <span className={styles.officeBadge}>{activeOffice.region}</span>
                <h3 className={styles.officeName}>{activeOffice.name}</h3>

                <div className={styles.addressDetails}>
                  <div className={styles.addressLine}>{activeOffice.address}</div>
                  <div className={styles.addressSub}>{activeOffice.city}, {activeOffice.state}</div>
                </div>

                <div className={styles.addressMeta}>
                  <span><strong>Road Corridor:</strong> {activeOffice.roadAxis}</span>
                  <span><strong>Landmark:</strong> {activeOffice.landmark}</span>
                  <span><strong>Coordinates:</strong> {activeOffice.coordinates}</span>
                </div>
              </div>

              <div className={styles.officeActions}>
                <a
                  href={activeOffice.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.directionsButton}
                >
                  <span>Open in Google Maps</span>
                  <span aria-hidden="true">↗</span>
                </a>

                <Link href="/contact" className={styles.consultationLink}>
                  <span>Book Studio Consultation</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>

            {/* Architectural Line-Art Map with Click-to-Reveal */}
            <StudioLineArtMap key={activeOffice.id} office={activeOffice} />
          </div>

          {/* Bottom consultation CTA */}
          <div className={styles.studioCta}>
            <div>
              <h3 className={styles.ctaHeading}>Ready to begin your architectural conversation?</h3>
              <p className={styles.ctaSub}>
                Visit our Coimbatore studios or Virudhunagar execution center, or book a consultation online.
              </p>
            </div>
            <Link href="/contact" className={styles.directionsButton}>
              <span>Book Consultation</span>
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
