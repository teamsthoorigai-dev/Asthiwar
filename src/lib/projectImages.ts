import { projects } from '@/data/site';
import { PAGE_HERO_SIZES, PROJECT_SHOT_SIZES } from './imageSizes';
import { eachLimit, warmImage } from './preload';

const CONCURRENCY = 3;

/**
 * Every photo a visitor meets under /projects, fetched ahead into the browser
 * cache: the archive cards and each project page's gallery (the same files —
 * both render at PROJECT_SHOT_SIZES), then each project page's header image.
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
    for (const shot of project.gallery) shots.push({ src: shot.src, sizes: PROJECT_SHOT_SIZES });
  }
  for (const project of projects) {
    shots.push(project.video ? { src: project.image.src } : { src: project.image.src, sizes: PAGE_HERO_SIZES });
  }

  return eachLimit(shots, CONCURRENCY, signal, ({ src, sizes }) => warmImage(src, sizes));
}
