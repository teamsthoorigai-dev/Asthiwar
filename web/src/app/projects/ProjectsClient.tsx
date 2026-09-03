'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FieldRecordSequence } from '@/components/FieldRecordSequence';
import { ProjectCard } from '@/components/ProjectCard';
import { SiteLayout } from '@/components/SiteShell';
import { projects } from '@/data/site';

const projectFilters = [
  'All',
  'Residential',
  'Commercial',
  'Hospitality',
  'Institutional',
  'Renovation',
  'To be confirmed',
] as const;
type ProjectFilter = (typeof projectFilters)[number];

export function ProjectsClient() {
  const [activeFilter, setActiveFilter] = useState<ProjectFilter>('All');
  const visibleProjects =
    activeFilter === 'All'
      ? projects
      : projects.filter((project) => project.category === activeFilter);

  return (
    <SiteLayout footerCta="land">
      <FieldRecordSequence
        eyebrow="ASTHIWAR / Projects"
        title="Projects"
        intro="A collection of spaces shaped by context, material and intent."
        cue="Scroll to the archive"
        actions={
          <>
           
            <Link href="/cost-calculator" className="button button--outline-light">
              Cost calculator
            </Link>
          </>
        }
      />

      <section
        id="project-archive"
        className="projects-archive section section--paper"
        aria-label="Project archive"
      >
        <div className="shell">
          <div className="project-filters" role="group" aria-label="Filter projects by type">
            {projectFilters.map((filter) => {
              const count =
                filter === 'All'
                  ? projects.length
                  : projects.filter((project) => project.category === filter).length;

              return (
                <button
                  key={filter}
                  type="button"
                  aria-pressed={activeFilter === filter}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter} <span>{String(count).padStart(2, '0')}</span>
                </button>
              );
            })}
          </div>

          <p className="projects-archive__result" aria-live="polite">
            Showing {visibleProjects.length} {visibleProjects.length === 1 ? 'project' : 'projects'}
          </p>

          <div className="projects-archive__grid">
            {visibleProjects.map((project) => (
              <ProjectCard
                key={project.slug}
                project={project}
                index={projects.findIndex((item) => item.slug === project.slug)}
                featured={project.slug === visibleProjects[0]?.slug}
                hoverGallery
              />
            ))}
          </div>

          {visibleProjects.length === 0 ? (
            <div className="projects-empty">
              <h2>No verified projects match these filters yet.</h2>
              <p>Adjust the browse controls to continue exploring available project records.</p>
            </div>
          ) : null}
        </div>
      </section>
    </SiteLayout>
  );
}
