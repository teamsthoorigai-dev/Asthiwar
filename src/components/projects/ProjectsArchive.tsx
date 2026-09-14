'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { projects, projectCategories, type Project } from '@/data/site';
import { gsap, ScrollTrigger, REDUCED } from '@/lib/gsap';
import { ProjectCard } from './ProjectCard';
import { ProjectCursorPreview } from './ProjectCursorPreview';
import styles from './ProjectsArchive.module.css';

const ALL = 'All';

export function ProjectsArchive() {
  const router = useRouter();
  const params = useSearchParams();
  const categories = projectCategories();
  const active = params.get('category') ?? ALL;

  const [viewMode, setViewMode] = useState<'grid' | 'index'>('grid');
  const [fading, setFading] = useState(false);
  const [hoveredProject, setHoveredProject] = useState<Project | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const visible =
    active === ALL ? projects : projects.filter((p) => p.category === active);

  // Scroll reveal animation for project cards: animates each project one by one as it enters viewport
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || REDUCED() || viewMode !== 'grid') return;

    const cards = Array.from(grid.querySelectorAll<HTMLElement>('[data-project-card]'));
    if (cards.length === 0) return;

    const ctx = gsap.context(() => {
      cards.forEach((card) => {
        gsap.from(card, {
          y: 28,
          opacity: 0,
          duration: 0.75,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 88%',
            toggleActions: 'play none none none',
            once: true,
          },
        });
      });
    }, grid);

    return () => ctx.revert();
  }, [visible, viewMode, fading]);

  const select = (category: string) => {
    if (category === active) return;
    setFading(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const query = category === ALL ? '' : `?category=${encodeURIComponent(category)}`;
      router.replace(`/projects${query}`, { scroll: false });
      setFading(false);
    }, 200);
  };

  return (
    <div>
      {/* Top Bar: Filters + View Mode Switcher */}
      <div className={styles.topBar}>
        {categories.length > 0 ? (
          <div className={styles.filters} role="group" aria-label="Filter by category">
            {[ALL, ...categories].map((category) => (
              <button
                key={category}
                type="button"
                className={[styles.pill, category === active && styles.pillActive]
                  .filter(Boolean)
                  .join(' ')}
                aria-pressed={category === active}
                onClick={() => select(category)}
              >
                {category}
              </button>
            ))}
          </div>
        ) : <div />}

        <div className={styles.viewSwitcher} role="group" aria-label="View layout switch">
          <button
            type="button"
            className={[styles.switchBtn, viewMode === 'grid' && styles.switchBtnActive]
              .filter(Boolean)
              .join(' ')}
            onClick={() => setViewMode('grid')}
          >
            Editorial Grid
          </button>
          <button
            type="button"
            className={[styles.switchBtn, viewMode === 'index' && styles.switchBtnActive]
              .filter(Boolean)
              .join(' ')}
            onClick={() => setViewMode('index')}
          >
            Index Table
          </button>
        </div>
      </div>

      <p className={styles.count}>
        Showing {visible.length} {visible.length === 1 ? 'selected project' : 'selected projects'}
      </p>

      {visible.length === 0 ? (
        <p className={styles.empty}>No projects currently in this category.</p>
      ) : viewMode === 'grid' ? (
        /* Editorial Grid View with Scroll Reveal */
        <div
          ref={gridRef}
          className={[styles.grid, fading && styles.fading].filter(Boolean).join(' ')}
        >
          {visible.map((project, idx) => (
            <ProjectCard
              key={project.slug}
              project={project}
              index={idx}
              total={visible.length}
            />
          ))}
        </div>
      ) : (
        /* Architectural Index Table View with Hover Preview */
        <div className={styles.tableWrap}>
          <table className={styles.indexTable}>
            <thead>
              <tr className={styles.indexHeader}>
                <th>Project & Archetype</th>
                <th>Location</th>
                <th>Category</th>
                <th>Scale</th>
                <th>Year</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((project) => (
                <tr
                  key={project.slug}
                  className={styles.tableRow}
                  onMouseEnter={() => setHoveredProject(project)}
                  onMouseLeave={() => setHoveredProject(null)}
                  onClick={() => router.push(`/projects/${project.slug}`)}
                >
                  <td className={styles.tableCell}>
                    <div className={styles.tableCellTitle}>
                      <Link href={`/projects/${project.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {project.title}
                      </Link>
                    </div>
                  </td>
                  <td className={styles.tableCell}>{project.location}</td>
                  <td className={styles.tableCell}>
                    <span className={styles.tableTag}>{project.category}</span>
                  </td>
                  <td className={styles.tableCell}>{project.area}</td>
                  <td className={styles.tableCell}>{project.year}</td>
                  <td className={styles.tableCell}>{project.status}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Floating Cursor Thumbnail Preview */}
          <ProjectCursorPreview
            src={hoveredProject?.image.src || ''}
            alt={hoveredProject?.image.alt || ''}
            title={hoveredProject?.title || ''}
            location={hoveredProject?.location || ''}
            visible={Boolean(hoveredProject && viewMode === 'index')}
          />
        </div>
      )}
    </div>
  );
}
