import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MoreHorizontal, Bell, Star, Trash2, Plus, SendHorizontal } from "lucide-react";
import { Notizia } from "@/src/types";
import { NOTIZIA_STATUS_COLORS, NOTIZIA_STATUS_LABELS, NOTIZIA_STATUSES } from "./notizieConfig";
import { cn, formatCurrency } from "@/src/lib/utils";

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
  const [showEmojiInput, setShowEmojiInput] = useState(false);
  const [customEmoji, setCustomEmoji] = useState("");
  const [commentText, setCommentText] = useState("");
  const [showCommentSuccess, setShowCommentSuccess] = useState(false);
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
    setShowEmojiInput(false);
    setCustomEmoji("");
    setCommentText("");
    setShowCommentSuccess(false);
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

  const dark = isDarkColor(notizia.card_color);

  return (
    <>
      <motion.div
        layout
        initial={false}
        animate={{
          rotate: isDragging ? 1 : 0,
          scale: isDragging ? 1.02 : 1,
          y: isDragging ? 0 : 0,
        }}
        whileHover={!isDragging && !isOnShot ? { y: -1, borderColor: 'var(--border-medium)' } : {}}
        onClick={() => onClick(notizia)}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "group relative flex flex-col gap-2 p-3 bg-white border border-[var(--border-light)] rounded-[10px] cursor-pointer transition-all duration-150 ease-in-out",
          isDragging && "shadow-[0_12px_40px_rgba(0,0,0,0.16)] z-50",
          !isDragging && "hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
          isOnShot ? "bg-[#F5E642] border-[#F5E642] text-[#5C5500]" : "border-l-[3px]"
        )}
        style={{
          borderLeftColor: !isOnShot ? statusColor : undefined,
          backgroundColor: notizia.card_color || (isOnShot ? "#F5E642" : undefined),
          color: notizia.card_color ? (dark ? '#FFFFFF' : '#1A1A18') : undefined,
        }}
      >
        {/* Row 1: Emoji + Name + Menu */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 overflow-hidden">
            <span className="text-[16px] flex-shrink-0">{notizia.emoji || '🏠'}</span>
            <span className="font-outfit font-medium text-[13px] leading-tight line-clamp-2" style={{ color: 'inherit', opacity: 1 }}>
              {notizia.name}
            </span>
          </div>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 -mr-1 hover:bg-black/5 rounded" style={{ color: 'inherit' }}>
            <MoreHorizontal size={14} />
          </button>
        </div>

        {/* Row 2: Zona */}
        {notizia.zona && (
          <div className={cn(
            "text-[11px] truncate",
            isOnShot ? "text-[#5C5500]/70" : ""
          )} style={{ color: 'inherit', opacity: 0.75 }}>
            {notizia.zona}
          </div>
        )}

        {/* Row 3: Prezzo */}
        {notizia.prezzo_richiesto && (
          <div className="font-outfit font-medium text-[12px]" style={{ color: 'inherit', opacity: 1 }}>
            {formatCurrency(notizia.prezzo_richiesto)}
          </div>
        )}

        {/* Footer: Rating + Bell */}
        {(notizia.rating || hasUrgentReminder) && (
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-0.5" style={{ color: 'inherit' }}>
              {notizia.rating && Array.from({ length: notizia.rating }).map((_, i) => (
                <Star key={i} size={10} fill="currentColor" className={isOnShot ? "text-[#5C5500]" : (notizia.card_color && dark ? "text-white" : "text-amber-400")} style={{ color: 'inherit' }} />
              ))}
            </div>
            {hasUrgentReminder && (
              <Bell size={12} className={isOnShot ? "text-[#5C5500]" : (notizia.card_color && dark ? "text-white" : "text-rose-500")} style={{ color: 'inherit' }} />
            )}
          </div>
        )}
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
              className="fixed z-[110] bg-white border border-[#E4E3DE] rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.15),0_4px_16px_rgba(0,0,0,0.08)] p-4 min-w-[260px] max-w-[300px] max-h-[80vh] overflow-y-auto flex flex-col gap-6"
              style={{
                left: Math.min(menuPos.x, window.innerWidth - 300),
                top: Math.min(menuPos.y, window.innerHeight - 500)
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
                <span className="text-[9px] uppercase tracking-[0.12em] text-[#9B9B95] font-sans font-medium mb-2">Emoji</span>
                <div className="grid grid-cols-6 gap-1">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onEmojiChange?.(notizia.id, emoji);
                        closeMenu();
                      }}
                      className={cn(
                        "w-[36px] h-[36px] flex items-center justify-center text-[20px] rounded-[10px] transition-all",
                        notizia.emoji === emoji ? "bg-[#1A1A18] grayscale-0" : "hover:bg-[#EFEEEA]"
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowEmojiInput(!showEmojiInput)}
                    className="w-[36px] h-[36px] flex items-center justify-center border border-dashed border-[#D1D0CB] rounded-[10px] hover:bg-[#EFEEEA] transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                {showEmojiInput && (
                  <div className="flex gap-2 mt-2">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Emoji..."
                      value={customEmoji}
                      onChange={(e) => setCustomEmoji(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customEmoji) {
                          onEmojiChange?.(notizia.id, customEmoji);
                          closeMenu();
                        }
                      }}
                      className="flex-1 bg-[#EFEEEA] border-0 rounded-[10px] px-3 py-1.5 text-[12px] font-sans outline-none"
                    />
                  </div>
                )}
              </div>

              {/* COLORE CARD */}
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-[0.12em] text-[#9B9B95] font-sans font-medium mb-2">Colore Card</span>
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
                  <label className="text-[10px] text-[var(--text-secondary)] font-sans font-medium cursor-pointer hover:underline flex items-center gap-1">
                    Altro colore...
                    <input 
                      type="color" 
                      className="sr-only" 
                      onChange={(e) => {
                        onColorChange?.(notizia.id, e.target.value);
                        closeMenu();
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* COMMENTO RAPIDO */}
              <div className="flex flex-col pt-4 border-t border-[var(--border-light)]">
                <span className="text-[9px] uppercase tracking-[0.12em] text-[#9B9B95] font-sans font-medium mb-2">Commento Rapido</span>
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
                  className="w-full bg-[#EFEEEA] border-0 rounded-[10px] p-[8px_10px] text-[12px] font-sans resize-none outline-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-[var(--text-muted)]">Invio con ↵</span>
                  {showCommentSuccess ? (
                    <span className="h-7 flex items-center text-emerald-600 text-[11px] font-sans font-medium">
                      ✓ Salvato
                    </span>
                  ) : (
                    <button
                      onClick={handleSendComment}
                      className="h-7 px-3 bg-[#1A1A18] text-white rounded-full flex items-center gap-1.5 transition-transform active:scale-95"
                    >
                      <span className="text-[11px] font-sans font-medium">Invia</span>
                      <SendHorizontal size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* ELIMINA */}
              <div className="pt-4 border-t border-[#F5A0B0]/20">
                <button
                  onClick={() => {
                    onDelete?.(notizia.id);
                    closeMenu();
                  }}
                  className="flex items-center gap-2 text-[#E57373] hover:text-[#C62828] transition-colors text-[12px] font-sans font-medium"
                >
                  <Trash2 size={14} />
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
