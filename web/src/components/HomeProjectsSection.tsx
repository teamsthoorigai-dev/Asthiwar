'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useState } from 'react';

import { ProjectCard } from '@/components/ProjectCard';
import { projects } from '@/data/site';

const projectGroups = [
  {
    id: 'residences',
    label: 'Residences',
    slugs: ['courtyard-residence', 'jaali-house'],
  },
  {
    id: 'interior-workplace',
    label: 'Interior + workplace',
    slugs: ['lime-plaster-apartment', 'workshop-office'],
  },
] as const;

type ProjectGroupId = (typeof projectGroups)[number]['id'];

export function HomeProjectsSection() {
  const [activeGroup, setActiveGroup] = useState<ProjectGroupId>('residences');
  const selectedGroup = projectGroups.find((group) => group.id === activeGroup) ?? projectGroups[0];
  const visibleProjects = selectedGroup.slugs
    .map((slug) => projects.find((project) => project.slug === slug))
    .filter((project): project is (typeof projects)[number] => Boolean(project));

  return (
    <section className="home-projects section section--paper" aria-label="Selected projects">
      <div className="shell">
        <div className="home-projects__controls">
          <div className="project-filters" role="group" aria-label="Choose a project collection">
            {projectGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                aria-pressed={activeGroup === group.id}
                onClick={() => setActiveGroup(group.id)}
              >
                {group.label} <span>{String(group.slugs.length).padStart(2, '0')}</span>
              </button>
            ))}
          </div>
          <Link href="/projects" className="button home-projects__all">
            Explore all projects <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <p className="home-projects__result" aria-live="polite">
          Showing {visibleProjects.length} projects
        </p>

        <div className="home-projects__grid">
          {visibleProjects.map((project, index) => (
            <ProjectCard
              key={project.slug}
              project={project}
              index={projects.findIndex((item) => item.slug === project.slug)}
              featured={index === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
