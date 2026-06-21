import { useState } from 'react';
import './landing.css';

export default function SmudgeRevealer() {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
  };

  return (
    <section 
      className="smudge-revealer-section" 
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos({ x: -1000, y: -1000 })}
    >
      <svg className="smudge-revealer-svg">
        <defs>
          <filter id="blur-filter">
             <feGaussianBlur stdDeviation="30" />
          </filter>
          <mask id="smudge-mask">
            <rect width="100%" height="100%" fill="black" />
            <circle 
              cx={mousePos.x} 
              cy={mousePos.y} 
              r="120" 
              fill="white" 
              filter="url(#blur-filter)" 
              className="smudge-blobs"
              style={{ transition: 'cx 0.05s linear, cy 0.05s linear' }}
            />
          </mask>
        </defs>
      </svg>
      
      <div className="smudge-container">
        <div className="smudge-text-wrapper">
          <h2 className="smudge-main-text">REVEAL THE MAGIC</h2>
        </div>
        
        <div className="smudge-reveal-layer">
          <h2 className="smudge-desc-text">BEAUTIFUL DESIGN</h2>
        </div>
      </div>
    </section>
  );
}
