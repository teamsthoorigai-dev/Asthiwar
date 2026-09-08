'use client';

import { useState } from 'react';
import styles from './ServiceRadiusMap.module.css';

interface ServiceNode {
  id: string;
  name: string;
  x: number;
  y: number;
  distance: string;
  travelTime: string;
  typologies: string;
  description: string;
  isHq?: boolean;
}

const NODES: ServiceNode[] = [
  {
    id: 'cbe',
    name: 'Coimbatore (Studio & Workshop)',
    x: 340,
    y: 220,
    distance: '0 km (Studio Origin)',
    travelTime: 'Origin Hub',
    typologies: 'Urban Sanctuaries, Brutalist Ateliers, Material Research Lab',
    description: 'Central engineering and architectural atelier where prototypes, timber mockups, and client walkthroughs are conducted.',
    isHq: true,
  },
  {
    id: 'pollachi',
    name: 'Pollachi & Anamalai Foothills',
    x: 340,
    y: 315,
    distance: '42 km South',
    travelTime: '55 mins via NH83',
    typologies: 'Coconut Grove Sanctuaries, Courtyard Farmhouses',
    description: 'Specializing in deep verandah agricultural residences with natural stack ventilation and rainwater irrigation ponds.',
  },
  {
    id: 'tiruppur',
    name: 'Tiruppur Textile Corridor',
    x: 440,
    y: 200,
    distance: '54 km East',
    travelTime: '1 hr 10 mins via NH544',
    typologies: 'Modern Minimalist Estates, High-Acoustic Work-Life Ateliers',
    description: 'Precision concrete and steel residences built with solar envelopes for manufacturing executives.',
  },
  {
    id: 'nilgiris',
    name: 'Nilgiris (Ooty & Coonoor)',
    x: 310,
    y: 90,
    distance: '86 km North',
    travelTime: '2 hr 30 mins (Ghat Road)',
    typologies: 'High-Altitude Stone Sanctuaries, Timber Mountain Lodges',
    description: 'Thermal mass slate and basalt architecture designed to resist heavy monsoonal moisture and retain hearth heat.',
  },
  {
    id: 'erode',
    name: 'Erode & Bhavani Basin',
    x: 530,
    y: 170,
    distance: '100 km North-East',
    travelTime: '1 hr 55 mins via NH544',
    typologies: 'River-Valley Courtyards, Multi-Tier Family Compounds',
    description: 'Ventilated clay tile roofs and lime-rendered walls tailored for the intense summer thermal cycles of the Kaveri basin.',
  },
  {
    id: 'salem',
    name: 'Salem Regional Cluster',
    x: 630,
    y: 130,
    distance: '165 km East',
    travelTime: '2 hr 50 mins via NH544',
    typologies: 'Heirloom Ancestral Estates, Monolithic Granite Pavilions',
    description: 'Large-scale multi-generational compounds built with locally quarried regional granite and stabilized earth blocks.',
  },
];

export function ServiceRadiusMap() {
  const [activeNode, setActiveNode] = useState<ServiceNode>(NODES[0]);

  return (
    <div className={styles.radiusCard}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>
          Regional Service Footprint • Western Tamil Nadu
        </span>
        <h3 className={styles.title}>Western Ghats &amp; Kongu Belt Operational Radius</h3>
        <p className={styles.subtitle}>
          All projects within a 170 km radius receive weekly direct site supervision by our
          principal architects, ensuring rigorous structural craftsmanship and material fidelity.
        </p>
      </header>

      {/* Cartographic SVG Canvas */}
      <div className={styles.mapContainer}>
        <svg
          viewBox="0 0 760 400"
          className={styles.svgMap}
          aria-label="Interactive Tamil Nadu operational territory map"
        >
          {/* Grid lines */}
          <line x1="60" y1="220" x2="700" y2="220" stroke="var(--drafting-grid-major)" strokeDasharray="3 3" />
          <line x1="340" y1="40" x2="340" y2="360" stroke="var(--drafting-grid-major)" strokeDasharray="3 3" />

          {/* Concentric Distance Rings from Coimbatore HQ (340, 220) */}
          <circle cx="340" cy="220" r="90" fill="none" stroke="var(--drafting-grid-major)" strokeDasharray="4 6" strokeWidth="1" />
          <text x="345" y="135" fill="var(--drafting-muted)" fontSize="9" fontFamily="monospace">50 KM RADIUS</text>

          <circle cx="340" cy="220" r="180" fill="none" stroke="var(--drafting-grid-major)" strokeDasharray="4 6" strokeWidth="1" />
          <text x="345" y="45" fill="var(--drafting-muted)" fontSize="9" fontFamily="monospace">100 KM RADIUS</text>

          <circle cx="340" cy="220" r="280" fill="none" stroke="var(--drafting-grid)" strokeDasharray="4 6" strokeWidth="1" />
          <text x="615" y="240" fill="var(--drafting-muted)" fontSize="9" fontFamily="monospace">160 KM RADIUS</text>

          {/* Direct transit lines from HQ to nodes */}
          {NODES.filter((n) => !n.isHq).map((node) => {
            const isSelected = activeNode.id === node.id;
            return (
              <line
                key={`line-${node.id}`}
                x1="340"
                y1="220"
                x2={node.x}
                y2={node.y}
                stroke={isSelected ? 'var(--accent)' : 'var(--drafting-grid-major)'}
                strokeWidth={isSelected ? 1.5 : 1}
                strokeDasharray={isSelected ? 'none' : '4 4'}
              />
            );
          })}

          {/* Node entities */}
          {NODES.map((node) => {
            const isSelected = activeNode.id === node.id;
            return (
              <g
                key={node.id}
                className={styles.nodeBtn}
                onClick={() => setActiveNode(node)}
                tabIndex={0}
                role="button"
                aria-label={`Select region ${node.name}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setActiveNode(node);
                }}
              >
                {/* Active selection boundary */}
                {isSelected && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="16"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Outer ring */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.isHq ? 8 : 6}
                  fill={node.isHq ? 'var(--accent)' : isSelected ? 'var(--accent)' : 'var(--drafting-paper)'}
                  stroke={isSelected ? 'var(--ink)' : node.isHq ? 'var(--accent)' : 'var(--drafting-graphite)'}
                  strokeWidth="1.5"
                />

                {/* Inner dot */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.isHq ? 3.5 : 2.5}
                  fill={node.isHq ? 'var(--on-accent)' : isSelected ? 'var(--on-accent)' : 'var(--drafting-graphite)'}
                />

                {/* Label text */}
                <text
                  x={node.x}
                  y={node.y > 220 ? node.y + 18 : node.y - 12}
                  fill={isSelected ? 'var(--ink)' : 'var(--drafting-graphite)'}
                  fontSize={node.isHq ? '11' : '10'}
                  fontWeight={isSelected || node.isHq ? '700' : '500'}
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {node.name.split(' ')[0]} {node.isHq ? '★ HQ' : ''}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Node Details Card */}
      <div className={styles.nodeInfoBox}>
        <div className={styles.infoCol}>
          <span className={styles.infoLabel}>Selected Region</span>
          <span className={styles.infoValue}>{activeNode.name}</span>
          <span className={styles.infoArchetype}>{activeNode.typologies}</span>
        </div>

        <div className={styles.infoCol}>
          <span className={styles.infoLabel}>Transit Distance &amp; Time from Studio</span>
          <span className={styles.infoValue}>{activeNode.distance}</span>
          <span className={styles.infoSubtext}>
            {activeNode.travelTime}
          </span>
        </div>

        <div className={styles.infoCol} style={{ gridColumn: '1 / -1' }}>
          <span className={styles.infoLabel}>Regional Architecture Focus</span>
          <p className={styles.infoDescription}>
            {activeNode.description}
          </p>
        </div>
      </div>
    </div>
  );
}
