import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import EmojiPicker from 'emoji-picker-react';
import { 
  X, Phone, Mail, MapPin, Euro, Calendar, Clock, Sparkles, User, 
  FileText, MessageSquare, Download, Trash2, Plus, ExternalLink, 
  ThumbsUp, ThumbsDown, Send, Home, ClipboardList, GripVertical,
  ChevronLeft, Star
} from "lucide-react";
import Markdown from "react-markdown";
import { Cliente } from "@/src/types";
import { CLIENTE_STATUS_CONFIG } from "./clienteFormOptions";
import { analyzeCliente, searchPropertiesOnline } from "@/src/lib/gemini";
import { cn, formatCurrency } from "@/src/lib/utils";
import { useClienteActivities, ClienteActivity } from "@/src/hooks/useClienteActivities";
import { usePropertyMatches, PropertyMatch } from "@/src/hooks/usePropertyMatches";
import { useProfiles } from "@/src/hooks/useProfiles";
import { generateClientePDF } from "@/src/lib/generateClientePDF";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

interface ClienteDetailProps {
  cliente: Cliente | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: string, updates: Partial<Cliente>) => void;
  onDelete?: (id: string) => void;
}

const Badge = ({ children, bg, fg, className, onClick }: { children: React.ReactNode; bg?: string; fg?: string; className?: string; onClick?: () => void }) => (
  <span 
    onClick={onClick}
    className={cn(
      "px-2 py-0.5 rounded-full font-outfit font-medium text-[10px] uppercase tracking-wider inline-block cursor-pointer hover:opacity-80",
      className
    )}
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
  className,
  valueClassName
}: { 
  label: string; 
  value: string | number | null; 
  onSave: (v: string) => void;
  type?: "text" | "number" | "date" | "datetime-local";
  prefix?: string;
  className?: string;
  valueClassName?: string;
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
        <span className={cn("text-[13px] font-outfit font-normal text-[var(--text-primary)] group-hover:text-indigo-600 transition-colors", valueClassName)}>
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
  <div className={cn("flex flex-col gap-2 py-4 border-b border-[var(--border-light)] last:border-0", className)}>
    <span style={{
      fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
      textTransform: 'uppercase', letterSpacing: '0.12em',
      marginBottom: 6, paddingBottom: 4,
      borderBottom: '1px solid var(--border-light)'
    }}>{title}</span>
    <div className="flex flex-col gap-2">
      {children}
    </div>
  </div>
);

const USO_LABELS: Record<string, string> = {
  'primary_residence': 'Residenza Principale',
  'second_home': 'Seconda Casa',
  'investment': 'Investimento',
  'holiday': 'Casa Vacanze',
  'rental': 'Affitto',
};

const AFFITTO_LABELS: Record<string, string> = {
  'yes': 'Sì',
  'no': 'No',
  'not_sure': 'Non sicuro',
  'maybe': 'Forse',
};

const MUTUO_LABELS: Record<string, string> = {
  'yes': 'Sì',
  'no': 'No',
  'not_sure': 'Non sicuro',
  'maybe': 'Forse',
};

interface SearchResultProperty {
  titolo: string;
  rif: string;
  zona: string;
  prezzo: string;
  mq: string;
  camere: string;
  bagni: string;
  url: string;
  motivazione: string;
  compatibilita: number; // 1-10
  immagine?: string; // URL of cover image
}

// ── PropertyMatchCard ──────────────────────────────
const PropertyMatchCard = ({ 
  match, 
  onReaction, 
  onStatusChange, 
  onDelete,
  onWhatsApp 
}: { 
  match: PropertyMatch;
  onReaction: (id: string, r: 'like' | 'dislike' | null) => void;
  onStatusChange: (id: string, s: 'new' | 'sent') => void;
  onDelete: (id: string) => void;
  onWhatsApp: (match: PropertyMatch) => void;
}) => (
  <div style={{
    background: 'white',
    borderRadius: 12,
    border: match.reaction === 'like' 
      ? '1.5px solid #1D9E75' 
      : match.reaction === 'dislike' 
        ? '1.5px solid #E24B4A' 
        : '1px solid var(--border-light)',
    overflow: 'hidden',
    marginBottom: 8,
  }}>
    {/* Cover image */}
    {match.immagine && (
      <img
        src={match.immagine}
        alt={match.titolo}
        style={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    )}

    {/* Content */}
    <div style={{ padding: '12px 14px' }}>
      
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <a 
            href={match.url} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
              fontFamily: 'Outfit', textDecoration: 'none', lineHeight: 1.3,
              display: 'block', marginBottom: 2
            }}
          >
            {match.titolo} ↗
          </a>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Outfit' }}>
            {match.rif} · {match.zona}
          </span>
        </div>
        {match.compatibilita && (
          <span style={{
            background: match.compatibilita >= 8 ? '#F0FDF4' : match.compatibilita >= 6 ? '#FEF9C3' : '#FEF2F2',
            color: match.compatibilita >= 8 ? '#166534' : match.compatibilita >= 6 ? '#854D0E' : '#991B1B',
            borderRadius: 999, padding: '2px 8px',
            fontSize: 10, fontWeight: 700, fontFamily: 'Outfit', flexShrink: 0, marginLeft: 6
          }}>
            {match.compatibilita}/10
          </span>
        )}
      </div>

      {/* Price + details */}
      {match.prezzo && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A18', fontFamily: 'Outfit' }}>
            {match.prezzo}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Outfit' }}>
            {[match.mq, match.camere && `${match.camere} cam`, match.bagni && `${match.bagni} bagni`]
              .filter(Boolean).join(' · ')}
          </span>
        </div>
      )}

      {/* Motivation */}
      {match.motivazione && (
        <p style={{ 
          fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'Outfit',
          margin: '0 0 10px', lineHeight: 1.4, fontStyle: 'italic'
        }}>
          💡 {match.motivazione}
        </p>
      )}

      {/* Action bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderTop: '1px solid var(--border-light)', paddingTop: 10 }}>
        
        {/* Like */}
        <button
          onClick={() => onReaction(match.id, match.reaction === 'like' ? null : 'like')}
          title="Interessante"
          style={{
            width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
            background: match.reaction === 'like' ? '#DCFCE7' : 'var(--bg-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, transition: 'all 150ms'
          }}
        >
          👍
        </button>

        {/* Dislike */}
        <button
          onClick={() => onReaction(match.id, match.reaction === 'dislike' ? null : 'dislike')}
          title="Non adatta"
          style={{
            width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
            background: match.reaction === 'dislike' ? '#FEE2E2' : 'var(--bg-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, transition: 'all 150ms'
          }}
        >
          👎
        </button>

        {/* Sent badge / toggle */}
        <button
          onClick={() => onStatusChange(match.id, match.status === 'sent' ? 'new' : 'sent')}
          title={match.status === 'sent' ? 'Inviata' : 'Segna come inviata'}
          style={{
            height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
            padding: '0 10px',
            background: match.status === 'sent' ? '#1A1A18' : 'var(--bg-subtle)',
            color: match.status === 'sent' ? 'white' : 'var(--text-muted)',
            fontSize: 10, fontWeight: 600, fontFamily: 'Outfit',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            transition: 'all 150ms'
          }}
        >
          {match.status === 'sent' ? '✓ Inviata' : 'Segna inviata'}
        </button>

        <div style={{ flex: 1 }} />

        {/* WhatsApp */}
        <button
          onClick={() => onWhatsApp(match)}
          title="Invia su WhatsApp"
          style={{
            width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
            background: '#25D366', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, transition: 'all 150ms'
          }}
        >
          📱
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(match.id)}
          title="Rimuovi"
          style={{
            width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'var(--bg-subtle)', color: '#E24B4A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, transition: 'all 150ms'
          }}
        >
          ✕
        </button>
      </div>
    </div>
  </div>
);

export const ClienteDetail: React.FC<ClienteDetailProps> = ({ cliente, isOpen, onClose, onUpdate, onDelete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [newMatch, setNewMatch] = useState({ property_name: '', property_url: '', match_score: 80, notes: '' });
  
  const [matches, setMatches] = useState<SearchResultProperty[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  const { activities, addActivity } = useClienteActivities(cliente?.id || '');
  const { matches: propertyMatches, addMatch, updateMatch, deleteMatch } = usePropertyMatches(cliente?.id || '');
  const searchPropertyMatches = async () => {
    setIsSearching(true);
    setMatchError(null);
    setHasSearched(true);
    
    try {
      const budgetStr = cliente.budget_max 
        ? `€${Number(cliente.budget_max).toLocaleString('it-IT')}` 
        : 'non specificato';
      
      const regioniStr = Array.isArray(cliente.regioni) 
        ? cliente.regioni.join(', ') 
        : (cliente.regioni || 'non specificate');
      
      const tipologiaStr = Array.isArray(cliente.tipologia)
        ? cliente.tipologia.join(', ')
        : (cliente.tipologia || 'non specificata');

      const prompt = `Cerca su cortesiluxuryrealestate.com/ricerca le proprietà 
disponibili più adatte a questo cliente. 
Usa Google Search per trovare proprietà REALI con URL REALI.
NON inventare URL — usa solo URL che trovi realmente sul sito.

PROFILO CLIENTE:
- Budget massimo: ${budgetStr}
- Regioni: ${regioniStr}  
- Tipologia: ${tipologiaStr}
- Camere minime: ${cliente.camere || 'non specificato'}
- Bagni minimi: ${cliente.bagni || 'non specificato'}
- Piscina: ${cliente.piscina || 'non specificato'}
- Uso: ${cliente.uso || 'non specificato'}

Cerca le proprietà reali sul sito e restituisci le TOP 3 più compatibili.
Per ogni proprietà usa SOLO l'URL reale trovato sul sito.
Includi l'URL dell'immagine di copertina se disponibile.

Rispondi SOLO con questo JSON (nessun testo aggiuntivo):
[
  {
    "titolo": "titolo reale della proprietà",
    "rif": "Rif. XXXX",
    "zona": "Città (Regione)",
    "prezzo": "€ X.XXX.XXX",
    "mq": "XXX mq",
    "camere": "X",
    "bagni": "X",
    "url": "https://cortesiluxuryrealestate.com/immobile/SLUG-REALE/",
    "immagine": "https://cortesiluxuryrealestate.com/wp-content/uploads/...",
    "motivazione": "Perché è adatta (1 frase)",
    "compatibilita": 8
  }
]`;

      const response = await searchPropertiesOnline(prompt);
      
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Nessuna proprietà trovata');
      
      const results: PropertyMatch[] = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(results) || results.length === 0) {
        throw new Error('Nessuna proprietà trovata');
      }
      
      results.forEach(r => {
        const exists = propertyMatches.some(m => m.url === r.url);
        if (!exists) {
          addMatch({
            titolo: r.titolo,
            url: r.url,
            immagine: r.immagine || '',
            rif: r.rif || '',
            zona: r.zona || '',
            prezzo: r.prezzo || '',
            mq: r.mq || '',
            camere: r.camere || '',
            bagni: r.bagni || '',
            motivazione: r.motivazione || '',
            compatibilita: r.compatibilita || 0,
            reaction: null,
            status: 'new',
            notes: '',
          });
        }
      });
      
    } catch (err: any) {
      console.error('Property match error:', err);
      setMatchError('Impossibile trovare proprietà. Riprova tra qualche secondo.');
    } finally {
      setIsSearching(false);
    }
  };

  const [isStatusEditing, setIsStatusEditing] = useState(false);
  const [isAssignedEditing, setIsAssignedEditing] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const prevStatusRef = useRef<string | undefined>(cliente?.status);

  useEffect(() => {
    if (cliente && prevStatusRef.current !== undefined && prevStatusRef.current !== cliente.status) {
      const statusLabel = CLIENTE_STATUS_CONFIG[cliente.status]?.label || cliente.status;
      addActivity({
        activity_type: 'status_change',
        title: `Stato cambiato in ${statusLabel}`,
        description: null,
        created_by: 'Sistema'
      });
    }
    prevStatusRef.current = cliente?.status;
  }, [cliente?.status, addActivity, cliente]);

  if (!cliente) return null;

  const statusConfig = CLIENTE_STATUS_CONFIG[cliente.status] || CLIENTE_STATUS_CONFIG.new;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const result = await analyzeCliente(cliente);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleAddComment = () => {
    if (!comment.trim()) return;
    addActivity({
      activity_type: 'comment',
      title: "Commento aggiunto",
      description: comment,
      created_by: 'Agente'
    });
    setComment("");
  };

  const handleQuickAction = (type: 'call' | 'email' | 'visit' | 'proposal', title: string) => {
    addActivity({
      activity_type: type,
      title,
      description: null,
      created_by: 'Agente'
    });
    
    if (onUpdate) {
      onUpdate(cliente.id, { last_contact_date: new Date().toISOString() });
    }
  };

  const handleAddPropertyMatch = () => {
    if (!newMatch.property_name) return;
    addMatch({
      titolo: newMatch.property_name,
      url: newMatch.property_url,
      compatibilita: newMatch.match_score,
      notes: newMatch.notes,
      reaction: null,
      status: 'new'
    });
    setNewMatch({ property_name: '', property_url: '', match_score: 80, notes: '' });
    setShowAddMatch(false);
  };

  const safeFormatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('it-IT');
  };

  const handleWhatsAppShare = (match: PropertyMatch) => {
    const phoneClean = cliente.telefono?.replace(/\D/g, '') || '';
    const text = `Ciao ${cliente.nome}! Ho trovato questa proprietà che potrebbe interessarti:\n\n🏠 *${match.titolo}*\n📍 ${match.zona || ''}\n💰 ${match.prezzo || ''}\n\n🔗 ${match.url}`;
    const url = `https://wa.me/${phoneClean}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleDelete = () => {
    if (window.confirm("Sei sicuro di voler eliminare questo cliente?")) {
      onDelete?.(cliente.id);
      onClose();
    }
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-[60]"
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
              top: '34px',
              bottom: 0,
              left: '220px', // Corrisponde alla larghezza della sidebar espansa
              zIndex: 70,
              backgroundColor: '#F5F5F0', // Colore caldo dell'app
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              overflowX: 'hidden',
              boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
              borderTopLeftRadius: '24px',
              borderBottomLeftRadius: '24px',
              borderLeft: '1px solid var(--border-light)'
            }}
          >
            {/* Header */}
            <div className="flex items-center h-[64px] px-6 border-b border-[var(--border-light)] bg-[#F5F5F0] sticky top-0 z-10">
              <button 
                onClick={onClose}
                className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex-1 px-4 truncate flex items-center gap-3">
                <button 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[16px] hover:bg-black/5 transition-colors"
                >
                  {cliente.emoji || '👤'}
                </button>
                {showEmojiPicker && (
                  <div className="absolute z-[80] top-[64px] left-[100px] mt-2">
                    <EmojiPicker onEmojiClick={(e) => { onUpdate?.(cliente.id, { emoji: e.emoji }); setShowEmojiPicker(false); }} />
                  </div>
                )}
                <h2 className="font-outfit font-semibold text-[15px] text-[var(--text-primary)] truncate">
                  {cliente.nome} {cliente.cognome}
                </h2>
                <div className="flex items-center gap-1">
                  {!isStatusEditing ? (
                    <Badge 
                      bg={statusConfig.bg} 
                      fg={statusConfig.fg} 
                      onClick={() => setIsStatusEditing(true)}
                    >
                      {statusConfig.label}
                    </Badge>
                  ) : (
                    <select
                      autoFocus
                      value={cliente.status}
                      onChange={(e) => {
                        onUpdate?.(cliente.id, { status: e.target.value as any });
                        setIsStatusEditing(false);
                      }}
                      onBlur={() => setIsStatusEditing(false)}
                      className="text-[10px] font-outfit font-medium uppercase tracking-wider bg-[var(--bg-subtle)] border-b border-black outline-none"
                    >
                      {Object.entries(CLIENTE_STATUS_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  )}
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star}
                      onClick={() => onUpdate?.(cliente.id, { rating: star })}
                      className={cn(
                        "transition-colors",
                        star <= (cliente.rating || 0) ? "text-amber-400" : "text-gray-200"
                      )}
                    >
                      <Star size={14} fill={star <= (cliente.rating || 0) ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button 
                  onClick={() => generateClientePDF(cliente, activities, propertyMatches)}
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
                <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
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
              <div 
                className="grid gap-4"
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: window.innerWidth > 768 ? '1fr 350px' : '1fr',
                  gap: 16
                }}
              >
                
                {/* COLUMN 1 (Preferences) */}
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl">
                    <EditableField label="Budget" value={cliente.budget_max} type="number" prefix="€" onSave={(v) => onUpdate?.(cliente.id, { budget_max: parseFloat(v) })} />
                    <EditableField label="Mutuo" value={MUTUO_LABELS[cliente.mutuo || ''] || cliente.mutuo} onSave={(v) => onUpdate?.(cliente.id, { mutuo: v })} />
                    <EditableField label="Tempo Ricerca" value={cliente.tempo_ricerca} onSave={(v) => onUpdate?.(cliente.id, { tempo_ricerca: v })} />
                    <EditableField label="Ha Visitato" value={cliente.ha_visitato} onSave={(v) => onUpdate?.(cliente.id, { ha_visitato: v })} />
                    
                    <div className="flex flex-col gap-0.5 group cursor-pointer" onClick={() => window.location.href = `tel:${cliente.telefono}`}>
                      <span className="text-[10px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-[0.08em]">Telefono</span>
                      <span className="text-[13px] font-outfit font-normal text-[var(--text-primary)] group-hover:text-indigo-600 transition-colors">{cliente.telefono || '-'}</span>
                    </div>

                    <div className="flex flex-col gap-0.5 group cursor-pointer" onClick={() => window.location.href = `mailto:${cliente.email}`}>
                      <span className="text-[10px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-[0.08em]">Email</span>
                      <span className="text-[13px] font-outfit font-normal text-[var(--text-primary)] group-hover:text-indigo-600 transition-colors truncate">{cliente.email || '-'}</span>
                    </div>

                    <EditableField label="Paese" value={cliente.paese} onSave={(v) => onUpdate?.(cliente.id, { paese: v })} />
                    <EditableField label="Lingua" value={cliente.lingua} onSave={(v) => onUpdate?.(cliente.id, { lingua: v })} />
                  </div>
                  
                  {/* Preferences (moved from Column 2) */}
                  <div className="bg-white p-4 rounded-xl">
                    <Section title="PREFERENZE ZONA">
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-[0.08em]">Regioni</span>
                          <div className="flex flex-wrap gap-1.5">
                            {cliente.regioni?.map(r => (
                              <Badge key={r} bg="var(--bg-subtle)" fg="var(--text-primary)">{r}</Badge>
                            ))}
                          </div>
                        </div>
                        <EditableField label="Vicinanza città" value={cliente.vicinanza_citta} onSave={(v) => onUpdate?.(cliente.id, { vicinanza_citta: v })} />
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-[0.08em]">Motivo zona</span>
                          <div className="flex flex-wrap gap-1.5">
                            {cliente.motivo_zona?.map(m => (
                              <Badge key={m} bg="var(--bg-subtle)" fg="var(--text-primary)">{m}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Section>

                    <Section title="PREFERENZE IMMOBILE">
                      <div className="flex flex-col gap-6">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-[0.08em]">Tipologia</span>
                            <div className="flex flex-wrap gap-1.5">
                              {cliente.tipologia?.map(t => <Badge key={t}>{t}</Badge>)}
                            </div>
                          </div>
                          <EditableField label="Stile" value={cliente.stile} onSave={(v) => onUpdate?.(cliente.id, { stile: v })} />
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-[0.08em]">Contesto</span>
                            <div className="flex flex-wrap gap-1.5">
                              {cliente.contesto?.map(c => <Badge key={c}>{c}</Badge>)}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <EditableField label="Dim. Min" value={cliente.dimensione_min} type="number" onSave={(v) => onUpdate?.(cliente.id, { dimensione_min: parseInt(v) })} />
                            <EditableField label="Dim. Max" value={cliente.dimensione_max} type="number" onSave={(v) => onUpdate?.(cliente.id, { dimensione_max: parseInt(v) })} />
                          </div>
                          <EditableField label="Camere" value={cliente.camere} onSave={(v) => onUpdate?.(cliente.id, { camere: v })} />
                          <EditableField label="Bagni" value={cliente.bagni} onSave={(v) => onUpdate?.(cliente.id, { bagni: v })} />
                          <EditableField label="Layout" value={cliente.layout} onSave={(v) => onUpdate?.(cliente.id, { layout: v })} />
                          <EditableField label="Dependance" value={cliente.dependance} onSave={(v) => onUpdate?.(cliente.id, { dependance: v })} />
                          <EditableField label="Terreno" value={cliente.terreno} onSave={(v) => onUpdate?.(cliente.id, { terreno: v })} />
                          <EditableField label="Piscina" value={cliente.piscina} onSave={(v) => onUpdate?.(cliente.id, { piscina: v })} />
                          <EditableField label="Uso" value={USO_LABELS[cliente.uso || ''] || cliente.uso} onSave={(v) => onUpdate?.(cliente.id, { uso: v })} />
                          <EditableField label="Interesse affitto" value={AFFITTO_LABELS[cliente.interesse_affitto || ''] || cliente.interesse_affitto} onSave={(v) => onUpdate?.(cliente.id, { interesse_affitto: v })} />
                        </div>
                      </div>
                    </Section>
                  </div>
                </div>

                {/* COLUMN 2 (Sidebar) */}
                <div className="flex flex-col gap-4">
                  <Section title="ANALISI AI">
                    <div className="flex flex-col gap-4">
                      <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="w-full py-2.5 bg-black text-white rounded-full font-outfit font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                      >
                        {isAnalyzing ? <Clock size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        {analysis ? 'RI-ANALIZZA CON GEMINI' : 'ANALIZZA CON GEMINI'}
                      </button>
                      {analysis && (
                        <div className="bg-[var(--bg-subtle)] rounded-xl p-4">
                          <div className="markdown-body">
                            <Markdown components={{
                              h2: ({node, ...props}) => <b className="block mt-4 mb-1 text-[12px] font-outfit font-bold uppercase tracking-tight" {...props} />,
                              p: ({node, ...props}) => <p className="text-[12px] leading-relaxed text-[var(--text-secondary)] mb-2" {...props} />
                            }}>
                              {analysis}
                            </Markdown>
                          </div>
                        </div>
                      )}
                    </div>
                  </Section>

                  <Section title="COMMENTI">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {activities.filter(a => a.activity_type === 'comment').map((activity) => (
                          <div key={activity.id} className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-[var(--text-primary)]">{activity.created_by}</span>
                              <span className="text-[9px] text-[var(--text-muted)]">
                                {activity.created_at ? formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: it }) : '-'}
                              </span>
                            </div>
                            <p className="text-[12px] text-[var(--text-secondary)] leading-snug">{activity.description}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="text"
                          placeholder="Scrivi..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                          className="flex-1 bg-[var(--bg-subtle)] border-0 rounded-full px-4 py-2 text-[12px] font-outfit outline-none"
                        />
                        <button 
                          onClick={handleAddComment}
                          className="p-2 bg-black text-white rounded-full hover:opacity-80 transition-all"
                        >
                          <Send size={14} />
                        </button>
                      </div>
                    </div>
                  </Section>

                  <Section title="PROPRIETÀ COMPATIBILI">
                    <div className="flex flex-col gap-4">
                      {!hasSearched && (
                        <button
                          onClick={searchPropertyMatches}
                          disabled={isSearching}
                          className="w-full py-2.5 bg-black text-white rounded-full font-outfit font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                        >
                          {isSearching ? <Clock size={14} className="animate-spin" /> : <Home size={14} />}
                          🏠 Trova Proprietà Compatibili
                        </button>
                      )}
                      
                      {!hasSearched && (
                        <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Outfit',
                          textAlign: 'center', marginBottom: 12, marginTop: -8 }}>
                          Powered by Gemini AI · Cerca in tempo reale su cortesiluxuryrealestate.com
                        </p>
                      )}
                      
                      {isSearching && <p className="text-[12px] text-[var(--text-muted)] font-outfit">Ricerca in corso su cortesiluxuryrealestate.com...</p>}
                      {matchError && <p className="text-[12px] text-[#991B1B] font-outfit">{matchError}</p>}
                      
                      {hasSearched && !isSearching && !matchError && matches.length === 0 && (
                        <p className="text-[12px] text-[var(--text-muted)] font-outfit">Nessuna proprietà compatibile trovata.</p>
                      )}
                      
                      {propertyMatches.sort((a, b) => {
                        const scoreA = a.reaction === 'like' ? 3 : a.reaction === 'dislike' ? 1 : 2;
                        const scoreB = b.reaction === 'like' ? 3 : b.reaction === 'dislike' ? 1 : 2;
                        if (scoreA !== scoreB) return scoreB - scoreA;
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                      }).map((m) => (
                        <PropertyMatchCard 
                          key={m.id} 
                          match={m} 
                          onReaction={(id, r) => updateMatch(id, { reaction: r })}
                          onStatusChange={(id, s) => updateMatch(id, { status: s })}
                          onDelete={deleteMatch}
                          onWhatsApp={handleWhatsAppShare}
                        />
                      ))}
                    </div>
                  </Section>

                  <Section title="PROVENIENZA">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-[0.08em]">Portale</span>
                        <Badge bg="var(--bg-subtle)" fg="var(--text-primary)" className="w-fit">{cliente.portale || '-'}</Badge>
                      </div>
                      <EditableField label="Proprietà visitata" value={cliente.proprieta_visitata} onSave={(v) => onUpdate?.(cliente.id, { proprieta_visitata: v })} />
                      <EditableField label="Ref Number" value={cliente.ref_number} onSave={(v) => onUpdate?.(cliente.id, { ref_number: v })} />
                      <EditableField label="Contattato da" value={cliente.contattato_da} onSave={(v) => onUpdate?.(cliente.id, { contattato_da: v })} />
                      <EditableField label="Tipo contatto" value={cliente.tipo_contatto} onSave={(v) => onUpdate?.(cliente.id, { tipo_contatto: v })} />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-[0.08em]">Data Inserimento</span>
                        <span className="text-[13px] font-outfit font-normal text-[var(--text-primary)]">
                          {safeFormatDate(cliente.created_at)}
                        </span>
                      </div>
                    </div>
                  </Section>

                  <Section title="NOTE">
                    <div className="flex flex-col gap-6">
                      <EditableTextarea label="Descrizione" value={cliente.descrizione} onSave={(v) => onUpdate?.(cliente.id, { descrizione: v })} />
                      <EditableTextarea label="Note Extra" value={cliente.note_extra} onSave={(v) => onUpdate?.(cliente.id, { note_extra: v })} />
                    </div>
                  </Section>

                  <Section title="REMINDER">
                    <div className="flex flex-col gap-4">
                      <EditableField 
                        label="Data Reminder" 
                        value={cliente.reminder_date} 
                        type="datetime-local"
                        onSave={(v) => onUpdate?.(cliente.id, { reminder_date: v })} 
                      />
                      <a 
                        href={cliente.reminder_date && !isNaN(new Date(cliente.reminder_date).getTime()) ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Follow-up+${cliente.nome}+${cliente.cognome}&dates=${new Date(cliente.reminder_date).toISOString().replace(/-|:|\.\d\d\d/g, "")}/${new Date(new Date(cliente.reminder_date).getTime() + 3600000).toISOString().replace(/-|:|\.\d\d\d/g, "")}` : '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-outfit font-bold text-black uppercase tracking-wider hover:underline flex items-center gap-1.5"
                      >
                        Apri in Calendar
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </Section>
                </div>
              </div>

              <div className="py-10 text-center border-t border-[var(--border-light)]">
                <span className="text-[11px] text-[var(--text-muted)] font-outfit uppercase tracking-widest">
                  Leadomancy CRM
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
