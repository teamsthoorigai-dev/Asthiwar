import { cardShots, projects } from '@/data/site';
import { PAGE_HERO_SIZES, PROJECT_SHOT_SIZES, projectTileSizes } from './imageSizes';
import { eachLimit, warmImage } from './preload';

const CONCURRENCY = 3;

/**
 * Every photo a visitor meets under /projects, fetched ahead into the browser
 * cache: the archive cards' frames (PROJECT_SHOT_SIZES), each project page's
 * gallery tiles (each at its own projectTileSizes), then each project page's
 * header image.
 *
 * Header videos are not fetched ahead; Aether's alone is 28MB. Where a project
 * has one, its raw poster file is fetched instead.
 *
 * Imported on demand by SiteLoader, so the project data stays out of the
 * JavaScript every page downloads up front.
 */
export function warmProjectImages(signal: AbortSignal): Promise<void> {
  const shots: Array<{ src: string; sizes?: string }> = [];

  for (const project of projects) {
    for (const shot of cardShots(project)) shots.push({ src: shot.src, sizes: PROJECT_SHOT_SIZES });
  }
  for (const project of projects) {
    for (const shot of project.gallery) {
      shots.push({ src: shot.src, sizes: projectTileSizes(shot.width, shot.height) });
    }
  }
  for (const project of projects) {
    shots.push(project.video ? { src: project.image.src } : { src: project.image.src, sizes: PAGE_HERO_SIZES });
  }

  return eachLimit(shots, CONCURRENCY, signal, ({ src, sizes }) => warmImage(src, sizes));
}
