import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/src/lib/utils';
import { Check, Plus } from 'lucide-react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
  palette?: string[];
}

const DEFAULT_PALETTE = [
  '#000000', '#262626', '#4A4A4A', '#9B9B95',
  '#C5A059', '#D4AF37', '#E6D5B8', '#F5F5DC',
  '#F5F5F0', '#FFFFFF', '#1B4332', '#2D3E50',
  '#722F37', '#991B1B', '#B4C6E7', '#F0F8FF'
];

export const ColorPicker: React.FC<ColorPickerProps> = ({ 
  color, 
  onChange, 
  className,
  palette = DEFAULT_PALETTE
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full p-2 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-all outline-none focus:ring-2 focus:ring-black/5"
      >
        <div 
          className="w-6 h-6 rounded-lg border border-black/5 flex-shrink-0 shadow-sm"
          style={{ backgroundColor: color }}
        />
        <span className="font-outfit font-mono text-[11px] uppercase tracking-wider text-gray-500 flex-1 text-left">
          {color || '#000000'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 p-3 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[100] w-[220px] animate-in fade-in zoom-in duration-200">
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-3 ml-1">Seleziona Colore</p>
          <div className="grid grid-cols-4 gap-2">
            {palette.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  onChange(c);
                  setIsOpen(false);
                }}
                className={cn(
                  "h-9 w-full rounded-lg transition-all duration-200 flex items-center justify-center relative",
                  color === c ? "ring-2 ring-black ring-offset-1 scale-105" : "hover:scale-105 hover:opacity-80"
                )}
                style={{ backgroundColor: c, border: c.toLowerCase() === '#ffffff' ? '1px solid #e5e7eb' : 'none' }}
              >
                {color === c && (
                  <Check size={14} className={cn(
                    c.toLowerCase() === '#ffffff' || c.toLowerCase() === '#f5f5f0' ? "text-black" : "text-white"
                  )} />
                )}
              </button>
            ))}
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: color }} />
            <input 
              type="text" 
              value={color}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#000000"
              className="flex-1 text-[11px] font-mono uppercase bg-transparent outline-none text-gray-700"
            />
            <div className="relative overflow-hidden w-6 h-6 rounded-full cursor-pointer border border-black/10">
              <Plus size={12} className="absolute inset-0 m-auto text-gray-400" />
              <input 
                type="color" 
                value={color}
                onChange={(e) => onChange(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
