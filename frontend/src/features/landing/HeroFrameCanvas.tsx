/**
 * Cinematic scroll-driven image-sequence animation.
 * Frames live in `public/images/light/` and `public/images/dark/`.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useThemeStore } from '@/store/theme.store';
import { getHeroFrameUrls, HERO_TOTAL_FRAMES } from './heroFrames';

const LERP_SPEED = 0.14;
const PRELOAD_BATCH = 24;
const SCROLL_TRACK_CLASS = 'hero-scroll-track';

export default function HeroFrameCanvas() {
  const { theme } = useThemeStore();
  const frameUrls = getHeroFrameUrls(theme);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(
    new Array(HERO_TOTAL_FRAMES).fill(null),
  );
  const stateRef = useRef({
    currentFrame: 22,
    targetFrame: 22,
    rafId: null as number | null,
    loadedCount: 0,
    isReady: false,
  });

  const preloadFrames = useCallback(async (urls: string[]) => {
    for (let start = 0; start < HERO_TOTAL_FRAMES; start += PRELOAD_BATCH) {
      const end = Math.min(start + PRELOAD_BATCH, HERO_TOTAL_FRAMES);
      const batch = urls.slice(start, end).map(
        (url, bi) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.src = url;
            img.onload = () => {
              imagesRef.current[start + bi] = img;
              stateRef.current.loadedCount++;
              if (stateRef.current.loadedCount >= PRELOAD_BATCH) {
                stateRef.current.isReady = true;
              }
              resolve();
            };
            img.onerror = () => resolve();
          }),
      );
      await Promise.all(batch);
    }
    stateRef.current.isReady = true;
  }, []);

  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const idx = Math.round(Math.max(0, Math.min(HERO_TOTAL_FRAMES - 1, frameIndex)));
    const img = imagesRef.current[idx];
    if (!img?.complete || !img.naturalWidth) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;

    const iR = img.naturalWidth / img.naturalHeight;
    const cR = W / H;
    let sx = 0;
    let sy = 0;
    let sw = img.naturalWidth;
    let sh = img.naturalHeight;

    if (iR > cR) {
      sw = img.naturalHeight * cR;
      sx = (img.naturalWidth - sw) / 2;
    } else {
      sh = img.naturalWidth / cR;
      sy = (img.naturalHeight - sh) / 2;
    }

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
  }, []);

  const lastScrollTime = useRef(Date.now());
  const autoPlayPhase = useRef<'forward' | 'pauseEnd' | 'rewind' | 'pauseStart'>('forward');
  const pauseStartTime = useRef(0);

  const renderLoop = useCallback(() => {
    const s = stateRef.current;
    const now = Date.now();

    if (now - lastScrollTime.current > 3000) {
      if (autoPlayPhase.current === 'forward') {
        s.targetFrame += 0.25;
        if (s.targetFrame >= HERO_TOTAL_FRAMES - 1) {
          s.targetFrame = HERO_TOTAL_FRAMES - 1;
          autoPlayPhase.current = 'pauseEnd';
          pauseStartTime.current = now;
        }
      } else if (autoPlayPhase.current === 'pauseEnd') {
        if (now - pauseStartTime.current > 1500) {
          autoPlayPhase.current = 'rewind';
        }
      } else if (autoPlayPhase.current === 'rewind') {
        s.targetFrame -= 1.5;
        if (s.targetFrame <= 0) {
          s.targetFrame = 0;
          autoPlayPhase.current = 'pauseStart';
          pauseStartTime.current = now;
        }
      } else if (autoPlayPhase.current === 'pauseStart') {
        if (now - pauseStartTime.current > 2500) {
          autoPlayPhase.current = 'forward';
        }
      }
    } else {
      autoPlayPhase.current = 'forward';
    }

    const delta = s.targetFrame - s.currentFrame;
    if (Math.abs(delta) > 0.01) {
      s.currentFrame += delta * LERP_SPEED;
    }
    if (s.isReady) drawFrame(s.currentFrame);
    s.rafId = requestAnimationFrame(renderLoop);
  }, [drawFrame]);

  const handleScroll = useCallback(() => {
    lastScrollTime.current = Date.now();

    const canvas = canvasRef.current;
    if (!canvas) return;

    let track: HTMLElement | null = canvas.parentElement;
    while (track && !track.classList.contains(SCROLL_TRACK_CLASS)) {
      track = track.parentElement;
    }
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const totalH = track.offsetHeight - window.innerHeight;
    if (totalH <= 0) return;

    const scrolled = Math.max(0, -rect.top);
    const progress = Math.min(1, scrolled / totalH);
    stateRef.current.targetFrame = 22 + progress * (HERO_TOTAL_FRAMES - 1 - 22); // CHANGE START FRAME HERE
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.parentElement?.offsetWidth || window.innerWidth;
    const H = canvas.parentElement?.offsetHeight || window.innerHeight;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }

    drawFrame(Math.round(stateRef.current.currentFrame));
  }, [drawFrame]);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const savedFrame = Math.round(stateRef.current.targetFrame);

    resizeCanvas();
    imagesRef.current = new Array(HERO_TOTAL_FRAMES).fill(null);
    stateRef.current.loadedCount = 0;
    stateRef.current.isReady = false;
    preloadFrames(frameUrls).then(() => {
      stateRef.current.currentFrame = savedFrame;
      stateRef.current.targetFrame = savedFrame;
      drawFrame(savedFrame);
    });

    if (!prefersReduced) {
      stateRef.current.rafId = requestAnimationFrame(renderLoop);
    } else {
      const img = new Image();
      const firstUrl = frameUrls[0] ?? '';
      img.src = firstUrl;
      img.onload = () => {
        imagesRef.current[0] = img;
        stateRef.current.isReady = true;
        drawFrame(savedFrame);
      };
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', resizeCanvas);
    handleScroll();

    const state = stateRef.current;

    return () => {
      if (state.rafId) cancelAnimationFrame(state.rafId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [preloadFrames, renderLoop, handleScroll, resizeCanvas, drawFrame, frameUrls, theme]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="hero-frame-canvas"
      data-theme={theme}
    />
  );
}
