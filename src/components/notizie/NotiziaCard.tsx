import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MoreHorizontal, Bell, Star, Trash2, Plus, SendHorizontal } from "lucide-react";
import { Notizia } from "@/src/types";
import { NOTIZIA_STATUS_COLORS, NOTIZIA_STATUS_LABELS, NOTIZIA_STATUSES } from "./notizieConfig";
import { cn, formatCurrency } from "@/src/lib/utils";
import { useFavoriteColors } from '@/src/hooks/useFavoriteColors';

interface NotiziaCardProps {
  notizia: Notizia;
  onClick: (notizia: Notizia) => void;
  onStatusChange?: (id: string, status: string) => void;
  onEmojiChange?: (id: string, emoji: string) => void;
  onColorChange?: (id: string, color: string | null) => void;
  onUpdate?: (id: string, updates: Partial<Notizia>) => void;
  onDelete?: (id: string) => void;
  isDragging?: boolean;
}

const QUICK_EMOJIS = ["📋", "🏠", "🏡", "🏰", "🏛️", "🌳", "🌊", "⭐", "🔥", "💎", "🎯", "📞"];

function isDarkColor(hex: string | null): boolean {
  if (!hex) return false;
  const h = hex.replace('#', '');
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // Perceived luminance formula
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

const CARD_COLORS = [
  '#FFFFFF', '#fef9e7', '#fef3c7', '#fde68a',
  '#e8f8e8', '#b5f0c0', '#6ddba0', '#38c77e',
  '#dce8fc', '#b0ccf8', '#6fa2f0', '#3b7de8',
  '#f8e0ec', '#f0b0cc', '#e87aaa', '#d8488a'
];

export const NotiziaCard: React.FC<NotiziaCardProps> = ({ 
  notizia, 
  onClick, 
  onStatusChange,
  onEmojiChange,
  onColorChange,
  onUpdate,
  onDelete,
  isDragging 
}) => {
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [commentText, setCommentText] = useState("");
  const [showCommentSuccess, setShowCommentSuccess] = useState(false);
  const [customColorValue, setCustomColorValue] = useState<string>('');
  const { favorites, addColor } = useFavoriteColors();
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const isOnShot = notizia.status === 'on_shot';
  const statusColor = NOTIZIA_STATUS_COLORS[notizia.status as keyof typeof NOTIZIA_STATUS_COLORS] || '#ccc';

  // Check if reminder is within 48h
  const hasUrgentReminder = React.useMemo(() => {
    if (!notizia.reminder_date) return false;
    const reminder = new Date(notizia.reminder_date);
    const now = new Date();
    const diff = reminder.getTime() - now.getTime();
    return diff > 0 && diff < 48 * 60 * 60 * 1000;
  }, [notizia.reminder_date]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      // Long press detected
    }, 500);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const closeMenu = () => {
    setMenuPos(null);
    setCommentText("");
    setShowCommentSuccess(false);
    setCustomColorValue('');
  };

  const handleSendComment = () => {
    if (!commentText.trim()) return;

    const newComment = {
      id: crypto.randomUUID(),
      text: commentText.trim(),
      created_at: new Date().toISOString()
    };

    onUpdate?.(notizia.id, {
      comments: [...(notizia.comments || []), newComment]
    });

    setCommentText("");
    setShowCommentSuccess(true);
    setTimeout(() => setShowCommentSuccess(false), 1500);
  };

  const lastComment = notizia.comments && notizia.comments.length > 0 
    ? notizia.comments[notizia.comments.length - 1] 
    : null;

  const dark = isDarkColor(notizia.card_color);
  
  const textColor = notizia.card_color
    ? (dark ? '#ffffff' : '#1A1A18')
    : 'var(--text-primary)';
  
  const textMutedColor = notizia.card_color
    ? (dark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.45)')
    : 'var(--text-muted)';
  
  const badgeBg = notizia.card_color
    ? (dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)')
    : 'var(--bg-subtle)';
  
  const badgeColor = notizia.card_color
    ? (dark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.5)')
    : 'var(--text-muted)';

  return (
    <>
      <motion.div
        initial={false}
        animate={isDragging ? {} : {
          rotate: 0,
          scale: 1,
          y: 0,
        }}
        whileHover={!isDragging && !isOnShot ? { y: -2, boxShadow: 'var(--shadow-card-hover)' } : {}}
        onClick={() => onClick(notizia)}
        onContextMenu={handleContextMenu}
        className={cn(
          "group relative flex flex-col border border-[var(--border-light)] rounded-[14px] cursor-pointer px-4 pt-3.5 pb-3",
          isDragging ? "shadow-[0_12px_40px_rgba(0,0,0,0.16)] z-50" : "shadow-[var(--shadow-card)] transition-all duration-150 ease-in-out"
        )}
        style={{ backgroundColor: notizia.card_color || 'white' }}
      >
        {/* ROW 1: type label + menu */}
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
            {notizia.emoji && notizia.emoji !== '' && (
              <div className="text-[14px] w-6 h-6 flex items-center justify-center">
                {notizia.emoji}
              </div>
            )}
            <div 
              className="font-outfit font-semibold text-[9px] uppercase tracking-[0.1em] px-[7px] py-[2px] rounded-full"
              style={{ backgroundColor: badgeBg, color: badgeColor }}
            >
              {notizia.type || 'NOTIZIA'}
            </div>
          </div>
          <button 
            className="hover:opacity-70 transition-colors"
            style={{ color: textMutedColor }}
          >
            <MoreHorizontal size={16} />
          </button>
        </div>

        {/* ROW 2: title */}
        <h3 
          className="font-outfit font-semibold text-[14px] leading-[1.3] line-clamp-2 mt-1"
          style={{ color: textColor }}
        >
          {notizia.name}
        </h3>

        {/* ROW 3: dot rating */}
        <div className="flex gap-1.5 my-2.5">
          {[1, 2, 3, 4, 5].map((dot) => (
            <button
              key={dot}
              onClick={(e) => {
                e.stopPropagation();
                onUpdate?.(notizia.id, { rating: dot === notizia.rating ? dot - 1 : dot });
              }}
              className={cn(
                "w-2 h-2 rounded-full transition-all"
              )}
              style={{ 
                backgroundColor: notizia.card_color 
                  ? (dot <= (notizia.rating || 0) ? (dark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.75)') : (dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'))
                  : (dot <= (notizia.rating || 0) ? 'var(--text-primary)' : 'rgba(0,0,0,0.1)')
              }}
            />
          ))}
        </div>

        {/* ROW 4: bottom row */}
        <div className="flex items-center justify-between mt-auto pt-1">
          {lastComment ? (
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span 
                className="text-[10px] truncate italic"
                style={{ color: textMutedColor }}
              >
                "{lastComment.text}"
              </span>
            </div>
          ) : (
            <div />
          )}
          <span 
            className="font-outfit font-normal text-[11px] flex-shrink-0"
            style={{ color: textMutedColor }}
          >
            {new Date(notizia.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
          </span>
        </div>
      </motion.div>

      <AnimatePresence>
        {menuPos && (
          <>
            <div 
              className="fixed inset-0 z-[100] bg-transparent" 
              onClick={closeMenu}
              onContextMenu={(e) => { e.preventDefault(); closeMenu(); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed z-[110] bg-white border border-[#E4E3DE] rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.15),0_4px_16px_rgba(0,0,0,0.08)] p-4 min-w-[260px] w-[90vw] sm:w-auto sm:max-w-[300px] flex flex-col gap-6"
              style={{
                left: window.innerWidth < 640 ? '5vw' : Math.min(menuPos.x, window.innerWidth - 300),
                top: Math.min(menuPos.y, Math.max(0, window.innerHeight - 600))
              }}
            >
              {/* STATO */}
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-[0.12em] text-[#9B9B95] font-sans font-medium mb-2">Stato</span>
                <div className="flex flex-wrap gap-1.5">
                  {NOTIZIA_STATUSES.map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        onStatusChange?.(notizia.id, status);
                        closeMenu();
                      }}
                      className={cn(
                        "h-6 px-[10px] rounded-full text-[11px] font-sans font-medium transition-all",
                        notizia.status === status ? "ring-2 ring-offset-1 ring-current" : "opacity-80 hover:opacity-100"
                      )}
                      style={{ 
                        backgroundColor: NOTIZIA_STATUS_COLORS[status as keyof typeof NOTIZIA_STATUS_COLORS] + '20',
                        color: NOTIZIA_STATUS_COLORS[status as keyof typeof NOTIZIA_STATUS_COLORS]
                      }}
                    >
                      {NOTIZIA_STATUS_LABELS[status as keyof typeof NOTIZIA_STATUS_LABELS]}
                    </button>
                  ))}
                </div>
              </div>

              {/* EMOJI */}
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-[0.12em] text-[#9B9B95] font-sans font-medium mb-1.5">Emoji</span>
                <div className="grid grid-cols-6 gap-1">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onEmojiChange?.(notizia.id, emoji);
                        closeMenu();
                      }}
                      className={cn(
                        "w-7 h-7 flex items-center justify-center text-[16px] rounded-[8px] transition-all hover:bg-[#EFEEEA]",
                        notizia.emoji === emoji && "bg-[#EFEEEA] ring-1 ring-black/20"
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                {console.log('Notizia emoji:', notizia.emoji)}
                {notizia.emoji && notizia.emoji !== '' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEmojiChange?.(notizia.id, '');
                      closeMenu();
                    }}
                    className="w-full mt-1 py-1.5 text-[11px] font-sans text-[#E57373] hover:text-[#C62828] hover:bg-red-50 rounded-[10px] transition-colors flex items-center justify-center gap-1"
                  >
                    ✕ Rimuovi emoji
                  </button>
                )}
              </div>

              {/* COLORE CARD */}
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-[0.12em] text-[#9B9B95] font-sans font-medium mb-1.5">Colore Card</span>
                <div className="grid grid-cols-8 gap-[6px]">
                  <button
                    onClick={() => {
                      onColorChange?.(notizia.id, null);
                      closeMenu();
                    }}
                    className={cn(
                      "w-6 h-6 rounded-full border-[1.5px] border-[#D1D0CB] bg-white relative overflow-hidden",
                      !notizia.card_color && "ring-2 ring-offset-1 ring-gray-400"
                    )}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-[1px] bg-rose-400 rotate-45" />
                    </div>
                  </button>
                  {CARD_COLORS.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        onColorChange?.(notizia.id, color);
                        closeMenu();
                      }}
                      className={cn(
                        "w-6 h-6 rounded-full border border-black/5 transition-transform hover:scale-110",
                        notizia.card_color === color && "ring-2 ring-offset-1 ring-gray-400"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="mt-2">
                  {/* Custom color picker + save */}
                  <div className="mt-2 flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer group">
                      <div
                        className="w-6 h-6 rounded-full border border-black/10 overflow-hidden relative"
                        style={{ backgroundColor: customColorValue || '#ffffff' }}
                      >
                        <input
                          type="color"
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          value={customColorValue || '#ffffff'}
                          onChange={(e) => setCustomColorValue(e.target.value)}
                        />
                      </div>
                      <span className="text-[10px] text-[var(--text-secondary)] font-sans font-medium group-hover:underline">
                        Altro colore...
                      </span>
                    </label>
                    {customColorValue && (
                      <button
                        onClick={() => {
                          onColorChange?.(notizia.id, customColorValue);
                          addColor(customColorValue);
                          closeMenu();
                        }}
                        className="text-[10px] px-2 py-0.5 bg-[#1A1A18] text-white rounded-full font-sans font-medium"
                      >
                        Salva
                      </button>
                    )}
                  </div>

                  {/* Saved custom colors */}
                  {favorites.length > 0 && (
                    <div className="mt-2">
                      <span className="text-[9px] uppercase tracking-[0.12em] text-[#9B9B95] font-sans font-medium block mb-1.5">
                        Salvati
                      </span>
                      <div className="flex gap-1.5 flex-wrap">
                        {favorites.map((color) => (
                          <button
                            key={color}
                            onClick={() => { onColorChange?.(notizia.id, color); closeMenu(); }}
                            className={cn(
                              "w-6 h-6 rounded-full border border-black/5 transition-transform hover:scale-110",
                              notizia.card_color === color && "ring-2 ring-offset-1 ring-gray-400"
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* COMMENTO RAPIDO */}
              <div className="flex flex-col pt-2 border-t border-[var(--border-light)]">
                <span className="text-[9px] uppercase tracking-[0.12em] text-[#9B9B95] font-sans font-medium mb-1.5">Commento Rapido</span>
                <textarea
                  rows={2}
                  placeholder="Aggiungi commento..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendComment();
                    }
                  }}
                  className="w-full bg-[#EFEEEA] border-0 rounded-[10px] p-[6px_8px] text-[12px] font-sans resize-none outline-none"
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[9px] text-[var(--text-muted)]">Invio con ↵</span>
                  <button
                    onClick={handleSendComment}
                    className="h-6 px-2.5 bg-[#1A1A18] text-white rounded-full flex items-center gap-1.5 transition-transform active:scale-95"
                  >
                    <span className="text-[10px] font-sans font-medium">Invia</span>
                    <SendHorizontal size={12} />
                  </button>
                </div>
              </div>

              {/* ELIMINA */}
              <div className="pt-2 border-t border-[#F5A0B0]/20">
                {notizia.emoji && notizia.emoji !== '' && (
                  <button
                    onClick={() => { onEmojiChange?.(notizia.id, ''); closeMenu(); }}
                    className="flex items-center gap-2 text-[11px] font-sans text-[#9B9B95] hover:text-[#E57373] transition-colors mb-2"
                  >
                    ✕ Rimuovi emoji
                  </button>
                )}
                <button
                  onClick={() => {
                    onDelete?.(notizia.id);
                    closeMenu();
                  }}
                  className="flex items-center gap-2 text-[#E57373] hover:text-[#C62828] transition-colors text-[11px] font-sans font-medium"
                >
                  <Trash2 size={12} />
                  Elimina notizia
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
