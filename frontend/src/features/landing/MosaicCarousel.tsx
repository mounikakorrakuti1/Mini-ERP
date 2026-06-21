import { useState } from 'react';
import './landing.css';

const MOSAICS = [
  "/furnexa/ezgif-frame-001.jpg",
  "/furnexa/ezgif-frame-030.jpg",
  "/furnexa/ezgif-frame-060.jpg",
  "/furnexa/ezgif-frame-090.jpg"
];

const COLS = 12;
const ROWS = 9;

export default function MosaicCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rotationY, setRotationY] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % MOSAICS.length);
    setRotationY(prev => prev - 90);
  };
  
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + MOSAICS.length) % MOSAICS.length);
    setRotationY(prev => prev + 90);
  };

  const getFaceImage = (faceIndex: number) => {
    return MOSAICS[faceIndex % MOSAICS.length];
  };

  const tiles = Array.from({ length: COLS * ROWS }).map((_, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const delay = (col + row) * 0.05;

    return (
      <div
        key={i}
        className="tile"
        style={{
          left: `${col * 60}px`,
          top: `${row * 60}px`,
          transform: `translateZ(-30px) rotateX(0deg) rotateY(${rotationY}deg)`,
          transition: `transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${delay}s`
        }}
      >
        <div className="tile-face face-front" style={{ backgroundImage: `url(${getFaceImage(0)})`, backgroundPosition: `-${col * 60}px -${row * 60}px` }}></div>
        <div className="tile-face face-right" style={{ backgroundImage: `url(${getFaceImage(1)})`, backgroundPosition: `-${col * 60}px -${row * 60}px` }}></div>
        <div className="tile-face face-rear" style={{ backgroundImage: `url(${getFaceImage(2)})`, backgroundPosition: `-${col * 60}px -${row * 60}px` }}></div>
        <div className="tile-face face-left" style={{ backgroundImage: `url(${getFaceImage(3)})`, backgroundPosition: `-${col * 60}px -${row * 60}px` }}></div>
        <div className="tile-face face-top" style={{ backgroundColor: '#222' }}></div>
        <div className="tile-face face-bottom" style={{ backgroundColor: '#222' }}></div>
      </div>
    );
  });

  return (
    <div className="mosaic-wrapper">
      <div className="mosaic-title">
         <h2>Visual Insights</h2>
         <p>Discover real-time analytics and reporting seamlessly.</p>
      </div>
      <div className="mosaic-main-ui">
        <button className="mosaic-nav-btn" onClick={handlePrev}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="mosaic-container">
           {tiles}
        </div>
        <button className="mosaic-nav-btn" onClick={handleNext}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  );
}
