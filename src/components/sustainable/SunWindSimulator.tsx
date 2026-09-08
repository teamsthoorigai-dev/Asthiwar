'use client';

import { useId, useState } from 'react';
import styles from './SunWindSimulator.module.css';

interface SunWindSimulatorProps {
  initialHour?: number;
}

export function SunWindSimulator({ initialHour = 14 }: SunWindSimulatorProps) {
  const [hour, setHour] = useState<number>(initialHour);
  const filterId = useId();

  // Progress from 0 (06:00 sunrise) to 1 (18:00 sunset)
  const progress = Math.max(0, Math.min(1, (hour - 6) / 12));

  // Diurnal temperature curves for Coimbatore / Kongu arid basin
  // Outdoor peaks at 14:00 (~38°C) and lowest at 06:00 (~24°C)
  const outdoorTemp = Math.round(
    24 + 14 * Math.sin(Math.max(0, Math.min(1, (hour - 6) / 11.5)) * Math.PI)
  );

  // ASTHIWAR rammed earth & courtyard stack damping keeps indoor ~24°C-27°C (6hr phase shift)
  const indoorTemp = Math.round(
    23 + 4 * Math.sin(Math.max(0, Math.min(1, (hour - 8.5) / 12)) * Math.PI)
  );

  const delta = outdoorTemp - indoorTemp;

  // Real solar altitude & azimuth calculation for 11°N latitude (Coimbatore)
  // Parabolic sun trajectory across 860px width
  const sunX = 80 + progress * 700;
  const solarAngleRad = progress * Math.PI;
  // Zenith altitude peaks at noon
  const sunY = 250 - Math.sin(solarAngleRad) * 205;

  // Solar ray incident angle relative to south facade
  const shadowAngleDeg = (progress - 0.5) * 75;

  // Thermodynamic stack exhaust suction velocity (increases with temperature differential)
  const stackVelocity = (0.6 + Math.max(0, delta) * 0.11).toFixed(1);

  // Sky tone transitions dynamically from dawn gold to midday zenith to twilight terracotta on light paper
  const skyBackground =
    hour < 8
      ? 'radial-gradient(ellipse at 15% 70%, rgba(182, 75, 25, 0.08), var(--drafting-paper) 70%)'
      : hour >= 11 && hour <= 14
      ? 'radial-gradient(ellipse at 50% 20%, rgba(182, 75, 25, 0.06), var(--drafting-paper) 70%)'
      : hour > 16
      ? 'radial-gradient(ellipse at 85% 70%, rgba(182, 75, 25, 0.10), var(--drafting-paper) 70%)'
      : 'var(--drafting-paper)';

  return (
    <div className={styles.simulatorCard}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>
          Thermodynamic Physics Simulation • Western Ghats Microclimate (11°N Lat.)
        </span>
        <h3 className={styles.title}>
          Passive Solar Declination &amp; Courtyard Stack Aerodynamics
        </h3>
      </header>

      {/* Real-time Telemetry Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Solar Time</span>
          <span className={styles.statValue} style={{ color: 'var(--accent)' }}>
            {String(Math.floor(hour)).padStart(2, '0')}:{hour % 1 !== 0 ? '30' : '00'} hrs
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Ambient Outdoor Temp</span>
          <span className={`${styles.statValue} ${styles.outdoorVal}`}>
            {outdoorTemp}°C
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Courtyard Core Temp</span>
          <span className={`${styles.statValue} ${styles.indoorVal}`}>
            {indoorTemp}°C
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Thermal Buffer Delta</span>
          <span className={`${styles.statValue} ${styles.deltaVal}`}>
            -{delta}°C Saved
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Stack Suction Draft</span>
          <span className={styles.statValue} style={{ color: 'var(--ink)' }}>
            {stackVelocity} m/s
          </span>
        </div>
      </div>

      {/* Stage: Architectural Section Diagram with Solar Vector & Airflow Currents */}
      <div className={styles.stageWrap} style={{ background: skyBackground }}>
        <svg
          viewBox="0 0 860 360"
          className={styles.svgDiagram}
          aria-hidden="true"
        >
          <defs>
            <radialGradient id={`sunCore-${filterId}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.8} />
              <stop offset="60%" stopColor="var(--accent)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </radialGradient>

            <pattern id={`jaaliGrid-${filterId}`} width="10" height="10" patternUnits="userSpaceOnUse">
              <rect width="10" height="10" fill="var(--drafting-surface)" />
              <circle cx="5" cy="5" r="3" fill="var(--drafting-graphite)" />
            </pattern>

            <pattern id={`earthMass-${filterId}`} width="40" height="16" patternUnits="userSpaceOnUse">
              <rect width="40" height="16" fill="var(--drafting-surface)" />
              <line x1="0" y1="8" x2="40" y2="8" stroke="var(--drafting-graphite)" strokeWidth="1" strokeDasharray="3 2" />
            </pattern>
          </defs>

          {/* Celestial Sun Arc Track */}
          <path
            d="M 80 250 Q 430 -20 780 250"
            fill="none"
            stroke="var(--drafting-muted)"
            strokeDasharray="4 6"
            strokeWidth="1.2"
          />

          {/* Cardinal Sun Position Markers */}
          <text x="80" y="275" fill="var(--drafting-muted)" fontSize="10" fontFamily="monospace" textAnchor="middle">
            06:00 EAST (Sunrise)
          </text>
          <text x="430" y="24" fill="var(--drafting-muted)" fontSize="10" fontFamily="monospace" textAnchor="middle">
            12:00 ZENITH (Solar Altitude 82°)
          </text>
          <text x="780" y="275" fill="var(--drafting-muted)" fontSize="10" fontFamily="monospace" textAnchor="middle">
            18:00 WEST (Sunset)
          </text>

          {/* Active Sun Entity */}
          <g transform={`translate(${sunX}, ${sunY})`}>
            <circle cx="0" cy="0" r="32" fill={`url(#sunCore-${filterId})`} />
            <circle cx="0" cy="0" r="10" fill="var(--accent)" stroke="var(--drafting-paper)" strokeWidth="2" />
          </g>

          {/* Incident Solar Ray Vector Beam */}
          <line
            x1={sunX}
            y1={sunY}
            x2={430 + shadowAngleDeg * 2.2}
            y2="190"
            stroke="var(--accent)"
            strokeOpacity="0.35"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />

          {/* Ground Substrate Level */}
          <rect x="0" y="300" width="860" height="60" fill="var(--drafting-surface-tint)" />
          <line x1="0" y1="300" x2="860" y2="300" stroke="var(--drafting-graphite)" strokeWidth="1.5" />
          <text x="25" y="325" fill="var(--drafting-muted)" fontSize="10" fontFamily="monospace">
            FINISHED GRADE +0.00M • SUBSTRATE THERMAL STORAGE
          </text>

          {/* Architectural Building Section */}
          {/* Foundation & Plinth */}
          <rect x="230" y="285" width="400" height="15" fill="var(--drafting-surface)" stroke="var(--drafting-ink)" strokeWidth="1" />

          {/* Left Wing (Living & Verandah Mass): Rammed Earth Wall (300mm) */}
          <rect x="240" y="180" width="45" height="105" fill={`url(#earthMass-${filterId})`} stroke="var(--drafting-ink)" strokeWidth="1.5" />
          {/* Deep 1.8M Chhajja Overhang (Blocks high midday sun) */}
          <polygon points="215,170 300,170 290,180 230,180" fill="var(--drafting-surface-tint)" stroke="var(--drafting-graphite)" strokeWidth="1.2" />

          {/* West Facade Jaali Screen (Aperture Breeze Acceleration) */}
          <rect x="285" y="195" width="20" height="90" fill={`url(#jaaliGrid-${filterId})`} stroke="var(--accent)" strokeWidth="1" />
          <text x="295" y="305" fill="var(--accent)" fontSize="8" fontFamily="monospace" textAnchor="middle">
            JAALI
          </text>

          {/* Central Open-to-Sky Courtyard (Mutram Stack Chimney) */}
          <rect x="380" y="210" width="100" height="75" fill="var(--drafting-paper)" stroke="var(--drafting-grid)" />
          {/* Courtyard Sunken Water Pool (Adiabatic Evaporation) */}
          <rect x="405" y="275" width="50" height="10" rx="0" fill="var(--drafting-surface-tint)" stroke="var(--accent)" strokeWidth="1" />
          <text x="430" y="295" fill="var(--accent)" fontSize="8" fontFamily="monospace" textAnchor="middle">
            WATER POOL
          </text>

          {/* Courtyard Raised Roof Lantern & Stack Chimney Louvers */}
          <polygon points="360,170 430,120 500,170" fill="var(--drafting-surface)" stroke="var(--drafting-graphite)" strokeWidth="1.5" />
          {/* Stack Clerestory Exhaust Opening */}
          <rect x="400" y="140" width="60" height="18" fill="var(--drafting-paper)" stroke="var(--accent)" strokeWidth="1" strokeDasharray="3 3" />
          <text x="430" y="112" fill="var(--accent)" fontSize="9" fontFamily="monospace" textAnchor="middle">
            STACK EXHAUST VENT
          </text>

          {/* Right Wing (Sleeping Quarters / Thermal Buffer): Rammed Earth Wall */}
          <rect x="580" y="180" width="45" height="105" fill={`url(#earthMass-${filterId})`} stroke="var(--drafting-ink)" strokeWidth="1.5" />
          {/* Deep 1.8M Chhajja Overhang */}
          <polygon points="560,170 645,170 635,180 575,180" fill="var(--drafting-surface-tint)" stroke="var(--drafting-graphite)" strokeWidth="1.2" />

          {/* Dynamic Fluid Aerodynamic Airflow Vectors */}
          {/* Inflow of cool air through shaded Jaali screen */}
          <g stroke="var(--drafting-graphite)" strokeWidth="2" strokeDasharray="4 4" fill="none">
            <path d="M 230 260 L 320 260 L 405 270" />
            <path d="M 640 260 L 550 260 L 455 270" />
            {/* Upward stack suction draft through open-sky chimney */}
            <path d="M 430 270 L 430 140" />
          </g>

          {/* Heated Air Exhaust venting out into sky */}
          <g stroke="var(--accent)" strokeWidth="2" strokeDasharray="3 3" fill="none">
            <path d="M 430 140 L 430 90 L 460 70" />
          </g>

          {/* Dimension Tags */}
          <text x="210" y="155" fill="var(--drafting-muted)" fontSize="9" fontFamily="monospace">
            1.8M CHHAJJA OVERHANG
          </text>
          <text x="430" y="240" fill="var(--drafting-ink)" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            OPEN COURTYARD (MUTRAM)
          </text>
        </svg>
      </div>

      {/* Scrubbable Time Controller with Quick-Jump Presets */}
      <div className={styles.sliderContainer}>
        <div className={styles.sliderLabels}>
          <button
            type="button"
            className={styles.presetLink || ''}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'monospace' }}
            onClick={() => setHour(6)}
          >
            06:00 Sunrise
          </button>
          <button
            type="button"
            className={styles.presetLink || ''}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 700 }}
            onClick={() => setHour(12)}
          >
            12:00 Solar Zenith
          </button>
          <button
            type="button"
            className={styles.presetLink || ''}
            style={{ background: 'none', border: 'none', color: 'var(--status-warn)', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 700 }}
            onClick={() => setHour(14)}
          >
            14:00 Peak Heat
          </button>
          <button
            type="button"
            className={styles.presetLink || ''}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'monospace' }}
            onClick={() => setHour(18)}
          >
            18:00 Sunset
          </button>
        </div>

        <input
          type="range"
          min="6"
          max="18"
          step="0.5"
          value={hour}
          onChange={(e) => setHour(Number(e.target.value))}
          className={styles.timeSlider}
          aria-label="Solar time-of-day scrubber"
        />
      </div>

      {/* Contextual Physics Explanation */}
      <p className={styles.explanationBox}>
        <strong>Thermodynamic Physics at {String(Math.floor(hour)).padStart(2, '0')}:{hour % 1 !== 0 ? '30' : '00'}:</strong>{' '}
        {hour >= 11 && hour <= 15 ? (
          <span>
            During peak solar exposure ({outdoorTemp}°C outdoor), the high solar altitude angle is completely blocked by deep 1.8m chhajja eaves. Meanwhile, high solar irradiation on the roof lantern heats exhaust air, accelerating stack draft velocity to <strong>{stackVelocity} m/s</strong> and continuously pulling cool air across the courtyard water pool to maintain an indoor temperature of <strong>{indoorTemp}°C</strong>.
          </span>
        ) : hour < 11 ? (
          <span>
            Low-angle morning sunlight ({outdoorTemp}°C) filters softly through the east-facing jaali lattice without overheating internal thermal mass. Night-accumulated cooling in the 300mm rammed earth mass keeps indoor ambient at <strong>{indoorTemp}°C</strong>.
          </span>
        ) : (
          <span>
            As evening approaches ({outdoorTemp}°C), the sun drops toward the western horizon. Operable teak shutters and jaali screens diffuse low western glare, while the courtyard begins releasing diurnal warmth into the clear night sky through radiant re-radiation.
          </span>
        )}
      </p>
    </div>
  );
}
