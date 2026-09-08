'use client';

import Image from 'next/image';
import { useState } from 'react';
import styles from './MaterialSwatchDrawer.module.css';

type Swatch = {
  id: string;
  name: string;
  origin: string;
  image: string;
  highlight: string;
  fullDesc: string;
  metrics: {
    thermalMass: string;
    embodiedCarbon: string;
    durability: string;
    breathability: string;
  };
};

const SWATCHES: readonly Swatch[] = [
  {
    id: 'rammed-earth',
    name: 'Stabilized Rammed Earth',
    origin: 'Quarried Western Ghats Soil',
    image: '/images/sustainable.jpg',
    highlight: '60% lower embodied carbon than standard brickwork.',
    fullDesc:
      'Compacted subsoil stabilized with 6% lime and hydraulic binders. Rammed in 150mm lifts inside timber formwork to produce dense monolithic walls that store night coolness and delay peak solar heat gain by 8 to 10 hours.',
    metrics: {
      thermalMass: 'High (0.84 kJ/kg·K)',
      embodiedCarbon: '-62% vs Clay Brick',
      durability: '100+ Years',
      breathability: 'Natural Moisture Buffering',
    },
  },
  {
    id: 'athangudi-tiles',
    name: 'Chettinad Athangudi Tiles',
    origin: 'Handmade in Sivaganga District',
    image: '/images/materials.jpg',
    highlight: 'Naturally air-cured artisan cement tiles with floral dyes.',
    fullDesc:
      'Handcrafted using local river sand, colored metallic oxides, and pure white cement cast over glass plates. Sun-cured for 21 days in water tanks with zero furnace firing energy, acquiring a deep natural patina over generations.',
    metrics: {
      thermalMass: 'Moderate (Cool to Touch)',
      embodiedCarbon: '-45% vs Ceramic Tile',
      durability: 'Generational (Heirloom)',
      breathability: 'Porous & Acoustic',
    },
  },
  {
    id: 'lime-stucco',
    name: 'Slaked Hydrated Lime Plaster',
    origin: 'Madurai Lime Shells & Quartz Sand',
    image: '/images/lime-plaster.jpg',
    highlight: '100% breathable, naturally antifungal and self-healing.',
    fullDesc:
      'Tradition meets contemporary chemistry: slaked lime putty aged in vats for 90 days, troweled in three coats with sieved river sand and egg-shell powder. Reabsorbs atmospheric CO₂ during carbonation, healing microscopic cracks naturally.',
    metrics: {
      thermalMass: 'Vapor-Permeable Envelope',
      embodiedCarbon: 'Carbon Neutral Carbonation',
      durability: 'Indefinite (Centuries)',
      breathability: '100% Breathable',
    },
  },
  {
    id: 'reclaimed-teak',
    name: 'Reclaimed Heritage Teakwood',
    origin: 'Salvaged Ancestral Mandapams',
    image: '/images/courtyard.jpg',
    highlight: 'Zero fresh timber logging, dense grain aged over 80 years.',
    fullDesc:
      'Responsibly salvaged structural timber retrieved from deconstructed Chettinad and Kongu mansions. Naturally seasoned against termites and warping over eight decades, planed down for joinery, louvres, and ceiling battens.',
    metrics: {
      thermalMass: 'Low Conductivity (0.12 W/m·K)',
      embodiedCarbon: 'Net Carbon Negative',
      durability: 'Naturally Pest-Resistant',
      breathability: 'Organic Acoustic Damper',
    },
  },
];

export function MaterialSwatchDrawer() {
  const [selected, setSelected] = useState<Swatch>(SWATCHES[0]);

  return (
    <section className={styles.drawerSection} aria-labelledby="swatch-drawer-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Material Provenance</p>
        <h2 id="swatch-drawer-title" className={styles.title}>
          Tactile regional materials. Honesty in the finish.
        </h2>
      </header>

      <div className={styles.swatchesGrid} role="tablist" aria-label="Regional materials catalogue">
        {SWATCHES.map((swatch) => {
          const isSelected = selected.id === swatch.id;
          return (
            <button
              key={swatch.id}
              type="button"
              className={[styles.swatchCard, isSelected && styles.swatchCardActive]
                .filter(Boolean)
                .join(' ')}
              onClick={() => setSelected(swatch)}
              role="tab"
              aria-selected={isSelected}
            >
              <div className={styles.imageWrap}>
                <Image
                  src={swatch.image}
                  alt={swatch.name}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className={styles.swatchImage}
                />
              </div>

              <div className={styles.swatchInfo}>
                <span className={styles.swatchOrigin}>{swatch.origin}</span>
                <h3 className={styles.swatchName}>{swatch.name}</h3>
                <p className={styles.swatchHighlight}>{swatch.highlight}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded Technical Detail Drawer */}
      <div className={styles.detailDrawer} role="tabpanel">
        <div className={styles.detailLeft}>
          <h4 className={styles.detailTitle}>{selected.name}</h4>
          <p className={styles.detailDesc}>{selected.fullDesc}</p>

          <div className={styles.metricsGrid}>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Thermal Behavior</span>
              <span className={styles.metricVal}>{selected.metrics.thermalMass}</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Carbon Differential</span>
              <span className={styles.metricVal}>{selected.metrics.embodiedCarbon}</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Lifespan Metric</span>
              <span className={styles.metricVal}>{selected.metrics.durability}</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Permeability</span>
              <span className={styles.metricVal}>{selected.metrics.breathability}</span>
            </div>
          </div>
        </div>

        <div className={styles.detailRight}>
          <Image
            src={selected.image}
            alt={`${selected.name} architectural application`}
            fill
            sizes="(min-width: 768px) 40vw, 90vw"
            style={{ objectFit: 'cover' }}
          />
        </div>
      </div>
    </section>
  );
}
