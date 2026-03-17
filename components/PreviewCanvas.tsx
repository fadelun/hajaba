'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Download, Share2, Maximize2 } from 'lucide-react';

interface PreviewCanvasProps {
  original: string;
  modified: string | null;
}

export default function PreviewCanvas({ original, modified }: PreviewCanvasProps) {
  const [sliderPos, setSliderPos] = useState(50);

  const handleDownload = () => {
    if (!modified) return;
    const link = document.createElement('a');
    link.href = modified;
    link.download = `hajaba-styled-${Date.now()}.png`;
    link.click();
  };

  if (!modified) return null;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="relative rounded-3xl overflow-hidden aspect-square sm:aspect-video bg-black/5 group">
        {/* Original (Background) */}
        <img 
          src={original} 
          alt="Original" 
          className="absolute inset-0 w-full h-full object-contain"
        />

        {/* Modified (Foreground with Clip) */}
        <div 
          className="absolute inset-0 w-full h-full overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
          <img 
            src={modified} 
            alt="Modified" 
            className="absolute inset-0 w-full h-full object-contain"
          />
        </div>

        {/* Slider Handle */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white shadow-xl cursor-ew-resize z-10"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-2xl flex items-center justify-center">
            <div className="flex gap-0.5">
              <div className="w-0.5 h-3 bg-black/20 rounded-full" />
              <div className="w-0.5 h-3 bg-black/20 rounded-full" />
            </div>
          </div>
        </div>

        {/* Invisible Range Input for Slider */}
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={sliderPos} 
          onChange={(e) => setSliderPos(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
        />

        {/* Labels */}
        <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-md text-white text-[10px] uppercase tracking-widest rounded-full pointer-events-none">
          Before
        </div>
        <div className="absolute bottom-4 right-4 px-3 py-1 bg-white/50 backdrop-blur-md text-black text-[10px] uppercase tracking-widest rounded-full pointer-events-none">
          After
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-bold hover:bg-black/80 transition-all"
        >
          <Download size={18} />
          <span>Download HD</span>
        </button>
        <button className="flex items-center gap-2 bg-black/5 text-black px-6 py-3 rounded-2xl font-bold hover:bg-black/10 transition-all">
          <Share2 size={18} />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
}
