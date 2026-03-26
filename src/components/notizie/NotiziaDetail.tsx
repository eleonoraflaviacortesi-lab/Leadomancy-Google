import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import EmojiPicker from 'emoji-picker-react';
import { X, Phone, MapPin, Euro, Calendar, Clock, Sparkles, User, FileText, MessageSquare, Download, Trash2, Star, ChevronLeft, Palette } from "lucide-react";
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

const Badge = ({ children, bg, fg, onClick }: { children: React.ReactNode; bg?: string; fg?: string; onClick?: () => void }) => (
  <span 
    onClick={onClick}
    className="px-2 py-0.5 rounded-full font-outfit font-medium text-[10px] uppercase tracking-wider inline-block cursor-pointer hover:opacity-80"
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
      <span className="text-[10px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-[0.08em]">{label}</span>
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
      <span className="text-[10px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-[0.08em]">{label}</span>
      {editing ? (
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
      ) : (
        <p className="text-[13px] font-outfit font-normal text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap group-hover:text-indigo-600 transition-colors">
          {value || '-'}
        </p>
      )}
    </div>
  );
};

const Section = ({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={cn("flex flex-col gap-2.5 py-6 border-b border-[var(--border-light)] last:border-0", className)}>
    <span className="font-outfit font-semibold text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">{title}</span>
    <div className="flex flex-col gap-4">
      {children}
    </div>
  </div>
);

const StarRating = ({ rating, onRate }: { rating: number | null; onRate: (r: number) => void }) => {
  const [localRating, setLocalRating] = useState<number>(rating ?? 0);
  const [hovered, setHovered] = useState<number | null>(null);
  
  // Sync when prop changes
  useEffect(() => {
    setLocalRating(rating ?? 0);
  }, [rating]);
  
  const display = hovered ?? localRating;
  
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {[1,2,3,4,5].map(star => (
        <button
          key={star}
          type="button"
          onClick={(e) => { 
            e.stopPropagation(); 
            setLocalRating(star);  // update locally immediately
            onRate(star); 
          }}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          style={{ 
            background: 'none', border: 'none', cursor: 'pointer', padding: '0 1px',
            fontSize: 18, color: star <= display ? '#F5C842' : '#D1D0CB', lineHeight: 1,
            transition: 'color 100ms'
          }}
        >★</button>
      ))}
    </div>
  );
};

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
            style={{
              position: 'fixed',
              right: 0,
              top: 34,
              bottom: 0,
              width: 'min(620px, 100vw)',
              zIndex: 70,
              backgroundColor: 'white',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              overflowX: 'hidden',
              boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
              borderLeft: '1px solid var(--border-light)'
            }}
          >
            {/* Header */}
            <div className="flex items-center h-[56px] px-5 border-b border-[var(--border-light)] bg-white sticky top-0 z-10">
              <button 
                onClick={() => onOpenChange(false)}
                className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex-1 px-4 truncate flex items-center gap-3">
                <h2 className="font-outfit font-semibold text-[15px] text-[var(--text-primary)] truncate">
                  {notizia.name}
                </h2>
                <StarRating 
                  rating={notizia.rating} 
                  onRate={(r) => onUpdate?.(notizia.id, { rating: r })} 
                />
                <Badge 
                  bg={statusColor + '20'} 
                  fg={statusColor}
                  onClick={() => setIsStatusEditing(true)}
                >
                  {NOTIZIA_STATUS_LABELS[notizia.status as keyof typeof NOTIZIA_STATUS_LABELS]}
                </Badge>
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
                <button onClick={() => onOpenChange(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '24px',
              boxSizing: 'border-box',
              width: '100%'
            }}>
              <div className="flex flex-col">
                {/* Header Section */}
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <button 
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="text-[24px] hover:bg-black/5 rounded p-1 transition-colors"
                      >
                        {notizia.emoji || '🏠'}
                      </button>
                      {showEmojiPicker && (
                        <div className="absolute z-[80] top-full left-0 mt-2">
                          <EmojiPicker onEmojiClick={(e) => { onUpdate?.(notizia.id, { emoji: e.emoji }); setShowEmojiPicker(false); }} />
                        </div>
                      )}
                    </div>
                    <EditableField 
                      label="" 
                      value={notizia.name} 
                      onSave={(v) => onUpdate?.(notizia.id, { name: v })}
                      className="min-h-0 text-[20px] font-semibold"
                    />
                  </div>
                  <div className="relative">
                    {!isStatusEditing ? (
                      <Badge 
                        bg={statusColor + '20'} 
                        fg={statusColor}
                        onClick={() => setIsStatusEditing(true)}
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

                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', padding: '20px 24px', borderBottom: '1px solid var(--border-light)' }}>
                  <div className="flex flex-col gap-6">
                    <EditableField label="Zona" value={notizia.zona} onSave={(v) => onUpdate?.(notizia.id, { zona: v })} />
                    <EditableField label="Telefono" value={notizia.telefono} onSave={(v) => onUpdate?.(notizia.id, { telefono: v })} />
                    <EditableField label="Tipo" value={notizia.type} onSave={(v) => onUpdate?.(notizia.id, { type: v })} />
                    <EditableField 
                      label="Prezzo Richiesto" 
                      value={notizia.prezzo_richiesto} 
                      type="number"
                      prefix="€"
                      onSave={(v) => onUpdate?.(notizia.id, { prezzo_richiesto: parseFloat(v) })} 
                    />
                  </div>
                  <div className="flex flex-col gap-6">
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
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-[0.08em]">Agente</span>
                      <span className="text-[13px] font-outfit font-normal text-[var(--text-primary)]">Eleonora Cortesi</span>
                    </div>
                  </div>
                </div>

                <div className="px-6">
                  <Section title="Note">
                    <EditableTextarea 
                      label="" 
                      value={notizia.notes} 
                      onSave={handleNotesSave} 
                    />
                  </Section>

                  <Section title="Promemoria">
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-0.5 flex-1">
                        <span className="text-[10px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-[0.08em]">Data</span>
                        <input 
                          type="date" 
                          value={notizia.reminder_date || ''} 
                          onChange={(e) => onUpdate?.(notizia.id, { reminder_date: e.target.value })}
                          className="bg-transparent border-b border-black py-1 text-[13px] font-outfit outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5 flex-1">
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

                  <Section title="Commenti">
                    <div className="flex flex-col gap-4">
                      {(notizia.comments || []).map((c, i) => (
                        <div key={i} className="text-[12px] text-[var(--text-primary)] bg-[var(--bg-subtle)] p-2 rounded">
                          {c.text}
                        </div>
                      ))}
                      <div className="flex items-center gap-2">
                        <input 
                          type="text"
                          placeholder="Aggiungi un commento..."
                          className="flex-1 bg-[var(--bg-subtle)] border-0 rounded-full px-4 py-2 text-[12px] font-outfit outline-none"
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
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 48, paddingTop: 24, paddingBottom: 24, width: '100%', flexWrap: 'wrap' }}>

<div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-light)' }}>
  <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 10 }}>COLORE</p>
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
    {COLOR_OPTIONS.map(color => (
      <button
        key={color}
        type="button"
        onClick={() => { setLocalCardColor(color); onUpdate?.(notizia.id, { card_color: color }); }}
        style={{
          width: 24, height: 24, borderRadius: '50%', border: 'none',
          backgroundColor: color,
          cursor: 'pointer', flexShrink: 0,
          outline: localCardColor === color ? '2px solid #1A1A18' : '1.5px solid rgba(0,0,0,0.1)',
          outlineOffset: localCardColor === color ? 2 : 0,
          transition: 'transform 150ms',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      />
    ))}
    
    {/* Custom color picker button */}
    <button
      type="button"
      onClick={() => colorInputRef.current?.click()}
      style={{
        width: 24, height: 24, borderRadius: '50%',
        border: '2px dashed var(--border-medium)',
        background: 'transparent', cursor: 'pointer', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, color: 'var(--text-muted)', lineHeight: 1
      }}
    >+</button>
    
    <input
      ref={colorInputRef}
      type="color"
      defaultValue="#ffffff"
      onChange={e => { setLocalCardColor(e.target.value); onUpdate?.(notizia.id, { card_color: e.target.value }); }}
      style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
    />
  </div>
  
  {localCardColor && (
    <button
      type="button"
      onClick={() => { setLocalCardColor(null); onUpdate?.(notizia.id, { card_color: null }); }}
      style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      × Rimuovi colore
    </button>
  )}
</div>
                </div>

                <div className="py-10 text-center">
                  <span className="text-[11px] text-[var(--text-muted)] font-outfit uppercase tracking-widest">
                    Leadomancy Notizie
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
