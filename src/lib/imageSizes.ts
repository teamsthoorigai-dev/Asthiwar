/**
 * `sizes` values shared by a component and the preloader that fetches its
 * images ahead of time. They must stay identical: a different `sizes` picks a
 * different file from the srcset, and the early download is wasted.
 */

/** Project photos: archive cards on /projects and the gallery grid on each project page. */
export const PROJECT_SHOT_SIZES = '(min-width: 768px) 50vw, 100vw';

/** The header image of PageHero, which each project page without a video uses. */
export const PAGE_HERO_SIZES = '(max-width: 1024px) 100vw, 1440px';
