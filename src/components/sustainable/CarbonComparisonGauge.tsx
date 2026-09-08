'use client';

import { useState } from 'react';
import styles from './CarbonComparisonGauge.module.css';

interface CarbonComparisonGaugeProps {
  initialAreaSqFt?: number;
}

export function CarbonComparisonGauge({
  initialAreaSqFt = 3200,
}: CarbonComparisonGaugeProps) {
  const [areaSqFt, setAreaSqFt] = useState<number>(initialAreaSqFt);

  // Conversion: 1 sq.ft = 0.092903 m²
  const areaM2 = Math.round(areaSqFt * 0.092903);

  // Embodied Carbon Benchmarks (kg CO₂e / m² of built floor area)
  // Conventional RCC with Portland Cement & Kiln Bricks: 420 kg CO₂e / m²
  // ASTHIWAR Vernacular (Rammed Earth, Lime Stucco, Local Stone): 168 kg CO₂e / m²
  const conventionalKgPerM2 = 420;
  const asthivarKgPerM2 = 168;

  const conventionalTotalTonnes = (areaM2 * conventionalKgPerM2) / 1000;
  const asthivarTotalTonnes = (areaM2 * asthivarKgPerM2) / 1000;
  const carbonSavedTonnes = conventionalTotalTonnes - asthivarTotalTonnes;

  // Real-world environmental equivalencies
  const treesEquiv = Math.round((carbonSavedTonnes * 1000) / 22); // 1 mature tree absorbs ~22kg CO2/year
  const flightsEquiv = Math.round((carbonSavedTonnes * 1000) / 380); // 1 domestic passenger flight segment ~380kg CO2

  return (
    <div className={styles.gaugeCard}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>
          Embodied Carbon Audit • Cradle-to-Gate Life Cycle Assessment
        </span>
        <h3 className={styles.title}>
          Structural Carbon Intensity: ASTHIWAR vs. Standard RCC
        </h3>
        <p className={styles.subtitle}>
          Standard construction relies on high-calcination Portland cement and fossil-fired
          brick kilns. ASTHIWAR replaces structural mass with stabilized rammed earth and
          slaked lime, sequestering carbon and reducing structural footprint by 60%.
        </p>
      </header>

      {/* Interactive Built-up Area Scrubber */}
      <div className={styles.sliderSection}>
        <div className={styles.sliderHeader}>
          <span className={styles.sliderLabel}>Project Built-up Footprint</span>
          <span className={styles.sliderValue}>
            {areaSqFt.toLocaleString()} sq.ft{' '}
            <span className={styles.sliderMetricUnit}>
              ({areaM2} m²)
            </span>
          </span>
        </div>
        <input
          type="range"
          min="1200"
          max="8000"
          step="100"
          value={areaSqFt}
          onChange={(e) => setAreaSqFt(Number(e.target.value))}
          className={styles.areaSlider}
          aria-label="Built-up floor area slider"
        />
      </div>

      {/* Comparative Carbon Bars */}
      <div className={styles.barsComparison}>
        <div className={styles.barGroup}>
          <div className={styles.barMeta}>
            <span className={styles.barLabel}>
              Standard RCC Construction (Portland Cement + Wire-Cut Bricks)
            </span>
            <span className={`${styles.barIntensity} ${styles.conventionalIntensity}`}>
              420 kg CO₂e / m² · {conventionalTotalTonnes.toFixed(1)} t Total
            </span>
          </div>
          <div className={styles.barTrack}>
            <div className={styles.barFillConventional} style={{ width: '100%' }}>
              100% Baseline
            </div>
          </div>
        </div>

        <div className={styles.barGroup}>
          <div className={styles.barMeta}>
            <span className={styles.barLabel}>
              ASTHIWAR Vernacular Core (Stabilized Earth + Lime Stucco + Local Granite)
            </span>
            <span className={`${styles.barIntensity} ${styles.asthivarIntensity}`}>
              168 kg CO₂e / m² · {asthivarTotalTonnes.toFixed(1)} t Total
            </span>
          </div>
          <div className={styles.barTrack}>
            <div className={styles.barFillAsthivar} style={{ width: '40%' }}>
              -60% Carbon Footprint
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Environmental Savings Metrics */}
      <div className={styles.impactMetrics}>
        <div className={styles.impactCard}>
          <span className={styles.impactNumber}>
            {carbonSavedTonnes.toFixed(1)}
            <span style={{ fontSize: '1rem', fontWeight: 600 }}> tonnes</span>
          </span>
          <span className={styles.impactLabel}>
            Total Net Carbon Prevented from entering the atmosphere during construction.
          </span>
        </div>

        <div className={styles.impactCard}>
          <span className={styles.impactNumber}>{treesEquiv.toLocaleString()}</span>
          <span className={styles.impactLabel}>
            Equivalent annual CO₂ absorption of mature urban forestry trees.
          </span>
        </div>

        <div className={styles.impactCard}>
          <span className={styles.impactNumber}>{flightsEquiv.toLocaleString()}</span>
          <span className={styles.impactLabel}>
            Equivalent domestic passenger flight emissions completely averted.
          </span>
        </div>
      </div>

      {/* Material Specification Breakdown */}
      <div className={styles.materialFootprintGrid}>
        <div className={styles.footprintCol}>
          <h4 className={`${styles.footprintTitle} ${styles.footprintTitleConventional}`}>
            Conventional High-Carbon Assembly
          </h4>
          <ul className={styles.footprintList}>
            <li>
              <span>Portland Pozzolana Cement</span>
              <strong className={styles.conventionalValue}>820 kg CO₂ / tonne</strong>
            </li>
            <li>
              <span>High-Kiln Wire Cut Bricks</span>
              <strong className={styles.conventionalValue}>260 kg CO₂ / 1000 units</strong>
            </li>
            <li>
              <span>Synthetic Acrylic Wall Paints</span>
              <strong className={styles.conventionalValue}>High VOC &amp; Off-gassing</strong>
            </li>
            <li>
              <span>Structural Steel Rebar</span>
              <strong className={styles.conventionalValue}>1,800 kg CO₂ / tonne</strong>
            </li>
          </ul>
        </div>

        <div className={styles.footprintCol}>
          <h4 className={`${styles.footprintTitle} ${styles.footprintTitleAsthivar}`}>
            ASTHIWAR Low-Carbon Assembly
          </h4>
          <ul className={styles.footprintList}>
            <li>
              <span>Excavated On-Site Earth Walls</span>
              <strong className={styles.asthivarValue}>28 kg CO₂ / tonne (-96%)</strong>
            </li>
            <li>
              <span>Aged Slaked Lime Mortar</span>
              <strong className={styles.asthivarValue}>Reabsorbs CO₂ as it cures</strong>
            </li>
            <li>
              <span>Natural Mineral Pigment Washes</span>
              <strong className={styles.asthivarValue}>Zero VOC &amp; Vapor-open</strong>
            </li>
            <li>
              <span>Salvaged Teak &amp; Regional Granite</span>
              <strong className={styles.asthivarValue}>Zero Long-haul Freight</strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
