'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import styles from './BlueprintCurtain.module.css';

export function BlueprintCurtain() {
  // 0 = 100% Finished Reality, 50 = Split, 100 = 100% CAD Blueprint
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const x = clientX - rect.left;
    // Uncapped: full 0% to 100% travel across the entire canvas
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || !e.touches[0]) return;
      handleMove(e.touches[0].clientX);
    },
    [isDragging, handleMove],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    },
    [isDragging, handleMove],
  );

  const stopDragging = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', stopDragging);
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('touchend', stopDragging);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDragging);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', stopDragging);
    };
  }, [isDragging, handleMouseMove, handleTouchMove, stopDragging]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSliderPos((prev) => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSliderPos((prev) => Math.min(100, prev + 5));
    }
  };

  return (
    <section className={styles.curtainSection} aria-labelledby="curtain-title">
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Precision Structural Coordination</p>
          <div className={styles.titleRow}>
            <h2 id="curtain-title" className={styles.title}>
              Blueprint to reality. Drawn once, built right.
            </h2>
            <div className={styles.presets} role="group" aria-label="Comparison presets">
              <button
                type="button"
                className={[styles.presetBtn, sliderPos <= 5 && styles.presetActive].filter(Boolean).join(' ')}
                onClick={() => setSliderPos(0)}
              >
                Finished (0%)
              </button>
              <button
                type="button"
                className={[
                  styles.presetBtn,
                  sliderPos >= 42 && sliderPos <= 58 && styles.presetActive,
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setSliderPos(50)}
              >
                Split (50%)
              </button>
              <button
                type="button"
                className={[styles.presetBtn, sliderPos >= 95 && styles.presetActive].filter(Boolean).join(' ')}
                onClick={() => setSliderPos(100)}
              >
                CAD Blueprint (100%)
              </button>
            </div>
          </div>
        </header>

        {/* Interactive Comparison Stage */}
        <div
          ref={stageRef}
          className={styles.stage}
          onMouseDown={(e) => {
            setIsDragging(true);
            handleMove(e.clientX);
          }}
          onTouchStart={(e) => {
            if (e.touches[0]) {
              setIsDragging(true);
              handleMove(e.touches[0].clientX);
            }
          }}
          role="slider"
          aria-label="Blueprint to finished construction comparison slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(sliderPos)}
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          {/* Background: Photorealistic Luxury Reality */}
          <div className={styles.realityLayer}>
            <Image
              src="/images/asthivar-villa.jpg"
              alt="Completed luxury tropical stone villa with illuminated courtyard and reflecting pool"
              fill
              sizes="(min-width: 1024px) 80vw, 100vw"
              className={styles.realityImage}
              priority
            />
          </div>

          {/* Foreground: CAD Architectural Blueprint (Clipped) */}
          <div
            className={styles.blueprintLayer}
            style={{
              clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
            }}
          >
            <svg
              className={styles.blueprintSvg}
              viewBox="0 0 1600 900"
              preserveAspectRatio="xMidYMid slice"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="cad-grid-fine" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--drafting-grid)" strokeWidth="0.8" />
                </pattern>
                <pattern id="cad-grid-major" width="100" height="100" patternUnits="userSpaceOnUse">
                  <rect width="100" height="100" fill="url(#cad-grid-fine)" />
                  <path d="M 100 0 L 0 0 0 100" fill="none" stroke="var(--drafting-grid-major)" strokeWidth="1.2" />
                </pattern>
                <pattern id="earth-hatch" width="16" height="16" patternUnits="userSpaceOnUse">
                  <path d="M0 16 L16 0 M-4 4 L4 -4 M12 20 L20 12" stroke="var(--drafting-hatch)" strokeWidth="1" />
                </pattern>
                <pattern id="louver-pattern" width="8" height="24" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="8" y2="0" stroke="var(--accent)" strokeWidth="1.5" />
                  <line x1="0" y1="12" x2="8" y2="12" stroke="var(--accent)" strokeWidth="1.5" />
                </pattern>
                <marker id="dim-arrow-start" viewBox="0 0 10 10" refX="0" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <polygon points="10,2 0,5 10,8" fill="var(--drafting-graphite)" />
                </marker>
                <marker id="dim-arrow-end" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <polygon points="0,2 10,5 0,8" fill="var(--drafting-graphite)" />
                </marker>
              </defs>

              {/* CAD Background Blueprint Field: Warm Drafting Paper */}
              <rect width="1600" height="900" fill="var(--drafting-surface)" />
              <rect width="1600" height="900" fill="url(#cad-grid-major)" />

              {/* Subsoil & Piling Stratum */}
              <rect x="0" y="740" width="1600" height="160" fill="url(#earth-hatch)" />
              <line x1="0" y1="740" x2="1600" y2="740" stroke="var(--drafting-muted)" strokeWidth="1.5" />
              <text x="60" y="775" fill="var(--drafting-muted)" fontFamily="monospace" fontSize="12" letterSpacing="1">
                CHARNOCKITE BEDROCK • SBC TO BE CONFIRMED BY SOIL TEST
              </text>

              {/* Foundation Piles & Grade Beams */}
              <g stroke="var(--drafting-ink)" strokeWidth="1.5" fill="none">
                <rect x="280" y="660" width="40" height="140" strokeDasharray="4 2" />
                <rect x="560" y="660" width="40" height="140" strokeDasharray="4 2" />
                <rect x="880" y="660" width="40" height="140" strokeDasharray="4 2" />
                <rect x="1200" y="660" width="40" height="140" strokeDasharray="4 2" />
              </g>

              {/* Reflection Pool Water Level Datum (+0.00M) */}
              <line x1="180" y1="640" x2="1420" y2="640" stroke="var(--drafting-graphite)" strokeWidth="2" strokeDasharray="6 3" />
              <text x="200" y="630" fill="var(--drafting-graphite)" fontFamily="monospace" fontSize="11">
                REFLECTING WATER SURFACE: +0.00M DATUM
              </text>

              {/* Ground Floor Finished Plinth Level (+0.60M) */}
              <rect x="240" y="580" width="1120" height="60" fill="var(--drafting-poché)" stroke="var(--drafting-ink)" strokeWidth="2" />
              <text x="260" y="570" fill="var(--drafting-ink)" fontFamily="monospace" fontSize="11">
                GROUND PLINTH: +0.60M [100MM GRANITE PAVING]
              </text>

              {/* Structural Column Grids (C1, C2, C3, C4) */}
              <g stroke="var(--drafting-grid-major)" strokeWidth="1" strokeDasharray="6 6">
                <line x1="300" y1="120" x2="300" y2="660" />
                <line x1="580" y1="120" x2="580" y2="660" />
                <line x1="900" y1="120" x2="900" y2="660" />
                <line x1="1220" y1="120" x2="1220" y2="660" />
              </g>

              {/* Grid Column Axis Bubbles */}
              <g fill="var(--drafting-paper)" stroke="var(--drafting-graphite)" strokeWidth="1.5">
                <circle cx="300" cy="110" r="16" />
                <circle cx="580" cy="110" r="16" />
                <circle cx="900" cy="110" r="16" />
                <circle cx="1220" cy="110" r="16" />
              </g>
              <g fill="var(--drafting-ink)" fontFamily="monospace" fontSize="12" fontWeight="bold" textAnchor="middle">
                <text x="300" y="115">A1</text>
                <text x="580" y="115">B2</text>
                <text x="900" y="115">C3</text>
                <text x="1220" y="115">D4</text>
              </g>

              {/* Ground Floor Glazing & Living Core */}
              <rect x="300" y="400" width="560" height="180" fill="var(--drafting-grid)" stroke="var(--drafting-ink)" strokeWidth="2" />
              {/* Window Mullions */}
              <line x1="440" y1="400" x2="440" y2="580" stroke="var(--drafting-grid-major)" strokeWidth="1" />
              <line x1="580" y1="400" x2="580" y2="580" stroke="var(--drafting-grid-major)" strokeWidth="1" />
              <line x1="720" y1="400" x2="720" y2="580" stroke="var(--drafting-grid-major)" strokeWidth="1" />

              {/* First Floor Cantilevered Slab (+3.60M) */}
              <rect x="240" y="375" width="1120" height="25" fill="var(--drafting-surface-tint)" stroke="var(--drafting-ink)" strokeWidth="2" />
              <text x="260" y="365" fill="var(--drafting-ink)" fontFamily="monospace" fontSize="11">
                LEVEL 01 SLAB: +3.60M • RCC TWO-WAY SLAB
              </text>

              {/* First Floor Upper Mass & Timber Louvers */}
              <rect x="320" y="210" width="540" height="165" fill="var(--drafting-grid)" stroke="var(--drafting-ink)" strokeWidth="2" />
              {/* Right Bedroom Suite with Timber Louver Screen (Emphasised Accent) */}
              <rect x="880" y="210" width="400" height="165" fill="url(#louver-pattern)" stroke="var(--accent)" strokeWidth="2" />
              <text x="900" y="200" fill="var(--accent)" fontFamily="monospace" fontSize="11">
                OPERABLE TEAK LOUVER SCREEN (BRISE-SOLEIL)
              </text>

              {/* Roof Cantilever & Parapet Datum (+7.20M) */}
              <polygon points="200,205 1380,205 1360,185 220,185" fill="var(--drafting-surface-tint)" stroke="var(--drafting-ink)" strokeWidth="2.5" />
              <text x="230" y="175" fill="var(--drafting-ink)" fontFamily="monospace" fontSize="11">
                ROOF CANTILEVER PARAPET: +7.20M [2,100MM OVERHANG]
              </text>

              {/* Engineering Dimension String */}
              <g stroke="var(--drafting-graphite)" strokeWidth="1.5">
                {/* Overall Dimension */}
                <line x1="300" y1="690" x2="1220" y2="690" markerStart="url(#dim-arrow-start)" markerEnd="url(#dim-arrow-end)" />
                <line x1="300" y1="675" x2="300" y2="705" />
                <line x1="1220" y1="675" x2="1220" y2="705" />
              </g>
              <text x="760" y="684" fill="var(--drafting-ink)" fontFamily="monospace" fontSize="12" fontWeight="bold" textAnchor="middle">
                OVERALL WIDTH: 16,800 MM • 4 BAYS @ 4,200
              </text>

              {/* CAD Cartouche (Title Block) */}
              <g transform="translate(1180, 770)">
                <rect width="360" height="90" fill="var(--drafting-paper)" stroke="var(--drafting-ink)" strokeWidth="1.5" />
                <text x="15" y="25" fill="var(--drafting-ink)" fontFamily="monospace" fontSize="11" fontWeight="bold">
                  ASTHIWAR ARCHITECTURAL ATELIER
                </text>
                <text x="15" y="45" fill="var(--drafting-graphite)" fontFamily="monospace" fontSize="10">
                  PROJECT: COIMBATORE RESIDENCE #04
                </text>
                <text x="15" y="62" fill="var(--drafting-muted)" fontFamily="monospace" fontSize="9">
                  COORD: 11°00&apos;24&quot;N • 76°57&apos;18&quot;E • ELEV. 411M
                </text>
                <text x="15" y="78" fill="var(--accent)" fontFamily="monospace" fontSize="9">
                  SHEET: A-104 • STRUCTURAL ELEVATION REV.06
                </text>
              </g>
            </svg>
          </div>

          {/* Badges */}
          <div className={styles.badgeLeft}>
            <span className={styles.statusDot} />
            <span>CAD Architectural Drawing</span>
          </div>
          <div className={styles.badgeRight}>
            <span className={styles.statusDot} />
            <span>Finished Villa Reality</span>
          </div>

          {/* Draggable Divider Line & Knob */}
          <div className={styles.divider} style={{ left: `${sliderPos}%` }}>
            <div
              className={[styles.handle, isDragging && styles.handleActive].filter(Boolean).join(' ')}
              aria-hidden="true"
            >
              <svg className={styles.handleIcon} viewBox="0 0 24 24">
                <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" />
              </svg>
            </div>
          </div>
        </div>

        <div className={styles.captionRow}>
          <span>Drag handle horizontally (0% to 100%) to inspect structural CAD coordination against completed reality</span>
          <span className={styles.captionDetails}>SLAB LEVEL TOLERANCE TO IS 456 • ONE COORDINATED DRAWING SET</span>
        </div>
      </div>
    </section>
  );
}
