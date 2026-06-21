import { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './mosaic.css';

const TILES_X = 12;
const TILES_Y = 9;
const TILE_SIZE = 60;
const PREVIEW_WIDTH = TILES_X * TILE_SIZE;
const PREVIEW_HEIGHT = TILES_Y * TILE_SIZE;

const TILE_FACES = [
  'face-front',
  'face-rear',
  'face-right',
  'face-left',
  'face-top',
  'face-bottom',
] as const;

const PROJECT_IMAGES = ['/cosmos_274774162.jpeg', '/cosmos_1986499382.jpeg'];

type TileData = {
  element: HTMLDivElement;
  faces: Record<string, HTMLDivElement>;
  row: number;
  col: number;
};

export default function MosaicCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const tilesRef = useRef<TileData[]>([]);
  const currentIndexRef = useRef(0);
  const isRotatingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rotateCarouselRef = useRef<((direction?: number) => void) | null>(null);

  const breathe = useCallback((tileElement: HTMLDivElement) => {
    gsap.to(tileElement, {
      z: gsap.utils.random(-40, 40),
      duration: gsap.utils.random(0.6, 1.4),
      ease: 'sine.inOut',
      onComplete: () => breathe(tileElement),
    });
  }, []);

  function setTileImage(tile: TileData, side: string, imagePath: string) {
    const face = tile.faces[side];
    if (!face) return;
    const offsetX = -(tile.col * TILE_SIZE);
    const offsetY = -(tile.row * TILE_SIZE);

    face.style.backgroundImage = `url(${imagePath})`;
    face.style.backgroundSize = `${PREVIEW_WIDTH}px ${PREVIEW_HEIGHT}px`;
    face.style.backgroundPosition = `${offsetX}px ${offsetY}px`;
  }

  const startAutoSlide = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      rotateCarouselRef.current?.(1);
    }, 3000);
  }, []);

  const rotateCarousel = useCallback(
    (direction = 1) => {
      if (isRotatingRef.current) return;
      isRotatingRef.current = true;

      const nextIndex =
        (currentIndexRef.current + direction + PROJECT_IMAGES.length) % PROJECT_IMAGES.length;
      const isReturningToFront = nextIndex === 0;
      const targetRotation = isReturningToFront ? 0 : 180;

      gsap.to(
        tilesRef.current.map((t) => t.element),
        {
          rotationY: targetRotation,
          duration: 1.5,
          ease: 'power4.inOut',
          stagger: {
            grid: [TILES_Y, TILES_X],
            from: 'center',
            amount: 1.2,
          },
          onComplete: () => {
            currentIndexRef.current = nextIndex;
            isRotatingRef.current = false;
          },
        }
      );

      startAutoSlide();
    },
    [startAutoSlide]
  );

  useEffect(() => {
    rotateCarouselRef.current = rotateCarousel;
  }, [rotateCarousel]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';
    tilesRef.current = [];

    for (let row = 0; row < TILES_Y; row++) {
      for (let col = 0; col < TILES_X; col++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.style.left = `${col * TILE_SIZE}px`;
        tile.style.top = `${row * TILE_SIZE}px`;

        const faces: Record<string, HTMLDivElement> = {};
        TILE_FACES.forEach((side) => {
          const face = document.createElement('div');
          face.className = `tile-face ${side}`;
          tile.appendChild(face);
          faces[side] = face;
        });

        faces['face-top']!.style.backgroundColor = '#222';
        faces['face-bottom']!.style.backgroundColor = '#222';
        faces['face-right']!.style.backgroundColor = '#222';
        faces['face-left']!.style.backgroundColor = '#222';

        container.appendChild(tile);
        const tileData: TileData = { element: tile, faces, row, col };
        tilesRef.current.push(tileData);

        setTileImage(tileData, 'face-front', PROJECT_IMAGES[0]!);
        setTileImage(tileData, 'face-rear', PROJECT_IMAGES[1]!);
      }
    }

    tilesRef.current.forEach((tile, i) => {
      gsap.delayedCall(i * 0.015, () => breathe(tile.element));
    });

    startAutoSlide();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [breathe, startAutoSlide]);

  return (
    <div className="mosaic-wrapper">
      <div className="mosaic-title">
        <div className="landing-section-label">Furniture Showcase</div>
        <h2>Material Mosaic</h2>
        <p>Browse textures, finishes, and room-ready inspiration</p>
      </div>

      <div className="mosaic-main-ui">
        <button
          className="mosaic-nav-btn prev"
          onClick={() => rotateCarousel(-1)}
          aria-label="Previous"
        >
          <ChevronLeft size={32} />
        </button>

        <div className="mosaic-container" ref={containerRef} />

        <button
          className="mosaic-nav-btn next"
          onClick={() => rotateCarousel(1)}
          aria-label="Next"
        >
          <ChevronRight size={32} />
        </button>
      </div>
    </div>
  );
}

