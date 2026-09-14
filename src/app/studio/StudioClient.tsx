'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { studioPage } from '@/data/studio';
import { AsthiwarMark } from '@/components/brand/AsthiwarMark';
import { Odometer } from '@/components/ui/Odometer';
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

          {/* 2-Column Grid: Story Narrative on Left, Building Pillar Mark in Empty Space on Right */}
          <div className={styles.profileGrid}>
            <div className={styles.profileContent}>
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
            </div>

            {/* Architectural Building Pillar Emblem in Full Size */}
            <div className={styles.pillarStickyCol} aria-hidden="true">
              <div className={styles.pillarFrame}>
                <AsthiwarMark className={styles.pillarMark} />
              </div>
            </div>
          </div>

          {/* Milestone Stats with Rolling Odometer Effect */}
          <div className={styles.states}>
            {studioPage.profile.stats.map((stat) => (
              <Odometer
                key={stat.label}
                value={stat.value}
                pad={'pad' in stat ? stat.pad : undefined}
                suffix={'suffix' in stat ? stat.suffix : undefined}
                label={stat.label}
                className={styles.stateOdometer}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. Our People Section — 3-Column Card Overlay matching media_1789119603362.jpg */}
      <section className={`${styles.section} ${styles.teamSection}`} aria-labelledby="team-heading">
        <div className={styles.inner}>
          <div className={styles.peopleTitleCard}>
            <h6 className={styles.peopleEyebrow} id="team-heading">
              {studioPage.team.eyebrow}
            </h6>
            <div className={styles.peopleLine} aria-hidden="true" />
          </div>

          <div className={styles.peopleGrid}>
            {studioPage.team.members.map((member) => (
              <article key={member.id} className={styles.peopleCard}>
                <Image
                  src={member.image.src}
                  alt={member.image.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className={`${styles.peopleImage} ${
                    member.id === 'akileshwaran'
                      ? styles.akileshwaranPos
                      : member.id === 'arthiya'
                      ? styles.arthiyaPos
                      : styles.gowthamPos
                  }`}
                />
                <div className={styles.peopleGradient} aria-hidden="true" />
                <div className={styles.peopleMeta}>
                  <h3 className={styles.peopleName}>{member.name}</h3>
                  <p className={styles.peopleRole}>{member.role}</p>
                </div>
              </article>
            ))}
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

          {/* Office selector tabs — sticky on mobile for switching locations while viewing map */}
          <div className={styles.tabsStickyWrapper}>
            <div className={styles.tabsBar} role="tablist" aria-label="ASTHIWAR Studios">
              {studioPage.offices.locations.map((office, idx) => {
                const isActive = office.id === activeOffice.id;
                const shortLabel =
                  office.id === 'cbe-1'
                    ? 'Airport Axis'
                    : office.id === 'cbe-2'
                    ? 'GCT Axis'
                    : 'Virudhunagar Hub';

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
                    <span className={styles.tabFullLabel}>{office.city} — {office.region}</span>
                    <span className={styles.tabShortLabel}>{shortLabel}</span>
                  </button>
                );
              })}
            </div>
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
              </div>
            </div>

            {/* Architectural Line-Art Map with Click-to-Reveal */}
            <StudioLineArtMap key={activeOffice.id} office={activeOffice} />
          </div>
        </div>
      </section>
    </main>
  );
}
