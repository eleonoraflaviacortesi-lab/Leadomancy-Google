import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Phone, Mail, MapPin, Euro, Calendar, Clock, Sparkles, User, FileText, MessageSquare } from "lucide-react";
import Markdown from "react-markdown";
import { Cliente } from "@/src/types";
import { CLIENTE_STATUS_CONFIG } from "./clienteFormOptions";
import { analyzeCliente } from "@/src/services/gemini";
import { cn, formatCurrency } from "@/src/lib/utils";

interface ClienteDetailProps {
  cliente: Cliente | null;
  isOpen: boolean;
  onClose: () => void;
}

const Badge = ({ children, bg, fg, className }: { children: React.ReactNode; bg?: string; fg?: string; className?: string }) => (
  <span 
    className={cn(
      "px-2 py-0.5 rounded-full font-outfit font-medium text-[10px] uppercase tracking-wider inline-block",
      className
    )}
    style={{ backgroundColor: bg || 'var(--bg-subtle)', color: fg || 'var(--text-secondary)' }}
  >
    {children}
  </span>
);

export const ClienteDetail: React.FC<ClienteDetailProps> = ({ cliente, isOpen, onClose }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  if (!cliente) return null;

  const statusConfig = CLIENTE_STATUS_CONFIG[cliente.status] || CLIENTE_STATUS_CONFIG.new;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const result = await analyzeCliente(cliente);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <div className="flex flex-col gap-3 py-6 border-b border-[var(--border-light)] last:border-0">
      <div className="flex items-center gap-2 text-[var(--text-muted)]">
        <Icon size={14} />
        <span className="font-outfit font-semibold text-[11px] uppercase tracking-wider">{title}</span>
      </div>
      <div className="flex flex-col gap-3">
        {children}
      </div>
    </div>
  );

  const InfoRow = ({ label, value, href }: { label: string; value: React.ReactNode; href?: string }) => (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-tight">{label}</span>
      {href ? (
        <a href={href} className="text-[13px] font-outfit font-medium text-[var(--text-primary)] hover:underline">
          {value}
        </a>
      ) : (
        <span className="text-[13px] font-outfit font-medium text-[var(--text-primary)]">
          {value || '-'}
        </span>
      )}
    </div>
  );

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
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[70] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-light)]">
              <div className="flex flex-col">
                <h2 className="font-outfit font-semibold text-[18px] text-[var(--text-primary)]">
                  {cliente.nome} {cliente.cognome}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge bg={statusConfig.bg} fg={statusConfig.fg}>
                    {statusConfig.label}
                  </Badge>
                  {cliente.ref_number && (
                    <span className="text-[11px] text-[var(--text-muted)] font-outfit">
                      #{cliente.ref_number}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 pt-0">
              {/* Analisi AI */}
              <div className="mt-6">
                {!analysis && !isAnalyzing ? (
                  <button
                    onClick={handleAnalyze}
                    className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-outfit font-semibold text-[13px] flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                  >
                    <Sparkles size={16} />
                    ANALIZZA CON GEMINI
                  </button>
                ) : isAnalyzing ? (
                  <div className="bg-[var(--bg-subtle)] rounded-xl p-4 flex flex-col gap-2 animate-pulse">
                    <div className="h-4 bg-black/5 rounded w-1/3" />
                    <div className="h-3 bg-black/5 rounded w-full" />
                    <div className="h-3 bg-black/5 rounded w-full" />
                    <div className="h-3 bg-black/5 rounded w-2/3" />
                  </div>
                ) : (
                  <div className="bg-[var(--bg-subtle)] rounded-xl p-4 relative">
                    <div className="flex items-center gap-2 mb-3 text-indigo-600">
                      <Sparkles size={14} />
                      <span className="font-outfit font-bold text-[11px] uppercase tracking-wider">Analisi AI Strategica</span>
                    </div>
                    <div className="markdown-body">
                      <Markdown components={{
                        h2: ({node, ...props}) => <b className="block mt-4 mb-1 text-[13px] font-outfit font-bold uppercase tracking-tight" {...props} />,
                        p: ({node, ...props}) => <p className="text-[13px] leading-relaxed text-[var(--text-secondary)] mb-2" {...props} />
                      }}>
                        {analysis}
                      </Markdown>
                    </div>
                  </div>
                )}
              </div>

              <Section title="Contatto" icon={User}>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Telefono" value={cliente.telefono} href={`tel:${cliente.telefono}`} />
                  <InfoRow label="Email" value={cliente.email} href={`mailto:${cliente.email}`} />
                  <InfoRow label="Paese" value={cliente.paese} />
                  <InfoRow label="Lingua" value={cliente.lingua} />
                </div>
              </Section>

              <Section title="Budget & Ricerca" icon={Euro}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 col-span-2">
                    <span className="text-[10px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-tight">Budget Massimo</span>
                    <span className="text-[24px] font-outfit font-bold text-[var(--text-primary)]">
                      {cliente.budget_max ? formatCurrency(cliente.budget_max) : '-'}
                    </span>
                  </div>
                  <InfoRow label="Mutuo" value={cliente.mutuo} />
                  <InfoRow label="Tempo di ricerca" value={cliente.tempo_ricerca} />
                  <div className="col-span-2">
                    <InfoRow label="Ha visitato" value={<Badge>{cliente.ha_visitato}</Badge>} />
                  </div>
                </div>
              </Section>

              <Section title="Preferenze Zona" icon={MapPin}>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-tight">Regioni</span>
                    <div className="flex flex-wrap gap-1.5">
                      {cliente.regioni?.map(r => <Badge key={r}>{r}</Badge>)}
                    </div>
                  </div>
                  <InfoRow label="Vicinanza città" value={cliente.vicinanza_citta} />
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-tight">Motivo zona</span>
                    <div className="flex flex-wrap gap-1.5">
                      {cliente.motivo_zona?.map(m => <Badge key={m}>{m}</Badge>)}
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="Preferenze Immobile" icon={FileText}>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-tight">Tipologia</span>
                    <div className="flex flex-wrap gap-1.5">
                      {cliente.tipologia?.map(t => <Badge key={t}>{t}</Badge>)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow label="Stile" value={cliente.stile} />
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-tight">Contesto</span>
                      <div className="flex flex-wrap gap-1.5">
                        {cliente.contesto?.map(c => <Badge key={c}>{c}</Badge>)}
                      </div>
                    </div>
                    <InfoRow label="Dimensioni" value={`${cliente.dimensione_min} - ${cliente.dimensione_max} mq`} />
                    <InfoRow label="Camere" value={cliente.camere} />
                    <InfoRow label="Bagni" value={cliente.bagni} />
                    <InfoRow label="Layout" value={cliente.layout} />
                    <InfoRow label="Dependance" value={cliente.dependance} />
                    <InfoRow label="Terreno" value={cliente.terreno} />
                    <InfoRow label="Piscina" value={cliente.piscina} />
                    <InfoRow label="Uso" value={cliente.uso} />
                    <InfoRow label="Interesse affitto" value={cliente.interesse_affitto} />
                  </div>
                </div>
              </Section>

              <Section title="Provenienza & Assegnazione" icon={MessageSquare}>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Portale" value={cliente.portale} />
                  <InfoRow label="Ref Number" value={cliente.ref_number} />
                  <InfoRow label="Proprietà visitata" value={cliente.proprieta_visitata} />
                  <InfoRow label="Contattato da" value={cliente.contattato_da} />
                  <InfoRow label="Tipo contatto" value={cliente.tipo_contatto} />
                  <InfoRow label="Assegnato a" value={cliente.assigned_to} />
                </div>
              </Section>

              <Section title="Note & Descrizione" icon={FileText}>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-tight">Descrizione</span>
                    <p className="text-[13px] leading-relaxed text-[var(--text-secondary)] bg-[var(--bg-subtle)] p-3 rounded-lg">
                      {cliente.descrizione || 'Nessuna descrizione.'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-tight">Note Extra</span>
                    <p className="text-[13px] leading-relaxed text-[var(--text-secondary)] border border-[var(--border-light)] p-3 rounded-lg">
                      {cliente.note_extra || 'Nessuna nota extra.'}
                    </p>
                  </div>
                </div>
              </Section>

              <div className="py-10 text-center">
                <span className="text-[11px] text-[var(--text-muted)] font-outfit">
                  Creato il {new Date(cliente.created_at).toLocaleDateString('it-IT')}
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
