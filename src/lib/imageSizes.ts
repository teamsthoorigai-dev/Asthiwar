/**
 * `sizes` values shared by a component and the preloader that fetches its
 * images ahead of time. They must stay identical: a different `sizes` picks a
 * different file from the srcset, and the early download is wasted.
 */

/** Project photos in the archive cards on /projects. */
export const PROJECT_SHOT_SIZES = '(min-width: 768px) 50vw, 100vw';

/**
 * A gallery tile on a project page. Its rows are justified (see
 * ProjectGallery.module.css), so a tile is as wide as its picture is
 * proportionally wide: about TILE_VW_PER_RATIO of the viewport for each 1:1 of
 * aspect ratio, from a floor up to the whole row. It runs a little above the
 * 24vw row height because rows grow to fill the width.
 */
const TILE_VW_PER_RATIO = 28;
const TILE_MIN_VW = 22;

export function projectTileSizes(width: number, height: number): string {
  const vw = Math.round((width / height) * TILE_VW_PER_RATIO);
  return `(min-width: 768px) ${Math.min(100, Math.max(TILE_MIN_VW, vw))}vw, 100vw`;
}

/** The header image of PageHero, which each project page without a video uses. */
export const PAGE_HERO_SIZES = '(max-width: 1024px) 100vw, 1440px';
