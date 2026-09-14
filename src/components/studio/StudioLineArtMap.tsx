'use client';

import { useState } from 'react';
import type { StudioOffice } from '@/data/studio';
import styles from './StudioLineArtMap.module.css';

type Props = {
  office: StudioOffice;
};

export function StudioLineArtMap({ office }: Props) {
  const [isRevealed, setIsRevealed] = useState(false);

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const handleBackToLineArt = () => {
    setIsRevealed(false);
  };

  // Satellite thumbnail label based on office
  const satelliteLabel = (() => {
    if (office.id === 'cbe-1') return 'Peelamedu • Airport Corridor';
    if (office.id === 'cbe-2') return 'Venkatapuram • GCT Sector';
    return 'NH 44 • Virudhunagar Hub';
  })();

  // Pin coordinates on SVG canvas (960 x 560) based on selected location
  const pinStyle = (() => {
    if (office.id === 'cbe-1') return { left: '54.2%', top: '48.2%' };
    if (office.id === 'cbe-2') return { left: '43.8%', top: '50%' };
    return { left: '50%', top: '48.2%' };
  })();

  if (isRevealed) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.mapContainer}>
          <div className={styles.mapToolbar}>
            <button
              type="button"
              className={styles.toolButton}
              onClick={handleBackToLineArt}
              title="Return to architectural line art map"
            >
              <span>◰ Line Art Map</span>
            </button>
            <a
              href={office.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.toolButton}
            >
              <span>Open in Google Maps</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>

          <iframe
            key={office.id}
            title={`Interactive Google Map of ${office.name}`}
            src={office.embedSrc}
            className={styles.mapIframe}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.lineArtButton}
        onClick={handleReveal}
        aria-label={`Click to open live interactive Google Map for ${office.name}`}
      >
        {/* Floating Top-Right Maps Satellite Preview Card (matching Novascape reference) */}
        <div className={styles.topRightMapsCard}>
          <span className={styles.mapsBadge}>
            <span>Maps</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </span>
          <span className={styles.satelliteLabel}>{satelliteLabel}</span>
        </div>

        {/* Architectural Studio Location Pin Emblem (with tower mark & drop pointer) */}
        <div className={styles.brandPinCard} style={pinStyle}>
          <div className={styles.brandLogoIcon}>
            {/* ASTHIWAR Monolith Building Mark */}
            <svg viewBox="0 0 20 24" fill="none" width="16" height="20">
              <path d="M4 1L1 4v16l3 3V1z" fill="#1c1917" />
              <path d="M11 7l-2 2v12l2 2V7z" fill="#d97706" />
              <path d="M18 12l-2 2v7l2 2v-11z" fill="#1c1917" />
            </svg>
          </div>
          <div className={styles.brandMetaWrap}>
            <span className={styles.brandWordmark}>ASTHIWAR</span>
            <span className={styles.brandSub}>{office.city} • {office.region}</span>
          </div>
        </div>

        {/* Bottom Architectural Legend & Action Bar (Replaces raw floating text) */}
        <div className={styles.bottomLegendBar}>
          <div className={styles.scaleBadge}>
            <div className={styles.scaleGraphic}>
              <span className={styles.scaleLine} />
              <span>500M</span>
            </div>
            <span className={styles.scaleDivider}>|</span>
            <span className={styles.coordText}>{office.coordinates}</span>
          </div>

          <div className={styles.actionPillButton}>
            <span className={styles.pillPulseDot} aria-hidden="true" />
            <span>Open Live Satellite Map</span>
            <span aria-hidden="true">↗</span>
          </div>
        </div>

        {/* ====================================================================
            LOCATION 1: Coimbatore Studio 1 (Nehru Nagar West / Airport Corridor)
            ==================================================================== */}
        {office.id === 'cbe-1' && (
          <svg
            viewBox="0 0 960 560"
            className={styles.svgCanvas}
            aria-hidden="true"
            preserveAspectRatio="xMidYMid slice"
          >
            {/* Background */}
            <rect width="100%" height="100%" fill="#f8f6f1" />

            {/* Land Patches */}
            <path d="M 280 230 L 460 220 L 480 370 L 330 380 Z" fill="#f3efe8" opacity="0.6" />
            <path d="M 520 180 L 740 130 L 780 270 L 580 290 Z" fill="#f3efe8" opacity="0.6" />
            <path d="M 600 310 L 860 250 L 910 430 L 670 420 Z" fill="#f3efe8" opacity="0.5" />

            {/* Secondary Connecting Streets */}
            <g stroke="#eae6de" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M 220 370 L 380 340 L 420 440" />
              <path d="M 460 260 L 510 180 L 420 120" />
              <path d="M 540 280 L 620 370 L 760 360" />
              <path d="M 680 210 L 760 120" />
              <path d="M 720 200 L 790 320" />
            </g>

            {/* Primary Road Ribbon Outlines */}
            <g stroke="#ded9ce" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" fill="none">
              {/* Avinashi Road (NH 544) Arterial Spine */}
              <path d="M 60 450 L 260 380 L 440 315 L 530 270 L 660 215 L 800 155 L 940 95" />
              {/* Kalapatti Main Road */}
              <path d="M 530 270 L 490 170 L 460 60" />
              {/* Airport Link Road / Aerodrome Road */}
              <path d="M 720 190 L 770 290 L 820 400 L 880 470" />
              {/* Peelamedu / CODISSIA Road */}
              <path d="M 260 380 L 280 490" />
              {/* SITRA Junction Circle Cross-Road */}
              <path d="M 620 90 L 720 190 L 680 320" />
              {/* Goldwins / Neelambur Link */}
              <path d="M 800 155 L 860 240 L 920 320" />
            </g>

            {/* Road White Center Infill */}
            <g stroke="#ffffff" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M 60 450 L 260 380 L 440 315 L 530 270 L 660 215 L 800 155 L 940 95" />
              <path d="M 530 270 L 490 170 L 460 60" />
              <path d="M 720 190 L 770 290 L 820 400 L 880 470" />
              <path d="M 260 380 L 280 490" />
              <path d="M 620 90 L 720 190 L 680 320" />
              <path d="M 800 155 L 860 240 L 920 320" />
            </g>

            {/* Avinashi Road Center Median Dashes */}
            <path
              d="M 60 450 L 260 380 L 440 315 L 530 270 L 660 215 L 800 155 L 940 95"
              stroke="#e2ddd4"
              strokeWidth="1.5"
              strokeDasharray="6 6"
              fill="none"
            />

            {/* Angled Street Name Typography */}
            <g fill="#475569" fontSize="10.5" fontFamily="var(--font-brand)" fontWeight="600" letterSpacing="0.08em">
              <text x="140" y="405" transform="rotate(-19 140 405)">AVINASHI ROAD (NH 544)</text>
              <text x="680" y="175" transform="rotate(-23 680 175)">AVINASHI ROAD (TO AIRPORT / KMCH)</text>
              <text x="460" y="150" transform="rotate(-70 460 150)">KALAPATTI MAIN ROAD</text>
              <text x="765" y="275" transform="rotate(64 765 275)">AIRPORT LINK ROAD</text>
              <text x="210" y="445" transform="rotate(80 210 445)">PEELAMEDU</text>
              <text x="645" y="180" transform="rotate(-23 645 180)">SITRA CIRCLE</text>
              <text x="440" y="275">NEHRU NAGAR WEST</text>
              <text x="825" y="135" transform="rotate(-23 825 135)">GOLDWINS</text>
            </g>

            {/* POI Landmark Dots */}
            <g>
              {/* Airport Terminal */}
              <g transform="translate(825, 410)">
                <circle cx="0" cy="0" r="14" fill="#faf6f0" stroke="#d5cebe" strokeWidth="1.5" />
                <path d="M -4 -2 L 4 -2 L 5 0 L 1 1 L 0 5 L -2 5 L -1 1 L -4 1 Z" fill="#b45309" />
                <text x="18" y="4" fill="#78716c" fontSize="8.5" fontFamily="var(--font-brand)" fontWeight="500">INTL AIRPORT</text>
              </g>

              {/* KMCH Hospital */}
              <g transform="translate(640, 270)">
                <circle cx="0" cy="0" r="13" fill="#faf6f0" stroke="#d5cebe" strokeWidth="1.5" />
                <path d="M -4 -1 H -1 V -4 H 1 V -1 H 4 V 1 H 1 V 4 H -1 V 1 H -4 Z" fill="#b45309" />
                <text x="16" y="4" fill="#78716c" fontSize="8.5" fontFamily="var(--font-brand)" fontWeight="500">KMCH HOSPITAL</text>
              </g>

              {/* CODISSIA Trade Fair Grounds */}
              <g transform="translate(300, 440)">
                <circle cx="0" cy="0" r="13" fill="#faf6f0" stroke="#d5cebe" strokeWidth="1.5" />
                <rect x="-3" y="-3" width="6" height="6" fill="#b45309" />
                <text x="-70" y="4" fill="#78716c" fontSize="8.5" fontFamily="var(--font-brand)" fontWeight="500">CODISSIA</text>
              </g>

              {/* SITRA Campus */}
              <g transform="translate(730, 130)">
                <circle cx="0" cy="0" r="12" fill="#faf6f0" stroke="#d5cebe" strokeWidth="1.5" />
                <polygon points="0,-4 4,-1 0,2 -4,-1" fill="#b45309" />
                <text x="16" y="4" fill="#78716c" fontSize="8.5" fontFamily="var(--font-brand)" fontWeight="500">SITRA</text>
              </g>

              {/* Additional landmark dots */}
              <circle cx="500" cy="220" r="9" fill="#faf6f0" stroke="#d5cebe" strokeWidth="1" />
              <circle cx="580" cy="240" r="9" fill="#faf6f0" stroke="#d5cebe" strokeWidth="1" />
              <circle cx="610" cy="180" r="9" fill="#faf6f0" stroke="#d5cebe" strokeWidth="1" />
              <circle cx="430" cy="330" r="9" fill="#faf6f0" stroke="#d5cebe" strokeWidth="1" />
              <circle cx="470" cy="350" r="9" fill="#faf6f0" stroke="#d5cebe" strokeWidth="1" />
            </g>

            {/* Radar Pulse Beacon at Nehru Nagar West (520, 270) */}
            <g>
              <circle cx="520" cy="270" r="32" fill="none" stroke="#d97706" opacity="0.25" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="520" cy="270" r="20" fill="none" stroke="#d97706" opacity="0.4" strokeWidth="1.5" />
              <circle cx="520" cy="270" r="8" fill="#d97706" opacity="0.25" />
              <circle cx="520" cy="270" r="4.5" fill="#d97706" stroke="#ffffff" strokeWidth="1.5" />
            </g>
          </svg>
        )}

        {/* ====================================================================
            LOCATION 2: Coimbatore Studio 2 (Venkatapuram / GCT Post Sector)
            ==================================================================== */}
        {office.id === 'cbe-2' && (
          <svg
            viewBox="0 0 960 560"
            className={styles.svgCanvas}
            aria-hidden="true"
            preserveAspectRatio="xMidYMid slice"
          >
            {/* Background */}
            <rect width="100%" height="100%" fill="#f8f6f1" />

            {/* GCT & TNAU Campus Green Zones */}
            <path d="M 440 280 L 590 270 L 610 400 L 460 410 Z" fill="#f1ece3" opacity="0.7" />
            <path d="M 260 210 L 390 190 L 410 320 L 280 340 Z" fill="#f3efe8" opacity="0.6" />
            <path d="M 120 360 L 320 370 L 290 480 L 100 460 Z" fill="#f3efe8" opacity="0.5" />

            {/* Secondary Link Streets */}
            <g stroke="#eae6de" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M 180 280 L 320 310 L 390 270" />
              <path d="M 360 380 L 420 280" />
              <path d="M 420 280 L 500 240 L 620 210" />
              <path d="M 520 370 L 590 320 L 710 310" />
              <path d="M 460 450 L 560 440 L 660 510" />
            </g>

            {/* Primary Road Ribbon Outlines */}
            <g stroke="#ded9ce" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" fill="none">
              {/* Thadagam Road Axis */}
              <path d="M 720 500 L 590 410 L 520 370 L 420 280 L 310 170 L 210 70" />
              {/* Maruthamalai Road Axis */}
              <path d="M 520 370 L 380 390 L 250 405 L 80 420" />
              {/* Amman Kovil Street (Venkatapuram Studio Access) */}
              <path d="M 420 280 L 350 350 L 380 390" />
              {/* Lawley Road & Cowley Brown Road / RS Puram Link */}
              <path d="M 520 370 L 580 440 L 660 520" />
              {/* GCT Campus Ring */}
              <path d="M 590 410 L 560 310 L 480 320" />
              {/* Vadavalli / Edayarpalayam Connection */}
              <path d="M 310 170 L 210 240 L 140 330" />
            </g>

            {/* Road White Center Infill */}
            <g stroke="#ffffff" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M 720 500 L 590 410 L 520 370 L 420 280 L 310 170 L 210 70" />
              <path d="M 520 370 L 380 390 L 250 405 L 80 420" />
              <path d="M 420 280 L 350 350 L 380 390" />
              <path d="M 520 370 L 580 440 L 660 520" />
              <path d="M 590 410 L 560 310 L 480 320" />
              <path d="M 310 170 L 210 240 L 140 330" />
            </g>

            {/* Thadagam Road Center Median Dashes */}
            <path
              d="M 720 500 L 590 410 L 520 370 L 420 280 L 310 170 L 210 70"
              stroke="#e2ddd4"
              strokeWidth="1.5"
              strokeDasharray="6 6"
              fill="none"
            />

            {/* Angled Street Name Typography */}
            <g fill="#475569" fontSize="10.5" fontFamily="var(--font-brand)" fontWeight="600" letterSpacing="0.08em">
              <text x="245" y="145" transform="rotate(-45 245 145)">THADAGAM ROAD (TO KANUVAI)</text>
              <text x="615" y="445" transform="rotate(-35 615 445)">THADAGAM ROAD</text>
              <text x="160" y="415" transform="rotate(7 160 415)">MARUTHAMALAI MAIN ROAD</text>
              <text x="320" y="315" transform="rotate(-45 320 315)">AMMAN KOVIL ST</text>
              <text x="495" y="355">LAWLEY ROAD JUNCTION</text>
              <text x="560" y="485" transform="rotate(45 560 485)">COWLEY BROWN RD (RS PURAM)</text>
              <text x="410" y="255">VENKATAPURAM (GCT POST)</text>
              <text x="120" y="275" transform="rotate(50 120 275)">VADAVALLI LINK</text>
            </g>

            {/* POI Landmark Dots */}
            <g>
              {/* GCT Campus */}
              <g transform="translate(500, 310)">
                <circle cx="0" cy="0" r="14" fill="#faf6f0" stroke="#d5cebe" strokeWidth="1.5" />
                <polygon points="0,-4 5,-1 0,2 -5,-1" fill="#b45309" />
                <text x="18" y="4" fill="#78716c" fontSize="8.5" fontFamily="var(--font-brand)" fontWeight="500">GCT CAMPUS</text>
              </g>

              {/* TNAU Botanical Gardens */}
              <g transform="translate(580, 440)">
                <circle cx="0" cy="0" r="13" fill="#faf6f0" stroke="#d5cebe" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="3.5" fill="#b45309" />
                <text x="18" y="4" fill="#78716c" fontSize="8.5" fontFamily="var(--font-brand)" fontWeight="500">TNAU BOTANICAL</text>
              </g>

              {/* Forest College */}
              <g transform="translate(420, 430)">
                <circle cx="0" cy="0" r="13" fill="#faf6f0" stroke="#d5cebe" strokeWidth="1.5" />
                <rect x="-3" y="-3" width="6" height="6" fill="#b45309" />
                <text x="-80" y="4" fill="#78716c" fontSize="8.5" fontFamily="var(--font-brand)" fontWeight="500">FOREST COLLEGE</text>
              </g>

              {/* Maruthamalai Temple Artery */}
              <g transform="translate(90, 400)">
                <circle cx="0" cy="0" r="12" fill="#faf6f0" stroke="#d5cebe" strokeWidth="1.5" />
                <polygon points="0,-5 4,2 -4,2" fill="#b45309" />
                <text x="16" y="4" fill="#78716c" fontSize="8.5" fontFamily="var(--font-brand)" fontWeight="500">MARUTHAMALAI</text>
              </g>

              {/* Additional landmark dots */}
              <circle cx="390" cy="240" r="9" fill="#faf6f0" stroke="#d5cebe" strokeWidth="1" />
              <circle cx="440" cy="320" r="9" fill="#faf6f0" stroke="#d5cebe" strokeWidth="1" />
              <circle cx="470" cy="270" r="9" fill="#faf6f0" stroke="#d5cebe" strokeWidth="1" />
              <circle cx="360" cy="360" r="9" fill="#faf6f0" stroke="#d5cebe" strokeWidth="1" />
              <circle cx="310" cy="410" r="9" fill="#faf6f0" stroke="#d5cebe" strokeWidth="1" />
            </g>

            {/* Radar Pulse Beacon at Venkatapuram (420, 280) */}
            <g>
              <circle cx="420" cy="280" r="32" fill="none" stroke="#d97706" opacity="0.25" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="420" cy="280" r="20" fill="none" stroke="#d97706" opacity="0.4" strokeWidth="1.5" />
              <circle cx="420" cy="280" r="8" fill="#d97706" opacity="0.25" />
              <circle cx="420" cy="280" r="4.5" fill="#d97706" stroke="#ffffff" strokeWidth="1.5" />
            </g>
          </svg>
        )}

        {/* ====================================================================
            LOCATION 3: Virudhunagar Regional Studio (NH 44 Southern Hub)
            ==================================================================== */}
        {office.id === 'virudhunagar' && (
          <svg
            viewBox="0 0 960 560"
            className={styles.svgCanvas}
            aria-hidden="true"
            preserveAspectRatio="xMidYMid slice"
          >
            {/* Background */}
            <rect width="100%" height="100%" fill="#f8f6f1" />

            {/* District Administrative / Industrial Land Patches */}
            <path d="M 380 180 L 560 170 L 590 320 L 410 330 Z" fill="#f1ece3" opacity="0.7" />
            <path d="M 520 330 L 740 290 L 780 430 L 560 440 Z" fill="#f3efe8" opacity="0.6" />
            <path d="M 180 290 L 360 310 L 320 440 L 140 420 Z" fill="#f3efe8" opacity="0.5" />

            {/* Secondary Connectors */}
            <g stroke="#eae6de" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M 320 220 L 440 240 L 540 190" />
              <path d="M 440 240 L 480 340 L 560 360" />
              <path d="M 380 340 L 440 430 L 580 420" />
              <path d="M 520 240 L 640 220 L 740 180" />
              <path d="M 280 360 L 380 380" />
            </g>

            {/* Primary Highway Outlines */}
            <g stroke="#ded9ce" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" fill="none">
              {/* National Highway 44 (Madurai – Kanyakumari Spine) */}
              <path d="M 480 30 L 480 160 L 480 270 L 480 390 L 480 530" />
              {/* Old Madurai Road */}
              <path d="M 480 160 L 380 230 L 320 310" />
              {/* Sivakasi Main Road */}
              <path d="M 480 270 L 350 320 L 220 370 L 70 420" />
              {/* Aruppukottai Road */}
              <path d="M 480 270 L 610 320 L 740 370 L 900 420" />
              {/* Railway Feeder Link */}
              <path d="M 320 310 L 350 320 L 380 440 L 480 460" />
              {/* Collectorate Link */}
              <path d="M 480 160 L 600 180 L 720 190" />
            </g>

            {/* Road White Center Infill */}
            <g stroke="#ffffff" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M 480 30 L 480 160 L 480 270 L 480 390 L 480 530" />
              <path d="M 480 160 L 380 230 L 320 310" />
              <path d="M 480 270 L 350 320 L 220 370 L 70 420" />
              <path d="M 480 270 L 610 320 L 740 370 L 900 420" />
              <path d="M 320 310 L 350 320 L 380 440 L 480 460" />
              <path d="M 480 160 L 600 180 L 720 190" />
            </g>

            {/* NH 44 Double Center Median Dashes */}
            <line x1="478" y1="30" x2="478" y2="530" stroke="#e2ddd4" strokeWidth="1" strokeDasharray="8 6" />
            <line x1="482" y1="30" x2="482" y2="530" stroke="#e2ddd4" strokeWidth="1" strokeDasharray="8 6" />

            {/* Angled Street Name Typography */}
            <g fill="#475569" fontSize="10.5" fontFamily="var(--font-brand)" fontWeight="600" letterSpacing="0.08em">
              <text x="465" y="110" transform="rotate(-90 465 110)">NATIONAL HIGHWAY 44 (TO MADURAI)</text>
              <text x="465" y="440" transform="rotate(-90 465 440)">NH 44 (TO TIRUNELVELI / KANYAKUMARI)</text>
              <text x="140" y="385" transform="rotate(-21 140 385)">SIVAKASI MAIN ROAD</text>
              <text x="640" y="335" transform="rotate(21 640 335)">ARUPPUKOTTAI ROAD</text>
              <text x="310" y="270" transform="rotate(-40 310 270)">OLD MADURAI ROAD</text>
              <text x="520" y="175">DISTRICT COLLECTORATE ROAD</text>
              <text x="495" y="265">VIRUDHUNAGAR BYPASS</text>
              <text x="310" y="375" transform="rotate(75 310 375)">RAILWAY FEEDER</text>
            </g>

            {/* POI Landmark Dots */}
            <g>
              {/* Virudhunagar Railway Junction */}
              <g transform="translate(330, 315)">
                <circle cx="0" cy="0" r="14" fill="#faf6f0" stroke="#d5cebe" strokeWidth="1.5" />
                <rect x="-3" y="-4" width="6" height="8" rx="1" fill="#b45309" />
                <circle cx="-1.5" cy="1" r="0.75" fill="#fff" />
                <circle cx="1.5" cy="1" r="0.75" fill="#fff" />
                <text x="-95" y="4" fill="#78716c" fontSize="8.5" fontFamily="var(--font-brand)" fontWeight="500">RAILWAY JUNCTION</text>
              </g>

              {/* District Collectorate */}
              <g transform="translate(680, 185)">
                <circle cx="0" cy="0" r="13" fill="#faf6f0" stroke="#d5cebe" strokeWidth="1.5" />
                <polygon points="0,-4 5,-1 0,2 -5,-1" fill="#b45309" />
                <text x="18" y="4" fill="#78716c" fontSize="8.5" fontFamily="var(--font-brand)" fontWeight="500">COLLECTORATE</text>
              </g>

              {/* SIDCO Industrial Estate */}
              <g transform="translate(650, 310)">
                <circle cx="0" cy="0" r="13" fill="#faf6f0" stroke="#d5cebe" strokeWidth="1.5" />
                <rect x="-3" y="-3" width="6" height="6" fill="#b45309" />
                <text x="18" y="4" fill="#78716c" fontSize="8.5" fontFamily="var(--font-brand)" fontWeight="500">INDUSTRIAL HUB</text>
              </g>

              {/* VHNSN College */}
              <g transform="translate(320, 195)">
                <circle cx="0" cy="0" r="12" fill="#faf6f0" stroke="#d5cebe" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="3.5" fill="#b45309" />
                <text x="-95" y="4" fill="#78716c" fontSize="8.5" fontFamily="var(--font-brand)" fontWeight="500">VHNSN CAMPUS</text>
              </g>

              {/* Additional landmark dots */}
              <circle cx="430" cy="240" r="9" fill="#faf6f0" stroke="#d5cebe" strokeWidth="1" />
              <circle cx="530" cy="270" r="9" fill="#faf6f0" stroke="#d5cebe" strokeWidth="1" />
              <circle cx="450" cy="330" r="9" fill="#faf6f0" stroke="#d5cebe" strokeWidth="1" />
              <circle cx="560" cy="350" r="9" fill="#faf6f0" stroke="#d5cebe" strokeWidth="1" />
              <circle cx="410" cy="380" r="9" fill="#faf6f0" stroke="#d5cebe" strokeWidth="1" />
            </g>

            {/* Radar Pulse Beacon at Virudhunagar Hub (480, 270) */}
            <g>
              <circle cx="480" cy="270" r="32" fill="none" stroke="#d97706" opacity="0.25" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="480" cy="270" r="20" fill="none" stroke="#d97706" opacity="0.4" strokeWidth="1.5" />
              <circle cx="480" cy="270" r="8" fill="#d97706" opacity="0.25" />
              <circle cx="480" cy="270" r="4.5" fill="#d97706" stroke="#ffffff" strokeWidth="1.5" />
            </g>
          </svg>
        )}
      </button>
    </div>
  );
}
