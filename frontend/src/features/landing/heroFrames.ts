export const HERO_TOTAL_FRAMES = 100;

const pad3 = (n: number) => String(n).padStart(3, '0');

export type HeroTheme = 'light' | 'dark';

/** Scroll-sequence frame paths under `public/images/{light|dark}/`. */
export function getHeroFrameUrls(theme: HeroTheme): string[] {
  return Array.from(
    { length: HERO_TOTAL_FRAMES },
    (_, i) => `/images/light/ezgif-frame-${pad3(i + 1)}.jpg`,
  );
}
