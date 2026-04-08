import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MoreHorizontal, Bell, Trash2, Plus, SendHorizontal, Sparkles } from "lucide-react";
import { Cliente } from "@/src/types";
import { CLIENTE_STATUS_CONFIG } from "./clienteFormOptions";
import { cn, formatCurrency } from "@/src/lib/utils";
import { useAuth } from "@/src/hooks/useAuth";
import { useFavoriteColors } from '@/src/hooks/useFavoriteColors';

interface ClienteCardProps {
  cliente: Cliente;
  onClick: (cliente: Cliente) => void;
  onStatusChange?: (id: string, status: string) => void;
  onEmojiChange?: (id: string, emoji: string) => void;
  onColorChange?: (id: string, color: string | null) => void;
  onUpdate?: (id: string, updates: Partial<Cliente>) => void;
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

export const ClienteCard: React.FC<ClienteCardProps> = ({ 
  cliente, 
  onClick, 
  onStatusChange,
  onEmojiChange,
  onColorChange,
  onUpdate,
  onDelete,
  isDragging 
}) => {
  const { user } = useAuth();
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [commentText, setCommentText] = useState("");
  const [showCommentSuccess, setShowCommentSuccess] = useState(false);
  const [customColorValue, setCustomColorValue] = useState<string>('');
  const { favorites, addColor } = useFavoriteColors();
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const statusConfig = CLIENTE_STATUS_CONFIG[cliente.status] || CLIENTE_STATUS_CONFIG.new;

  // Check if reminder is within 48h
  const hasUrgentReminder = React.useMemo(() => {
    if (!cliente.reminder_date) return false;
    const reminder = new Date(cliente.reminder_date);
    const now = new Date();
    const diff = reminder.getTime() - now.getTime();
    return diff > 0 && diff < 48 * 60 * 60 * 1000;
  }, [cliente.reminder_date]);

  const displayedRegioni = cliente.regioni?.slice(0, 2) || [];
  const remainingRegioniCount = (cliente.regioni?.length || 0) - 2;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      // Long press detected
    }, 500);
  };

  const handleTouchEnd = () => {
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
      created_at: new Date().toISOString(),
      author: user?.full_name || 'Agente',
      authorId: user?.user_id
    };

    onUpdate?.(cliente.id, {
      comments: [...(cliente.comments || []), newComment]
    });

    setCommentText("");
    setShowCommentSuccess(true);
    setTimeout(() => setShowCommentSuccess(false), 1500);
  };

  const isTally = cliente.portale === 'TALLY' || !!cliente.tally_submission_id;

  const lastComment = cliente.comments && cliente.comments.length > 0 
    ? cliente.comments[cliente.comments.length - 1] 
    : null;

  const dark = isDarkColor(cliente.card_color);
  
  const textColor = cliente.card_color
    ? (dark ? '#ffffff' : '#1A1A18')
    : 'var(--text-primary)';
  
  const textMutedColor = cliente.card_color
    ? (dark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.45)')
    : 'var(--text-muted)';
  
  const badgeBg = cliente.card_color
    ? (dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)')
    : 'var(--bg-subtle)';
  
  const badgeColor = cliente.card_color
    ? (dark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.5)')
    : 'var(--text-muted)';

  return (
    <>
      <motion.div
        layout
        initial={false}
        animate={{
          rotate: isDragging ? 1 : 0,
          scale: isDragging ? 1.02 : 1,
        }}
        whileHover={!isDragging ? { y: -2, boxShadow: 'var(--shadow-card-hover)' } : {}}
        onClick={() => onClick(cliente)}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "group relative flex flex-col border border-[var(--border-light)] rounded-[14px] cursor-pointer transition-all duration-150 ease-in-out px-4 pt-3.5 pb-3",
          isDragging && "shadow-[0_12px_40px_rgba(0,0,0,0.16)] z-50",
          !isDragging && "shadow-[var(--shadow-card)]"
        )}
        style={{ backgroundColor: cliente.card_color || 'white' }}
      >
        {/* ROW 1: type label + menu */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            {cliente.emoji && cliente.emoji !== '' && (
              <div className="text-[14px] w-6 h-6 flex items-center justify-center">
                {cliente.emoji}
              </div>
            )}
            <div 
              className="font-outfit font-semibold text-[9px] uppercase tracking-[0.1em] px-[7px] py-[2px] rounded-full"
              style={{ backgroundColor: badgeBg, color: badgeColor }}
            >
              BUYER
            </div>
            {isTally && <Sparkles size={12} className="text-amber-500" />}
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
          className="font-outfit font-semibold text-[13px] leading-[1.3] line-clamp-2 mt-1"
          style={{ color: textColor }}
        >
          {cliente.nome} {cliente.cognome}
        </h3>

        {/* ROW 3: dot rating */}
        <div className="flex gap-1.5 my-2.5">
          {[1, 2, 3, 4, 5].map((dot) => (
            <button
              key={dot}
              onClick={(e) => {
                e.stopPropagation();
                onUpdate?.(cliente.id, { rating: dot === cliente.rating ? dot - 1 : dot });
              }}
              className={cn(
                "w-2 h-2 rounded-full transition-all"
              )}
              style={{ 
                backgroundColor: cliente.card_color 
                  ? (dot <= (cliente.rating || 0) ? (dark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.75)') : (dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'))
                  : (dot <= (cliente.rating || 0) ? 'var(--text-primary)' : 'rgba(0,0,0,0.1)')
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
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[10px] font-outfit font-semibold flex-shrink-0">
              {(cliente.nome?.[0] || 'B').toUpperCase()}
            </div>
            <span 
              className="font-outfit font-medium text-[10px] truncate max-w-[80px]"
              style={{ color: textColor }}
            >
              {cliente.nome || 'Buyer'}
            </span>
          </div>
          <span 
            className="font-outfit font-normal text-[10px] flex-shrink-0"
            style={{ color: textMutedColor }}
          >
            {new Date(cliente.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
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
              className="fixed z-[110] bg-white border border-[#E4E3DE] rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.15),0_4px_16px_rgba(0,0,0,0.08)] p-4 min-w-[260px] max-w-[90vw] sm:max-w-[300px] flex flex-col gap-6"
              style={{
                left: Math.min(menuPos.x, window.innerWidth - (window.innerWidth < 640 ? window.innerWidth * 0.9 : 300)),
                top: Math.min(menuPos.y, Math.max(0, window.innerHeight - 600))
              }}
            >
              {/* STATO */}
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-[0.12em] text-[#9B9B95] font-sans font-medium mb-2">Stato</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(CLIENTE_STATUS_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => {
                        onStatusChange?.(cliente.id, key);
                        closeMenu();
                      }}
                      className={cn(
                        "h-6 px-[10px] rounded-full text-[11px] font-sans font-medium transition-all",
                        cliente.status === key ? "ring-2 ring-offset-1 ring-current" : "opacity-80 hover:opacity-100"
                      )}
                      style={{ 
                        backgroundColor: config.bg,
                        color: config.fg
                      }}
                    >
                      {config.label}
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
                        onEmojiChange?.(cliente.id, emoji);
                        closeMenu();
                      }}
                      className={cn(
                        "w-7 h-7 flex items-center justify-center text-[16px] rounded-[8px] transition-all hover:bg-[#EFEEEA]",
                        cliente.emoji === emoji && "bg-[#EFEEEA] ring-1 ring-black/20"
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                {cliente.emoji && cliente.emoji !== '' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEmojiChange?.(cliente.id, '');
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
                      onColorChange?.(cliente.id, null);
                      closeMenu();
                    }}
                    className={cn(
                      "w-6 h-6 rounded-full border-[1.5px] border-[#D1D0CB] bg-white relative overflow-hidden",
                      !cliente.card_color && "ring-2 ring-offset-1 ring-gray-400"
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
                        onColorChange?.(cliente.id, color);
                        closeMenu();
                      }}
                      className={cn(
                        "w-6 h-6 rounded-full border border-black/5 transition-transform hover:scale-110",
                        cliente.card_color === color && "ring-2 ring-offset-1 ring-gray-400"
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
                          onColorChange?.(cliente.id, customColorValue);
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
                            onClick={() => { onColorChange?.(cliente.id, color); closeMenu(); }}
                            className={cn(
                              "w-6 h-6 rounded-full border border-black/5 transition-transform hover:scale-110",
                              cliente.card_color === color && "ring-2 ring-offset-1 ring-gray-400"
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
                {cliente.emoji && cliente.emoji !== '' && (
                  <button
                    onClick={() => { onEmojiChange?.(cliente.id, ''); closeMenu(); }}
                    className="flex items-center gap-2 text-[11px] font-sans text-[#9B9B95] hover:text-[#E57373] transition-colors mb-2"
                  >
                    ✕ Rimuovi emoji
                  </button>
                )}
                <button
                  onClick={() => {
                    onDelete?.(cliente.id);
                    closeMenu();
                  }}
                  className="flex items-center gap-2 text-[#E57373] hover:text-[#C62828] transition-colors text-[11px] font-sans font-medium"
                >
                  <Trash2 size={12} />
                  Elimina buyer
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
