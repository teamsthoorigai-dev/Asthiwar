'use client';

import { useState } from 'react';
import { ArrowDownRight } from 'lucide-react';
import { PageHero } from '@/components/PageHero';
import { SiteLayout } from '@/components/SiteShell';
import { insights } from '@/data/site';

const categories = ['All', ...Array.from(new Set(insights.map((item) => item.category)))] as const;

export function InsightsClient() {
  const [category, setCategory] = useState<string>('All');
  const visible =
    category === 'All' ? insights : insights.filter((item) => item.category === category);
  const featured = insights[0];

  return (
    <SiteLayout>
      <PageHero
        eyebrow="INSIGHTS"
        title="INSIGHTS"
        intro="Articles on architecture, sustainable building, materials, construction, design and project insights will be published here when approved."
        meta={
          <>
            <span>Placeholder article structure</span>
            <span>Content to be confirmed</span>
          </>
        }
      />

      {featured ? (
        <section className="featured-insight section section--paper">
          <div className="shell featured-insight__grid">
            <div className="featured-insight__visual" aria-hidden="true">
              <span>W</span>
              <svg viewBox="0 0 600 420">
                <path d="M40 350H560M95 350V150L295 80L510 165V350M295 80V350M175 350V230H250V350M360 350V205H445V350" />
                <path
                  className="accent"
                  d="M95 150L295 80L510 165M70 320C180 260 260 240 315 170"
                />
              </svg>
              <p>FIELD NOTE / 001</p>
            </div>
            <article>
              <p className="eyebrow">Featured / {featured.category}</p>
              <h2>{featured.title}</h2>
              <p>{featured.excerpt}</p>
              <div>
                <span>{featured.date}</span>
                <span>{featured.readTime}</span>
              </div>
              <a href={`#${featured.slug}`} className="text-link">
                Article coming soon <ArrowDownRight size={18} aria-hidden="true" />
              </a>
            </article>
          </div>
        </section>
      ) : null}

      <section className="insight-archive section section--mineral">
        <div className="shell">
          <div className="insight-filters" role="group" aria-label="Filter insight notes">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="insight-list">
            {visible.map((item) => (
              <article key={item.slug} id={item.slug}>
                <span>{String(insights.indexOf(item) + 1).padStart(2, '0')}</span>
                <div>
                  <p>
                    {item.category} · {item.date} · {item.readTime}
                  </p>
                  <h2>{item.title}</h2>
                  <p>{item.excerpt}</p>
                </div>
                <a href={`#${item.slug}`} aria-label={`Open sample note: ${item.title}`}>
                  <ArrowDownRight size={21} aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
          <p className="insight-archive__note" aria-live="polite">
            Showing {visible.length} placeholder {visible.length === 1 ? 'article' : 'articles'}.
            Approved content will replace these records when available.
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
