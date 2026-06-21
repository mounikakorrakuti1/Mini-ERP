import { useEffect, useRef, useCallback, useMemo } from 'react';

/* ─── Config ────────────────────────────────────────────────── */
const TOTAL_FRAMES = 100;
const LERP_SPEED   = 0.12;
const PRELOAD_BATCH = 20;
const SCROLL_TRACK_CLASS = 'hero-scroll-track';
const pad3 = (n: number) => String(n).padStart(3, '0');

export default function HeroFrameCanvas() {
  const frameUrls = useMemo(
    () => Array.from({ length: TOTAL_FRAMES }, (_, i) => `/furnexa/ezgif-frame-${pad3(i + 1)}.jpg`),
    []
  );

  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const imagesRef  = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const stateRef   = useRef({ currentFrame: 0, targetFrame: 0, rafId: 0, loadedCount: 0, isReady: false });

  /* ── Frame preloader ─────────────────────────── */
  const preloadFrames = useCallback(async (urls: string[]) => {
    for (let start = 0; start < TOTAL_FRAMES; start += PRELOAD_BATCH) {
      const end   = Math.min(start + PRELOAD_BATCH, TOTAL_FRAMES);
      const batch = urls.slice(start, end).map((url, bi) =>
        new Promise<void>((resolve) => {
          const img  = new Image();
          img.src    = url;
          img.onload = () => {
            imagesRef.current[start + bi] = img;
            stateRef.current.loadedCount++;
            if (stateRef.current.loadedCount >= PRELOAD_BATCH) stateRef.current.isReady = true;
            resolve();
          };
          img.onerror = () => resolve();
        })
      );
      await Promise.all(batch);
    }
    stateRef.current.isReady = true;
  }, []);

  /* ── Canvas draw ─────────────────────────────── */
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const idx = Math.round(Math.max(0, Math.min(TOTAL_FRAMES - 1, frameIndex)));
    const img  = imagesRef.current[idx];
    if (!img?.complete || !img.naturalWidth) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const W   = canvas.width  / dpr;
    const H   = canvas.height / dpr;

    const iR = img.naturalWidth  / img.naturalHeight;
    const cR = W / H;
    let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
    if (iR > cR) { sw = img.naturalHeight * cR; sx = (img.naturalWidth  - sw) / 2; }
    else          { sh = img.naturalWidth  / cR; sy = (img.naturalHeight - sh) / 2; }

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
  }, []);

  /* ── RAF render loop ─────────────────────────── */
  const lastScrollTime  = useRef(Date.now());
  const autoPhase       = useRef<'fwd' | 'pauseEnd' | 'rew' | 'pauseStart'>('fwd');
  const pauseStart      = useRef(0);

  const renderLoop = useCallback(() => {
    const s   = stateRef.current;
    const now = Date.now();
    if (now - lastScrollTime.current > 2500) {
      if (autoPhase.current === 'fwd') {
        s.targetFrame += 0.2;
        if (s.targetFrame >= TOTAL_FRAMES - 1) { s.targetFrame = TOTAL_FRAMES - 1; autoPhase.current = 'pauseEnd'; pauseStart.current = now; }
      } else if (autoPhase.current === 'pauseEnd') {
        if (now - pauseStart.current > 1200) autoPhase.current = 'rew';
      } else if (autoPhase.current === 'rew') {
        s.targetFrame -= 1.2;
        if (s.targetFrame <= 0) { s.targetFrame = 0; autoPhase.current = 'pauseStart'; pauseStart.current = now; }
      } else {
        if (now - pauseStart.current > 2000) autoPhase.current = 'fwd';
      }
    } else { autoPhase.current = 'fwd'; }

    const delta = s.targetFrame - s.currentFrame;
    if (Math.abs(delta) > 0.01) s.currentFrame += delta * LERP_SPEED;
    if (s.isReady) drawFrame(s.currentFrame);
    s.rafId = requestAnimationFrame(renderLoop);
  }, [drawFrame]);

  /* ── Scroll handler ──────────────────────────── */
  const handleScroll = useCallback(() => {
    lastScrollTime.current = Date.now();
    const canvas = canvasRef.current;
    if (!canvas) return;
    let track: HTMLElement | null = canvas.parentElement;
    while (track && !track.classList.contains(SCROLL_TRACK_CLASS)) track = track.parentElement;
    if (!track) return;
    const rect    = track.getBoundingClientRect();
    const totalH  = track.offsetHeight - window.innerHeight;
    if (totalH <= 0) return;
    const scrolled = Math.max(0, -rect.top);
    stateRef.current.targetFrame = (Math.min(1, scrolled / totalH)) * (TOTAL_FRAMES - 1);
  }, []);

  /* ── Canvas resize ───────────────────────────── */
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W   = canvas.parentElement?.offsetWidth  || window.innerWidth;
    const H   = canvas.parentElement?.offsetHeight || window.innerHeight;
    canvas.width        = W * dpr;
    canvas.height       = H * dpr;
    canvas.style.width  = `${W}px`;
    canvas.style.height = `${H}px`;
    canvas.getContext('2d')?.scale(dpr, dpr);
    drawFrame(Math.round(stateRef.current.currentFrame));
  }, [drawFrame]);

  /* ── Lifecycle ───────────────────────────────── */
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    resizeCanvas();
    imagesRef.current  = new Array(TOTAL_FRAMES).fill(null);
    stateRef.current.loadedCount = 0;
    stateRef.current.isReady     = false;
    preloadFrames(frameUrls);

    if (!prefersReduced) {
      stateRef.current.rafId = requestAnimationFrame(renderLoop);
    } else {
      const img = new Image();
      img.src = frameUrls[0];
      img.onload = () => { imagesRef.current[0] = img; stateRef.current.isReady = true; drawFrame(0); };
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', resizeCanvas);
    const state = stateRef.current;
    return () => {
      cancelAnimationFrame(state.rafId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [preloadFrames, renderLoop, handleScroll, resizeCanvas, drawFrame, frameUrls]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
