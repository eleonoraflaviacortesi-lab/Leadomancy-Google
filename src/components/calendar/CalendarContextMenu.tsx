import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Palette, X } from "lucide-react";
import { useFavoriteColors } from "@/src/hooks/useFavoriteColors";
import { useCategoryColors } from "@/src/hooks/useCategoryColors";

interface CalendarContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  onColorSelect: (color: string | null) => void;
}

const COLORS = [
  '#FCD34D', '#6EE7B7', '#93C5FD', '#C4B5FD',
  '#F9A8D4', '#FCA5A5', '#86EFAC', '#67E8F9',
  '#FDE68A', '#A5B4FC', '#F0ABFC', '#FB923C',
];

export const CalendarContextMenu: React.FC<CalendarContextMenuProps> = ({
  x, y, isOpen, onClose, onColorSelect
}) => {
  const { favorites } = useFavoriteColors();
  const { colors } = useCategoryColors();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Adjust position to keep menu within viewport
  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 300);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1 }}
          style={{
            position: 'fixed',
            left: adjustedX,
            top: adjustedY,
            zIndex: 1000,
          }}
          className="w-[200px] bg-white rounded-[16px] shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-[var(--border-light)] p-4 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette size={14} className="text-[var(--text-muted)]" />
              <span className="text-[10px] font-outfit font-bold text-[var(--text-muted)] uppercase tracking-widest">
                Cambia Colore
              </span>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-[var(--bg-subtle)] rounded-full transition-colors">
              <X size={14} className="text-[var(--text-muted)]" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {/* Category Colors */}
            {Object.values(colors).map((color: any) => (
              <button
                key={color}
                onClick={() => {
                  onColorSelect(color);
                  onClose();
                }}
                className="w-8 h-8 rounded-full border border-black/10 cursor-pointer transition-transform hover:scale-110 active:scale-95 shadow-sm"
                style={{ backgroundColor: color }}
              />
            ))}
            
            <div className="col-span-4 h-px bg-[var(--border-light)] my-1" />

            {COLORS.map(color => (
              <button
                key={color}
                onClick={() => {
                  onColorSelect(color);
                  onClose();
                }}
                className="w-8 h-8 rounded-full border-none cursor-pointer transition-transform hover:scale-110 active:scale-95 shadow-sm"
                style={{ backgroundColor: color }}
              />
            ))}
            {favorites.map(color => (
              <button
                key={color}
                onClick={() => {
                  onColorSelect(color);
                  onClose();
                }}
                className="w-8 h-8 rounded-full border-none cursor-pointer transition-transform hover:scale-110 active:scale-95 shadow-sm ring-1 ring-black/5"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <button
            onClick={() => {
              onColorSelect(null);
              onClose();
            }}
            className="w-full py-2 bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] rounded-[8px] text-[11px] font-outfit font-bold uppercase tracking-wider text-[var(--text-muted)] transition-colors"
          >
            Rimuovi Colore
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
