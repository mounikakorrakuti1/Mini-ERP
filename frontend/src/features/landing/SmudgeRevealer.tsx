import { useEffect, useRef, useMemo } from 'react';
import gsap from 'gsap';
import './smudge.css';

const CONFIG = {
  smoothing: 1,
  expandMultiplier: 2.5,
  expandTime: 1.2,
  dissolveStart: 0.8,
  dissolveTime: 1.5,
  maxBlobs: 40,
};

const RANDOM_TEXTS = [
  'DESIGN THAT FITS',
  'SHAPE YOUR SPACE',
  'CRAFTED COMFORT',
  'ROOMS WITH INTENT',
  'WARMTH IN WOOD',
  'STYLE MADE SIMPLE',
];

export default function SmudgeRevealer() {
  const sectionRef = useRef<HTMLElement>(null);
  const maskGroupRef = useRef<SVGGElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const smoothPointer = useRef({ x: 0, y: 0 });
  const blobsRef = useRef<{ el: SVGCircleElement; tl: gsap.core.Timeline }[]>([]);
  const textIndex = useMemo(() => Math.floor(Math.random() * RANDOM_TEXTS.length), []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const hasStarted = { value: false };

    const handlePointerUpdate = (x: number, y: number) => {
      pointer.current.x = x;
      pointer.current.y = y;

      if (!hasStarted.value) {
        smoothPointer.current.x = x;
        smoothPointer.current.y = y;
        hasStarted.value = true;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      handlePointerUpdate(e.clientX - rect.left, e.clientY - rect.top);
    };

    const handleTouchUpdate = (e: TouchEvent) => {
      if (e.touches?.[0]) {
        const rect = section.getBoundingClientRect();
        handlePointerUpdate(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
      }
    };

    section.addEventListener('mousemove', handleMouseMove);
    section.addEventListener('touchstart', handleTouchUpdate, { passive: false });
    section.addEventListener('touchmove', handleTouchUpdate, { passive: false });

    const createBlob = (x: number, y: number, speed: number) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const baseRadius = 25 + speed * 15;

      gsap.set(circle, {
        attr: { cx: x, cy: y, r: 0 },
        fill: 'white',
      });

      maskGroupRef.current?.appendChild(circle);

      const tl = gsap.timeline({
        onComplete: () => {
          circle.remove();
          blobsRef.current = blobsRef.current.filter((b) => b.el !== circle);
        },
      });

      tl.to(circle, {
        attr: { r: baseRadius * CONFIG.expandMultiplier },
        duration: CONFIG.expandTime,
        ease: 'power2.out',
      }).to(circle, {
        attr: { r: 0 },
        opacity: 0,
        duration: CONFIG.dissolveTime,
        delay: -CONFIG.dissolveStart,
        ease: 'power3.in',
      });

      return { el: circle, tl };
    };

    let lastX = 0;
    let lastY = 0;

    const ticker = () => {
      smoothPointer.current.x +=
        (pointer.current.x - smoothPointer.current.x) * CONFIG.smoothing;
      smoothPointer.current.y +=
        (pointer.current.y - smoothPointer.current.y) * CONFIG.smoothing;

      const dx = smoothPointer.current.x - lastX;
      const dy = smoothPointer.current.y - lastY;
      const speed = Math.sqrt(dx * dx + dy * dy);

      if (speed > 2 && blobsRef.current.length < CONFIG.maxBlobs) {
        const blob = createBlob(smoothPointer.current.x, smoothPointer.current.y, speed * 0.1);
        blobsRef.current.push(blob);
      }

      lastX = smoothPointer.current.x;
      lastY = smoothPointer.current.y;
    };

    gsap.ticker.add(ticker);

    return () => {
      section.removeEventListener('mousemove', handleMouseMove);
      section.removeEventListener('touchstart', handleTouchUpdate);
      section.removeEventListener('touchmove', handleTouchUpdate);
      gsap.ticker.remove(ticker);
      blobsRef.current.forEach((b) => b.tl.kill());
    };
  }, []);

  return (
    <section className="smudge-revealer-section" ref={sectionRef}>
      <div className="smudge-container">
        <div className="smudge-text-wrapper">
          <h1 className="smudge-main-text">{RANDOM_TEXTS[textIndex]}</h1>

          <div className="smudge-reveal-layer">
            <p className="smudge-desc-text">
              &quot;The right room is built in details: the grain, the fabric, the scale, and the pieces that quietly work together.&quot;
            </p>
          </div>
        </div>
      </div>

      <svg className="smudge-revealer-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="smudge-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="25" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 60 -14"
              result="goo"
            />
          </filter>
          <mask id="smudge-mask">
            <g className="smudge-blobs" ref={maskGroupRef} filter="url(#smudge-goo)" />
          </mask>
        </defs>
      </svg>
    </section>
  );
}


