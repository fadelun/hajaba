'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Palette } from 'lucide-react';

export type HijabType = 'pashmina' | 'segiempat' | 'syari' | 'turban';

interface HijabControlsProps {
  onTypeChange: (type: HijabType) => void;
  onColorChange: (color: string) => void;
  onProcess: () => void;
  isProcessing: boolean;
}

const HIJAB_TYPES: { id: HijabType; label: string }[] = [
  { id: 'pashmina', label: 'Pashmina' },
  { id: 'segiempat', label: 'Segiempat' },
  { id: 'syari', label: 'Syar\'i' },
  { id: 'turban', label: 'Turban' },
];

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#8B4513', '#D2B48C', '#708090', '#4B0082', '#DC143C', '#2F4F4F'
];

export default function HijabControls({ onTypeChange, onColorChange, onProcess, isProcessing }: HijabControlsProps) {
  const [selectedType, setSelectedType] = useState<HijabType>('pashmina');
  const [selectedColor, setSelectedColor] = useState('#000000');

  const handleTypeSelect = (type: HijabType) => {
    setSelectedType(type);
    onTypeChange(type);
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    onColorChange(color);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 p-6 bg-white rounded-3xl border border-black/5 shadow-sm">
      <div className="space-y-4">
        <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Hijab Style</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {HIJAB_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => handleTypeSelect(type.id)}
              className={`
                px-4 py-3 rounded-xl text-sm font-medium transition-all
                ${selectedType === type.id 
                  ? 'bg-black text-white shadow-lg scale-105' 
                  : 'bg-black/5 text-black/60 hover:bg-black/10'}
              `}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Hijab Color</label>
          <div className="flex items-center gap-2">
            <input 
              type="color" 
              value={selectedColor}
              onChange={(e) => handleColorSelect(e.target.value)}
              className="w-6 h-6 rounded-md cursor-pointer border-none p-0"
            />
            <span className="text-xs font-mono uppercase">{selectedColor}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => handleColorSelect(color)}
              className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center transition-transform hover:scale-110"
              style={{ backgroundColor: color }}
            >
              {selectedColor === color && (
                <Check size={14} className={color === '#FFFFFF' ? 'text-black' : 'text-white'} />
              )}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onProcess}
        disabled={isProcessing}
        className={`
          w-full py-4 rounded-2xl font-bold text-lg transition-all
          flex items-center justify-center gap-2
          ${isProcessing 
            ? 'bg-black/20 text-black/40 cursor-not-allowed' 
            : 'bg-black text-white hover:bg-black/90 shadow-xl hover:shadow-2xl active:scale-[0.98]'}
        `}
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            <span>AI is styling...</span>
          </>
        ) : (
          <span>Apply Hijab</span>
        )}
      </button>
    </div>
  );
}
