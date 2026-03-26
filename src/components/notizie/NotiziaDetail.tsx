import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
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

export const NotiziaDetail: React.FC<NotiziaDetailProps> = ({ notizia, open, onOpenChange, onUpdate, onDelete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isStatusEditing, setIsStatusEditing] = useState(false);

  if (!notizia) return null;

  const statusColor = NOTIZIA_STATUS_COLORS[notizia.status as keyof typeof NOTIZIA_STATUS_COLORS] || '#ccc';

  const Section = ({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) => (
    <div className={cn("flex flex-col gap-2.5 py-6 border-b border-[var(--border-light)] last:border-0", className)}>
      <span className="font-outfit font-semibold text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">{title}</span>
      <div className="flex flex-col gap-4">
        {children}
      </div>
    </div>
  );

  const handleDelete = () => {
    if (window.confirm("Sei sicuro di voler eliminare questa notizia?")) {
      onDelete?.(notizia.id);
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

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              right: 0,
              bottom: 0,
              top: '34px',
              width: 'min(600px, 100vw)',
              maxHeight: 'calc(100vh - 34px)',
              background: 'white',
              zIndex: 70,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
              borderLeft: '1px solid var(--border-light)',
              overflowY: 'auto'
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
              
              <div className="flex-1 px-4 truncate">
                <h2 className="font-outfit font-semibold text-[15px] text-[var(--text-primary)] truncate">
                  {notizia.name}
                </h2>
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
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col">
                {/* Header Section */}
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-3">
                    <EditableField 
                      label="" 
                      value={notizia.emoji || '🏠'} 
                      onSave={(v) => onUpdate?.(notizia.id, { emoji: v })}
                      className="min-h-0 w-8 text-[24px]"
                    />
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
                      onSave={(v) => onUpdate?.(notizia.id, { notes: v })} 
                    />
                  </Section>

                  <Section title="Promemoria">
                    <EditableField 
                      label="Data e Ora" 
                      value={notizia.reminder_date ? `${notizia.reminder_date}T${notizia.reminder_time || '09:00'}` : null} 
                      type="datetime-local"
                      onSave={(v) => {
                        const [date, time] = v.split('T');
                        onUpdate?.(notizia.id, { reminder_date: date, reminder_time: time });
                      }} 
                    />
                  </Section>

                  <Section title="Commenti">
                    <div className="flex flex-col gap-4">
                      <p className="text-[12px] text-[var(--text-muted)] italic">Nessun commento presente.</p>
                      <div className="flex items-center gap-2">
                        <input 
                          type="text"
                          placeholder="Aggiungi un commento..."
                          className="flex-1 bg-[var(--bg-subtle)] border-0 rounded-full px-4 py-2 text-[12px] font-outfit outline-none"
                        />
                      </div>
                    </div>
                  </Section>
                </div>

                <div className="flex items-center gap-12 py-6">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-[0.08em]">Rating</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star}
                          onClick={() => onUpdate?.(notizia.id, { rating: star })}
                          className={cn(
                            "transition-colors",
                            star <= (notizia.rating || 0) ? "text-amber-400" : "text-gray-200"
                          )}
                        >
                          <Star size={16} fill={star <= (notizia.rating || 0) ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-[0.08em]">Colore</span>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full border border-[var(--border-light)]" style={{ backgroundColor: statusColor }} />
                      <button className="p-1 hover:bg-black/5 rounded text-[var(--text-muted)]">
                        <Palette size={14} />
                      </button>
                    </div>
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
