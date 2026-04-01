import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import EmojiPicker from 'emoji-picker-react';
import { X, Phone, MapPin, Euro, Calendar, Clock, Sparkles, User, FileText, MessageSquare, Download, Trash2, Star, ChevronLeft, Palette, Check } from "lucide-react";
import Markdown from "react-markdown";
import { Notizia, NotiziaStatus } from "@/src/types";
import { NOTIZIA_STATUS_LABELS, NOTIZIA_STATUS_COLORS, NOTIZIA_STATUSES } from "./notizieConfig";
import { cn, formatCurrency } from "@/src/lib/utils";

interface NotiziaDetailProps {
  notizia: Notizia | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (id: string, updates: Partial<Notizia>) => void;
  onDelete?: (id: string) => void;
}

const Badge = ({ children, bg, fg, onClick, className }: { children: React.ReactNode; bg?: string; fg?: string; onClick?: () => void; className?: string }) => (
  <span 
    onClick={onClick}
    className={cn("px-2 py-0.5 rounded-full font-outfit font-medium text-[10px] uppercase tracking-wider inline-block cursor-pointer hover:opacity-80", className)}
    style={{ backgroundColor: bg || 'var(--bg-subtle)', color: fg || 'var(--text-secondary)' }}
  >
    {children}
  </span>
);

const EditableField = ({ 
  label, 
  value, 
  onSave, 
  type = "text",
  prefix,
  className
}: { 
  label: string; 
  value: string | number | null; 
  onSave: (v: string) => void;
  type?: "text" | "number" | "date" | "datetime-local";
  prefix?: string;
  className?: string;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value?.toString() || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const handleSave = () => {
    if (draft !== (value?.toString() || "")) {
      onSave(draft);
    }
    setEditing(false);
  };

  return (
    <div 
      className={cn("flex flex-col gap-0.5 cursor-pointer group min-h-[32px]", className)} 
      onClick={() => {
        if (!editing) {
          setDraft(value?.toString() || "");
          setEditing(true);
        }
      }}
    >
      {label && <span className="text-[10px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-[0.08em]">{label}</span>}
      {editing ? (
        <div className="flex items-center gap-1">
          {prefix && <span className="text-[13px] font-medium text-[var(--text-muted)]">{prefix}</span>}
          <input
            ref={inputRef}
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') {
                setDraft(value?.toString() || "");
                setEditing(false);
              }
            }}
            className="flex-1 bg-transparent border-b border-black py-0 text-[13px] font-outfit font-normal outline-none"
          />
          <button 
            onMouseDown={(e) => { e.preventDefault(); handleSave(); }}
            className="p-1 hover:bg-green-50 text-green-600 rounded transition-colors"
          >
            <Check size={14} />
          </button>
        </div>
      ) : (
        <span className="text-[13px] font-outfit font-normal text-[var(--text-primary)] group-hover:text-indigo-600 transition-colors">
          {prefix}{value || '-'}
        </span>
      )}
    </div>
  );
};

const EditableTextarea = ({ 
  label, 
  value, 
  onSave,
  className
}: { 
  label: string; 
  value: string | null; 
  onSave: (v: string) => void;
  className?: string;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editing]);

  const handleSave = () => {
    if (draft !== (value || "")) {
      onSave(draft);
    }
    setEditing(false);
  };

  return (
    <div 
      className={cn("flex flex-col gap-0.5 cursor-pointer group", className)} 
      onClick={() => {
        if (!editing) {
          setDraft(value || "");
          setEditing(true);
        }
      }}
    >
      {label && <span className="text-[10px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-[0.08em]">{label}</span>}
      {editing ? (
        <div className="flex flex-col gap-1">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setDraft(value || "");
                setEditing(false);
              }
            }}
            className="w-full bg-transparent border-b border-black py-0 text-[13px] font-outfit font-normal outline-none resize-none overflow-hidden"
          />
          <div className="flex justify-end">
            <button 
              onMouseDown={(e) => { e.preventDefault(); handleSave(); }}
              className="flex items-center gap-1 px-3 py-1 bg-[#1A1A18] text-white text-[10px] font-bold rounded-full hover:bg-black/80 transition-colors"
            >
              <Check size={12} />
              SALVA
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[13px] font-outfit font-normal text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap group-hover:text-indigo-600 transition-colors">
          {value || '-'}
        </p>
      )}
    </div>
  );
};

const Section = ({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={cn("flex flex-col gap-4", className)}>
    <h3 className="text-[10px] font-outfit font-bold text-[var(--text-muted)] uppercase tracking-widest">{title}</h3>
    {children}
  </div>
);

const DotRating = ({ rating, onRate }: { rating: number | null; onRate: (r: number) => void }) => (
  <div className="flex gap-2">
    {[1, 2, 3, 4, 5].map((dot) => (
      <button
        key={dot}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRate(dot === rating ? dot - 1 : dot);
        }}
        className={cn(
          "w-3 h-3 rounded-full transition-all",
          dot <= (rating || 0) ? "bg-[var(--text-primary)]" : "bg-black/10 hover:bg-black/20"
        )}
      />
    ))}
  </div>
);

const COLOR_OPTIONS = [
  '#FFF0F0','#FFF8E7','#F0FFF4','#F0F8FF',
  '#F5F0FF','#FFF0F8','#FFEBCC','#E8F5E9',
  '#E3F2FD','#FCE4EC','#F3E5F5','#E0F7FA'
];

export const NotiziaDetail: React.FC<NotiziaDetailProps> = ({ notizia, open, onOpenChange, onUpdate, onDelete }) => {
  const [isStatusEditing, setIsStatusEditing] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [localCardColor, setLocalCardColor] = useState<string | null>(notizia?.card_color ?? null);
  const statusColor = NOTIZIA_STATUS_COLORS[notizia.status as keyof typeof NOTIZIA_STATUS_COLORS] || '#000000';
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Sync when notizia changes
  useEffect(() => {
    setLocalCardColor(notizia?.card_color ?? null);
  }, [notizia?.card_color]);

  const handleNotesSave = (v: string) => onUpdate?.(notizia.id, { notes: v });
  
  const addComment = (text: string) => {
    const newComments = [...(notizia.comments || []), { text, created_at: new Date().toISOString() }];
    onUpdate?.(notizia.id, { comments: newComments });
  };

  const handleDelete = () => {
    if (notizia && onDelete) {
      onDelete(notizia.id);
      onOpenChange(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-[rgba(0,0,0,0.2)] z-[60]"
            style={{ top: '34px' }}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-[34px] bottom-0 left-0 md:left-[220px] z-[70] bg-[#F5F5F0] flex flex-col overflow-y-auto overflow-x-hidden shadow-[-4px_0_24px_rgba(0,0,0,0.08)] md:rounded-l-[32px] border-l border-[var(--border-light)]"
          >
            {/* Header */}
            <div className="flex items-center h-[64px] px-4 md:px-6 border-b border-[var(--border-light)] bg-[#F5F5F0] sticky top-0 z-10">
              <button 
                onClick={() => onOpenChange(false)}
                className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors md:hidden"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex-1 px-2 md:px-4 truncate flex items-center gap-2 md:gap-3">
                <button 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[16px] hover:bg-black/5 transition-colors shrink-0"
                >
                  {notizia.emoji || '🏠'}
                </button>
                {showEmojiPicker && (
                  <div className="absolute z-[80] top-[64px] left-[16px] md:left-[100px] mt-2">
                    <EmojiPicker onEmojiClick={(e) => { onUpdate?.(notizia.id, { emoji: e.emoji }); setShowEmojiPicker(false); }} />
                  </div>
                )}
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 truncate">
                  <EditableField 
                    label="" 
                    value={notizia.name} 
                    onSave={(v) => onUpdate?.(notizia.id, { name: v })}
                    className="min-h-0 text-[14px] md:text-[15px] font-semibold text-[var(--text-primary)] truncate"
                  />
                  <div className="flex items-center gap-2">
                    <DotRating 
                      rating={notizia.rating} 
                      onRate={(r) => onUpdate?.(notizia.id, { rating: r })} 
                    />
                    {!isStatusEditing ? (
                      <Badge 
                        bg={statusColor + '20'} 
                        fg={statusColor}
                        onClick={() => setIsStatusEditing(true)}
                        className="shrink-0"
                      >
                        {NOTIZIA_STATUS_LABELS[notizia.status as keyof typeof NOTIZIA_STATUS_LABELS]}
                      </Badge>
                    ) : (
                      <select
                        autoFocus
                        value={notizia.status}
                        onChange={(e) => {
                          onUpdate?.(notizia.id, { status: e.target.value as any });
                          setIsStatusEditing(false);
                        }}
                        onBlur={() => setIsStatusEditing(false)}
                        className="text-[10px] font-outfit font-medium uppercase tracking-wider bg-[var(--bg-subtle)] border-b border-black outline-none"
                      >
                        {NOTIZIA_STATUSES.map((status) => (
                          <option key={status} value={status}>{NOTIZIA_STATUS_LABELS[status]}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button 
                  className="p-2 hover:bg-black/5 rounded-full transition-colors text-[var(--text-muted)]"
                  title="Scarica PDF"
                >
                  <Download size={20} />
                </button>
                {onDelete && (
                  <button 
                    onClick={handleDelete}
                    className="p-2 hover:bg-rose-50 rounded-full transition-colors text-rose-500"
                    title="Elimina"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                <button onClick={() => onOpenChange(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors hidden md:flex">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '16px',
              boxSizing: 'border-box',
              width: '100%'
            }}>
              <div className="grid gap-4 lg:grid-cols-[1fr_350px]">
                
                {/* COLUMN 1 */}
                <div className="flex flex-col gap-4">
                  <div className="bg-white p-5 rounded-2xl shadow-sm flex flex-col gap-6">
                    <Section title="DATI GENERALI">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                        <EditableField label="Zona" value={notizia.zona} onSave={(v) => onUpdate?.(notizia.id, { zona: v })} />
                        <EditableField label="Telefono" value={notizia.telefono} onSave={(v) => onUpdate?.(notizia.id, { telefono: v })} />
                        <EditableField label="Tipo" value={notizia.type} onSave={(v) => onUpdate?.(notizia.id, { type: v })} />
                      </div>
                    </Section>

                    <Section title="VALUTAZIONE">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                        <EditableField 
                          label="Prezzo Richiesto" 
                          value={notizia.prezzo_richiesto} 
                          type="number"
                          prefix="€"
                          onSave={(v) => onUpdate?.(notizia.id, { prezzo_richiesto: parseFloat(v) })} 
                        />
                        <EditableField 
                          label="Valore Stimato" 
                          value={notizia.valore} 
                          type="number"
                          prefix="€"
                          onSave={(v) => onUpdate?.(notizia.id, { valore: parseFloat(v) })} 
                        />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-[0.08em]">Online</span>
                          <span className="text-[13px] font-outfit font-normal text-[var(--text-primary)]">No</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-[0.08em]">Data Creazione</span>
                          <span className="text-[13px] font-outfit font-normal text-[var(--text-primary)]">
                            {notizia.created_at ? new Date(notizia.created_at).toLocaleDateString('it-IT') : '-'}
                          </span>
                        </div>
                      </div>
                    </Section>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm flex flex-col gap-8">
                    <Section title="NOTE">
                      <EditableTextarea 
                        label="" 
                        value={notizia.notes} 
                        onSave={handleNotesSave} 
                      />
                    </Section>

                    <Section title="PROMEMORIA">
                      <div className="flex gap-6">
                        <div className="flex flex-col gap-1 flex-1">
                          <span className="text-[10px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-[0.08em]">Data</span>
                          <input 
                            type="date" 
                            value={notizia.reminder_date || ''} 
                            onChange={(e) => onUpdate?.(notizia.id, { reminder_date: e.target.value })}
                            className="bg-transparent border-b border-black py-1 text-[13px] font-outfit outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1 flex-1">
                          <span className="text-[10px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-[0.08em]">Ora</span>
                          <input 
                            type="time" 
                            value={notizia.reminder_time || '09:00'} 
                            onChange={(e) => onUpdate?.(notizia.id, { reminder_time: e.target.value })}
                            className="bg-transparent border-b border-black py-1 text-[13px] font-outfit outline-none"
                          />
                        </div>
                      </div>
                    </Section>
                  </div>
                </div>

                {/* COLUMN 2 */}
                <div className="flex flex-col gap-4">
                  <div className="bg-white p-5 rounded-2xl shadow-sm flex flex-col gap-8">
                    <Section title="COMMENTI">
                      <div className="flex flex-col gap-4">
                        {(notizia.comments || []).map((c, i) => (
                          <div key={i} className="text-[12px] text-[var(--text-primary)] bg-[var(--bg-subtle)] p-3 rounded-lg border border-black/5">
                            {c.text}
                          </div>
                        ))}
                        <div className="flex items-center gap-2">
                          <input 
                            type="text"
                            placeholder="Aggiungi un commento..."
                            className="flex-1 bg-[var(--bg-subtle)] border border-black/5 rounded-full px-4 py-2 text-[12px] font-outfit outline-none focus:bg-white focus:border-indigo-500 transition-all"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.currentTarget.value) {
                                addComment(e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                        </div>
                      </div>
                    </Section>

                    <Section title="COLORE SCHEDA">
                      <div className="flex items-center gap-2 flex-wrap">
                        {COLOR_OPTIONS.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => { setLocalCardColor(color); onUpdate?.(notizia.id, { card_color: color }); }}
                            className="w-7 h-7 rounded-full border-none cursor-pointer shrink-0 transition-all hover:scale-110 active:scale-95"
                            style={{
                              backgroundColor: color,
                              outline: localCardColor === color ? '2px solid #1A1A18' : '1.5px solid rgba(0,0,0,0.05)',
                              outlineOffset: localCardColor === color ? 2 : 0,
                            }}
                          />
                        ))}
                        
                        {/* Custom color picker button */}
                        <button
                          type="button"
                          onClick={() => colorInputRef.current?.click()}
                          className="w-7 h-7 rounded-full border-2 border-dashed border-[var(--border-medium)] bg-transparent cursor-pointer shrink-0 flex items-center justify-center text-[18px] text-[var(--text-muted)] leading-none hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors"
                        >+</button>
                        
                        <input
                          ref={colorInputRef}
                          type="color"
                          value={localCardColor || '#ffffff'}
                          onChange={e => { setLocalCardColor(e.target.value); onUpdate?.(notizia.id, { card_color: e.target.value }); }}
                          className="absolute opacity-0 w-0 h-0 pointer-events-none"
                        />
                      </div>
                      
                      {localCardColor && (
                        <button
                          type="button"
                          onClick={() => { setLocalCardColor(null); onUpdate?.(notizia.id, { card_color: null }); }}
                          className="mt-3 text-[11px] text-[var(--text-muted)] bg-transparent border-none cursor-pointer p-0 hover:underline text-left font-medium"
                        >
                          × Rimuovi colore
                        </button>
                      )}
                    </Section>
                  </div>
                </div>
              </div>

              <div className="py-10 text-center border-t border-[var(--border-light)] mt-8">
                <span className="text-[11px] text-[var(--text-muted)] font-outfit uppercase tracking-widest">
                  Leadomancy Notizie
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
