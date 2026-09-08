'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  insightsPage,
  type Article,
  type InsightCategory,
} from '@/data/insights';
import styles from './insights.module.css';

const ALL_CATEGORIES = 'All';
type ActiveCategory = InsightCategory | typeof ALL_CATEGORIES;
const filterOptions: readonly ActiveCategory[] = [
  ALL_CATEGORIES,
  ...insightsPage.categories,
];

export function InsightsClient() {
  const [activeCategory, setActiveCategory] =
    useState<ActiveCategory>(ALL_CATEGORIES);
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  // Close modal on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setReadingArticle(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredArticles =
    activeCategory === ALL_CATEGORIES
      ? insightsPage.articles
      : insightsPage.articles.filter((a) => a.category === activeCategory);

  const featured = filteredArticles[0];
  const secondaryArticles = filteredArticles.slice(1);

  return (
    <section className={styles.contentSection} aria-label="Insights articles">
      <div className={styles.inner}>
        {/* Category Filter Pills */}
        <div
          className={styles.filters}
          role="group"
          aria-label="Filter insights by category"
        >
          {filterOptions.map((cat) => {
            const isActive = cat === activeCategory;
            return (
              <button
                key={cat}
                type="button"
                className={`${styles.filter} ${isActive ? styles.filterActive : ''}`}
                onClick={() => setActiveCategory(cat)}
                aria-pressed={isActive}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Featured Hero Monograph */}
        {featured && (
          <article className={styles.featuredHero}>
            <figure className={styles.featuredMedia}>
              <Image
                src={featured.image.src}
                alt={featured.image.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className={styles.featuredImage}
                priority
              />
            </figure>

            <div className={styles.featuredContent}>
              <div className={styles.featuredTag}>
                <span>{featured.category}</span>
                <span>•</span>
                <span>{featured.readTime}</span>
              </div>

              <h2 className={styles.featuredTitle}>{featured.title}</h2>
              <p className={styles.featuredSubtitle}>{featured.subtitle}</p>
              <p className={styles.featuredExcerpt}>{featured.excerpt}</p>

              {featured.keyFindings && featured.keyFindings.length > 0 && (
                <div className={styles.findingsBox}>
                  <p className={styles.findingsTitle}>Key Material Findings</p>
                  <ul className={styles.findingsList}>
                    {featured.keyFindings.map((finding, idx) => (
                      <li key={idx}>{finding}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className={styles.featuredMeta}>
                <span>{featured.author}</span>
                <span>{featured.date}</span>
              </div>

              <button
                type="button"
                className={styles.readBtn}
                onClick={() => setReadingArticle(featured)}
              >
                Read Full Monograph →
              </button>
            </div>
          </article>
        )}

        {/* Secondary Editorial Grid */}
        <div className={styles.grid}>
          {secondaryArticles.map((article) => (
            <article key={article.id} className={styles.articleCard}>
              <figure className={styles.cardMedia}>
                <Image
                  src={article.image.src}
                  alt={article.image.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{ objectFit: 'cover' }}
                />
              </figure>

              <div className={styles.cardContent}>
                <span className={styles.cardCategory}>{article.category}</span>
                <h3 className={styles.cardTitle}>{article.title}</h3>
                <p className={styles.cardExcerpt}>{article.excerpt}</p>

                <div className={styles.cardMeta}>
                  <span>{article.date}</span>
                  <button
                    type="button"
                    className={styles.cardReadLink}
                    onClick={() => setReadingArticle(article)}
                  >
                    Read ({article.readTime}) →
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Reader Modal */}
      {readingArticle && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setReadingArticle(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setReadingArticle(null)}
              aria-label="Close monograph"
            >
              ✕
            </button>

            <span className={styles.modalCategory}>
              {readingArticle.category} • {readingArticle.readTime}
            </span>
            <h2 className={styles.modalTitle}>{readingArticle.title}</h2>
            <p className={styles.modalSubtitle}>{readingArticle.subtitle}</p>

            <div className={styles.modalMeta}>
              <span>{readingArticle.author}</span>
              <span>{readingArticle.date}</span>
            </div>

            {readingArticle.fullEssay.map((para, i) => (
              <p key={i} className={styles.modalParagraph}>
                {para}
              </p>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
