'use client';

import { useId, useState } from 'react';
import styles from './DualityBalance.module.css';

export function DualityBalance() {
  // 0 = Spatial Architecture, 50 = ASTHIWAR Equilibrium, 100 = Structural Engineering
  const [balance, setBalance] = useState(50);
  const filterId = useId();

  // Normalized weightings
  const archWeight = Math.max(0, (100 - balance) / 100);
  const engWeight = Math.max(0, balance / 100);

  return (
    <div className={styles.balanceCard} aria-labelledby="duality-balance-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Atmosphere &amp; Structure • Section Analysis</p>
        <h3 id="duality-balance-title" className={styles.title}>
          The Building Section: Spatial Void vs. Structural Load Path
        </h3>
        <p className={styles.subtitle}>
          In ASTHIWAR buildings, architecture and structural engineering are drafted simultaneously.
          Adjust the scrubber below to reveal how the spatial lightwell void is structurally resolved
          through continuous rammed earth mass and conventional RCC floor plates.
        </p>
      </header>

      {/* Interactive Architectural Building Cross-Section */}
      <div className={styles.canvasWrap} aria-hidden="true">
        <svg
          viewBox="0 0 900 460"
          className={styles.svgDiagram}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Soil Hatch Pattern */}
            <pattern id={`soilHatch-${filterId}`} width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 0 20 L 20 0 M -5 5 L 5 -5 M 15 25 L 25 15" stroke="var(--drafting-hatch)" strokeWidth="1" />
            </pattern>

            {/* Rammed Earth Stratification Pattern */}
            <pattern id={`earthLayers-${filterId}`} width="60" height="18" patternUnits="userSpaceOnUse">
              <rect width="60" height="18" fill="var(--drafting-surface)" />
              <line x1="0" y1="9" x2="60" y2="9" stroke="var(--drafting-muted)" strokeWidth="1" strokeDasharray="4 2" />
              <line x1="0" y1="18" x2="60" y2="18" stroke="var(--drafting-graphite)" strokeWidth="1.2" />
            </pattern>

            {/* Courtyard Light Beam Gradient */}
            <linearGradient id={`lightBeamGrad-${filterId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
              <stop offset="60%" stopColor="var(--accent)" stopOpacity={0.08} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.01} />
            </linearGradient>

            {/* Marker for Load Vectors */}
            <marker
              id={`loadArrow-${filterId}`}
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 2 2 L 8 5 L 2 8 Z" fill="var(--accent)" />
            </marker>

            <marker
              id={`tensionArrow-${filterId}`}
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 2 2 L 8 5 L 2 8 Z" fill="var(--drafting-graphite)" />
            </marker>
          </defs>

          {/* Subsoil Substrate (-1.20M) */}
          <rect x="0" y="380" width="900" height="80" fill={`url(#soilHatch-${filterId})`} />
          <line x1="0" y1="380" x2="900" y2="380" stroke="var(--drafting-graphite)" strokeWidth="1.5" />
          <text x="30" y="415" fill="var(--drafting-muted)" fontSize="11" fontFamily="monospace">
            HARD GRANITE SUBSTRATE • ELEV. 411M • GROUND GRADE: -1.20M
          </text>

          {/* Stepped Granite Footings (RR Masonry) */}
          {/* Left Wall Footing */}
          <rect x="110" y="350" width="100" height="30" fill="var(--drafting-surface-tint)" stroke="var(--drafting-graphite)" strokeWidth="1" />
          <rect x="125" y="330" width="70" height="20" fill="var(--drafting-surface-tint)" stroke="var(--drafting-graphite)" strokeWidth="1" />

          {/* Center Courtyard Edge Footing */}
          <rect x="330" y="350" width="90" height="30" fill="var(--drafting-surface-tint)" stroke="var(--drafting-graphite)" strokeWidth="1" />
          <rect x="340" y="330" width="70" height="20" fill="var(--drafting-surface-tint)" stroke="var(--drafting-graphite)" strokeWidth="1" />

          {/* Right Wall Footing */}
          <rect x="690" y="350" width="100" height="30" fill="var(--drafting-surface-tint)" stroke="var(--drafting-graphite)" strokeWidth="1" />
          <rect x="705" y="330" width="70" height="20" fill="var(--drafting-surface-tint)" stroke="var(--drafting-graphite)" strokeWidth="1" />

          {/* Reinforced Concrete Plinth Beam (Finished Plinth: +0.60M) */}
          <rect x="100" y="315" width="700" height="15" fill="var(--drafting-surface)" stroke="var(--drafting-ink)" strokeWidth="1" />
          <text x="815" y="326" fill="var(--accent)" fontSize="9" fontFamily="monospace">
            +0.60M PLINTH
          </text>

          {/* 300mm Stabilized Rammed Earth Structural Walls */}
          {/* Left Exterior Mass Wall */}
          <rect x="135" y="140" width="50" height="175" fill={`url(#earthLayers-${filterId})`} stroke="var(--drafting-ink)" strokeWidth="1.5" />
          {/* Courtyard Left Perimeter Wall */}
          <rect x="350" y="140" width="50" height="175" fill={`url(#earthLayers-${filterId})`} stroke="var(--drafting-ink)" strokeWidth="1.5" />
          {/* Right Exterior Mass Wall with Upper Cantilever */}
          <rect x="715" y="140" width="50" height="175" fill={`url(#earthLayers-${filterId})`} stroke="var(--drafting-ink)" strokeWidth="1.5" />

          {/* First Floor RCC Slab (+3.60M) */}
          <rect x="90" y="130" width="720" height="16" fill="var(--drafting-surface-tint)" stroke="var(--drafting-ink)" strokeWidth="1.5" />
          <text x="815" y="142" fill="var(--accent)" fontSize="9" fontFamily="monospace">
            +3.60M SLAB
          </text>

          {/* Sloped Timber Eave / Clay Tile Roof with Clerestory (+6.80M) */}
          <polygon points="70,120 200,60 400,60 400,120" fill="var(--drafting-surface)" stroke="var(--drafting-graphite)" strokeWidth="1.5" />
          <polygon points="500,120 500,60 700,60 830,120" fill="var(--drafting-surface)" stroke="var(--drafting-graphite)" strokeWidth="1.5" />
          {/* Central Roof Lantern / Chimney Vent over Courtyard */}
          <polygon points="380,60 450,25 520,60" fill="var(--drafting-surface-tint)" stroke="var(--accent)" strokeWidth="1.5" />

          {/* Open Sky Courtyard Core (Between X=400 and X=500) */}
          {/* Courtyard Sunken Water Basin */}
          <rect x="420" y="300" width="60" height="15" fill="var(--drafting-surface-tint)" stroke="var(--drafting-graphite)" strokeWidth="1" />
          <text x="450" y="325" fill="var(--accent)" fontSize="9" fontFamily="monospace" textAnchor="middle">
            MUTRAM BASIN
          </text>

          {/* ARCHITECTURAL LAYER: Spatial Atmosphere, Light & Void */}
          <g style={{ opacity: 0.15 + archWeight * 0.85, transition: 'opacity 0.25s ease' }}>
            {/* Sunbeam pouring through courtyard lantern */}
            <polygon
              points="430,30 470,30 520,300 380,300"
              fill={`url(#lightBeamGrad-${filterId})`}
            />

            {/* Courtyard Natural Airflow Loop */}
            <g stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 4" fill="none">
              <path d="M 220 280 L 340 280 L 440 290" />
              <path d="M 450 290 L 450 60" />
              <path d="M 680 280 L 560 280 L 460 290" />
            </g>

            {/* Spatial Annotations */}
            <text x="450" y="110" fill="var(--accent)" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              OPEN SKY VOID (CLIMATIC CORE)
            </text>
            <text x="240" y="220" fill="var(--drafting-ink)" fontSize="10" fontFamily="monospace">
              LIVING ATELIER • 3.0M CLEAR
            </text>
            <text x="560" y="220" fill="var(--drafting-ink)" fontSize="10" fontFamily="monospace">
              PRIVATE SANCTUARY
            </text>
          </g>

          {/* STRUCTURAL ENGINEERING LAYER: Load Paths, Vectors & Bending Moments */}
          <g style={{ opacity: 0.15 + engWeight * 0.85, transition: 'opacity 0.25s ease' }}>
            {/* Gravity Compression Vectors (Dead + Live Loads) */}
            <line x1="160" y1="150" x2="160" y2="310" stroke="var(--accent)" strokeWidth={2 + engWeight * 2} markerEnd={`url(#loadArrow-${filterId})`} />
            <line x1="375" y1="150" x2="375" y2="310" stroke="var(--accent)" strokeWidth={2 + engWeight * 2} markerEnd={`url(#loadArrow-${filterId})`} />
            <line x1="740" y1="150" x2="740" y2="310" stroke="var(--accent)" strokeWidth={2 + engWeight * 2} markerEnd={`url(#loadArrow-${filterId})`} />

            {/* Foundation Load Transfer into Granite */}
            <line x1="160" y1="330" x2="160" y2="370" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="2 2" />
            <line x1="375" y1="330" x2="375" y2="370" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="2 2" />
            <line x1="740" y1="330" x2="740" y2="370" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="2 2" />

            {/* Sagging moment envelope across the first floor slab */}
            <path
              d="M 90 138 Q 230 148 375 138 Q 550 148 720 138"
              fill="none"
              stroke="var(--drafting-graphite)"
              strokeWidth={1.5 + engWeight * 1.5}
              strokeDasharray="4 2"
            />

            {/* Engineering Callouts */}
            <text x="165" y="240" fill="var(--accent)" fontSize="10" fontFamily="monospace">
              AXIAL LOAD: 210 kN/m
            </text>
            <text x="380" y="240" fill="var(--accent)" fontSize="10" fontFamily="monospace">
              COMPRESSION: 185 kN/m
            </text>
            <text x="540" y="125" fill="var(--drafting-graphite)" fontSize="9" fontFamily="monospace">
              SAGGING MOMENT ENVELOPE • RCC SLAB
            </text>
          </g>

          {/* Equilibrium Status Indicator (Visible when balanced between 40 and 60) */}
          {balance >= 40 && balance <= 60 && (
            <g transform="translate(450, 200)">
              <rect x="-85" y="-16" width="170" height="32" rx="0" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.5" />
              <text x="0" y="4" fill="var(--accent)" fontSize="11" fontFamily="monospace" fontWeight="800" textAnchor="middle">
                SYNTHESIS EQUILIBRIUM
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Scrubber Controls */}
      <div className={styles.sliderTrackArea}>
        <div className={styles.labelsRow}>
          <button
            type="button"
            className={styles.presetLink}
            onClick={() => setBalance(0)}
          >
            Spatial Architecture (0%)
          </button>
          <button
            type="button"
            className={styles.presetLink}
            onClick={() => setBalance(50)}
          >
            ASTHIWAR Equilibrium (50%)
          </button>
          <button
            type="button"
            className={styles.presetLink}
            onClick={() => setBalance(100)}
          >
            Structural Engineering (100%)
          </button>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={balance}
          onChange={(e) => setBalance(Number(e.target.value))}
          className={styles.sliderInput}
          aria-label="Balance scrubber between architectural atmosphere and structural engineering vectors"
        />
      </div>

      {/* Contextual Technical Exposition */}
      <p className={styles.resolutionNote}>
        {balance < 35 && (
          <span>
            <strong>Atmospheric Primacy:</strong> The section emphasizes daylight ingress through the central Mutram, continuous passive air suction, and deep 1.8m shade eaves, keeping living spaces chilled naturally without mechanical compressor refrigeration.
          </span>
        )}
        {balance >= 35 && balance <= 65 && (
          <span>
            <strong>The ASTHIWAR Equilibrium:</strong> Spatial volume and structural integrity conceived as a single act. Monolithic 300mm stabilised rammed earth walls carry RCC floor plates directly onto stepped granite footings, so load runs straight to ground with no transfer beams.
          </span>
        )}
        {balance > 65 && (
          <span>
            <strong>Structural Rigor:</strong> Complete load-path discipline. 185–210 kN/m axial gravity loads pass continuously from roof rafter pins down through rammed earth mass directly into Coimbatore bedrock, yielding Zone III seismic safety with 60% lower embodied carbon.
          </span>
        )}
      </p>
    </div>
  );
}
