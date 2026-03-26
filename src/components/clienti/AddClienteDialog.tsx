import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { Cliente, ClienteStatus } from "@/src/types";
import { useClienti } from "@/src/hooks/useClienti";
import { MultiCheckboxField } from "./MultiCheckboxField";
import { 
  REGIONI_OPTIONS, 
  TIPOLOGIA_OPTIONS, 
  STILE_OPTIONS, 
  CONTESTO_OPTIONS, 
  MOTIVO_ZONA_OPTIONS, 
  TEMPO_RICERCA_OPTIONS,
  MUTUO_OPTIONS,
  HA_VISITATO_OPTIONS,
  VICINANZA_OPTIONS,
  TERRENO_OPTIONS,
  PISCINA_OPTIONS,
  USO_OPTIONS,
  INTERESSE_AFFITTO_OPTIONS,
  TIPO_CONTATTO_OPTIONS,
  CAMERE_OPTIONS,
  BAGNI_OPTIONS,
  LAYOUT_OPTIONS,
  DEPENDANCE_OPTIONS,
  CLIENTE_STATUS_CONFIG
} from "./clienteFormOptions";
import { cn } from "@/src/lib/utils";

const FormSection = ({ title, children, isOpen, onToggle }: { title: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void }) => {
  return (
    <div className="border-b border-[var(--border-light)] last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 px-1 hover:bg-black/5 transition-colors"
      >
        <span className="font-outfit font-semibold text-[13px] uppercase tracking-wider text-[var(--text-primary)]">
          {title}
        </span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pb-6 px-1 flex flex-col gap-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FormInput = ({ label, type = "text", value, onChange, placeholder, required, suffix }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-wider">
      {label}{required && '*'}
    </label>
    <div className="relative">
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-[var(--bg-subtle)] border-0 rounded-[8px] p-2 px-3 text-[13px] font-outfit outline-none focus:ring-1 focus:ring-black/10"
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[var(--text-muted)] font-outfit">
          {suffix}
        </span>
      )}
    </div>
  </div>
);

const FormSelect = ({ label, options, value, onChange }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-wider">
      {label}
    </label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="bg-[var(--bg-subtle)] border-0 rounded-[8px] p-2 px-3 text-[13px] font-outfit outline-none appearance-none"
    >
      {options.map((opt: any) => (
        <option key={typeof opt === 'string' ? opt : opt.v} value={typeof opt === 'string' ? opt : opt.v}>
          {typeof opt === 'string' ? opt : opt.l}
        </option>
      ))}
    </select>
  </div>
);

interface AddClienteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialStatus?: ClienteStatus;
}

export const AddClienteDialog: React.FC<AddClienteDialogProps> = ({ isOpen, onClose, initialStatus }) => {
  const { addCliente } = useClienti();
  const [formData, setFormData] = useState<Partial<Cliente>>({
    nome: '',
    cognome: '',
    telefono: '',
    email: '',
    paese: '',
    lingua: '',
    budget_max: 0,
    mutuo: 'not_sure',
    tempo_ricerca: '3-6 months',
    ha_visitato: 'no',
    regioni: [],
    vicinanza_citta: 'no',
    motivo_zona: [],
    tipologia: [],
    stile: 'Countryside / Rustic',
    contesto: [],
    dimensione_min: 0,
    dimensione_max: 0,
    camere: '3',
    bagni: '2',
    layout: 'Traditional',
    dependance: 'maybe',
    terreno: 'maybe',
    piscina: 'optional',
    uso: 'second_home',
    interesse_affitto: 'not_sure',
    portale: '',
    proprieta_visitata: '',
    ref_number: '',
    contattato_da: '',
    tipo_contatto: 'Email',
    descrizione: '',
    note_extra: '',
    status: initialStatus || 'new',
    created_at: new Date().toISOString().split('T')[0],
  });

  const [openSections, setOpenSections] = useState<string[]>(['Contatto', 'Budget & Tempistiche']);

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome) return;
    addCliente(formData);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/25"
          />

          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-2xl bg-white border border-[var(--border-light)] rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-light)]">
              <h2 className="font-outfit font-semibold text-[14px] uppercase tracking-widest text-[var(--text-primary)]">
                NUOVO BUYER
              </h2>
              <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 pt-0">
              <FormSection title="Contatto" isOpen={openSections.includes('Contatto')} onToggle={() => toggleSection('Contatto')}>
                <div className="grid grid-cols-2 gap-4">
                  <FormInput label="Nome" required value={formData.nome} onChange={(v: string) => setFormData({ ...formData, nome: v })} />
                  <FormInput label="Cognome" value={formData.cognome} onChange={(v: string) => setFormData({ ...formData, cognome: v })} />
                  <FormInput label="Telefono" type="tel" value={formData.telefono} onChange={(v: string) => setFormData({ ...formData, telefono: v })} />
                  <FormInput label="Email" type="email" value={formData.email} onChange={(v: string) => setFormData({ ...formData, email: v })} />
                  <FormInput label="Paese" value={formData.paese} onChange={(v: string) => setFormData({ ...formData, paese: v })} />
                  <FormInput label="Lingua" value={formData.lingua} onChange={(v: string) => setFormData({ ...formData, lingua: v })} />
                </div>
              </FormSection>

              <FormSection title="Budget & Tempistiche" isOpen={openSections.includes('Budget & Tempistiche')} onToggle={() => toggleSection('Budget & Tempistiche')}>
                <div className="grid grid-cols-2 gap-4">
                  <FormInput label="Budget Max" type="number" suffix="€" value={formData.budget_max} onChange={(v: number) => setFormData({ ...formData, budget_max: v })} />
                  <FormSelect label="Mutuo" options={MUTUO_OPTIONS} value={formData.mutuo} onChange={(v: string) => setFormData({ ...formData, mutuo: v })} />
                  <FormSelect label="Tempo di ricerca" options={TEMPO_RICERCA_OPTIONS} value={formData.tempo_ricerca} onChange={(v: string) => setFormData({ ...formData, tempo_ricerca: v })} />
                  <FormSelect label="Ha visitato" options={HA_VISITATO_OPTIONS} value={formData.ha_visitato} onChange={(v: string) => setFormData({ ...formData, ha_visitato: v })} />
                </div>
              </FormSection>

              <FormSection title="Zona & Contesto" isOpen={openSections.includes('Zona & Contesto')} onToggle={() => toggleSection('Zona & Contesto')}>
                <MultiCheckboxField label="Regioni" options={REGIONI_OPTIONS} value={formData.regioni || []} onChange={(v: string[]) => setFormData({ ...formData, regioni: v })} />
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <FormSelect label="Vicinanza città" options={VICINANZA_OPTIONS} value={formData.vicinanza_citta} onChange={(v: string) => setFormData({ ...formData, vicinanza_citta: v })} />
                  <MultiCheckboxField label="Motivo zona" options={MOTIVO_ZONA_OPTIONS} value={formData.motivo_zona || []} onChange={(v: string[]) => setFormData({ ...formData, motivo_zona: v })} />
                </div>
              </FormSection>

              <FormSection title="Tipologia & Stile" isOpen={openSections.includes('Tipologia & Stile')} onToggle={() => toggleSection('Tipologia & Stile')}>
                <MultiCheckboxField label="Tipologia" options={TIPOLOGIA_OPTIONS} value={formData.tipologia || []} onChange={(v: string[]) => setFormData({ ...formData, tipologia: v })} />
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <FormSelect label="Stile" options={STILE_OPTIONS} value={formData.stile} onChange={(v: string) => setFormData({ ...formData, stile: v })} />
                  <MultiCheckboxField label="Contesto" options={CONTESTO_OPTIONS} value={formData.contesto || []} onChange={(v: string[]) => setFormData({ ...formData, contesto: v })} />
                </div>
              </FormSection>

              <FormSection title="Caratteristiche" isOpen={openSections.includes('Caratteristiche')} onToggle={() => toggleSection('Caratteristiche')}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex gap-2">
                    <FormInput label="Dim. Min" type="number" suffix="mq" value={formData.dimensione_min} onChange={(v: number) => setFormData({ ...formData, dimensione_min: v })} />
                    <FormInput label="Dim. Max" type="number" suffix="mq" value={formData.dimensione_max} onChange={(v: number) => setFormData({ ...formData, dimensione_max: v })} />
                  </div>
                  <FormSelect label="Camere" options={CAMERE_OPTIONS} value={formData.camere} onChange={(v: string) => setFormData({ ...formData, camere: v })} />
                  <FormSelect label="Bagni" options={BAGNI_OPTIONS} value={formData.bagni} onChange={(v: string) => setFormData({ ...formData, bagni: v })} />
                  <FormSelect label="Layout" options={LAYOUT_OPTIONS} value={formData.layout} onChange={(v: string) => setFormData({ ...formData, layout: v })} />
                  <FormSelect label="Dependance" options={DEPENDANCE_OPTIONS} value={formData.dependance} onChange={(v: string) => setFormData({ ...formData, dependance: v })} />
                  <FormSelect label="Terreno" options={TERRENO_OPTIONS} value={formData.terreno} onChange={(v: string) => setFormData({ ...formData, terreno: v })} />
                  <FormSelect label="Piscina" options={PISCINA_OPTIONS} value={formData.piscina} onChange={(v: string) => setFormData({ ...formData, piscina: v })} />
                  <FormSelect label="Uso" options={USO_OPTIONS} value={formData.uso} onChange={(v: string) => setFormData({ ...formData, uso: v })} />
                  <FormSelect label="Interesse affitto" options={INTERESSE_AFFITTO_OPTIONS} value={formData.interesse_affitto} onChange={(v: string) => setFormData({ ...formData, interesse_affitto: v })} />
                </div>
              </FormSection>

              <FormSection title="Provenienza" isOpen={openSections.includes('Provenienza')} onToggle={() => toggleSection('Provenienza')}>
                <div className="grid grid-cols-2 gap-4">
                  <FormInput label="Portale" value={formData.portale} onChange={(v: string) => setFormData({ ...formData, portale: v })} />
                  <FormInput label="Proprietà visitata" value={formData.proprieta_visitata} onChange={(v: string) => setFormData({ ...formData, proprieta_visitata: v })} />
                  <FormInput label="Ref Number" value={formData.ref_number} onChange={(v: string) => setFormData({ ...formData, ref_number: v })} />
                  <FormInput label="Contattato da" value={formData.contattato_da} onChange={(v: string) => setFormData({ ...formData, contattato_da: v })} />
                  <FormSelect label="Tipo contatto" options={TIPO_CONTATTO_OPTIONS} value={formData.tipo_contatto} onChange={(v: string) => setFormData({ ...formData, tipo_contatto: v })} />
                </div>
              </FormSection>

              <FormSection title="Note" isOpen={openSections.includes('Note')} onToggle={() => toggleSection('Note')}>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-wider">Descrizione</label>
                    <textarea
                      value={formData.descrizione}
                      onChange={e => setFormData({ ...formData, descrizione: e.target.value })}
                      className="bg-[var(--bg-subtle)] border-0 rounded-[8px] p-2 px-3 text-[13px] font-outfit outline-none h-24 resize-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-wider">Note Extra</label>
                    <textarea
                      value={formData.note_extra}
                      onChange={e => setFormData({ ...formData, note_extra: e.target.value })}
                      className="bg-[var(--bg-subtle)] border-0 rounded-[8px] p-2 px-3 text-[13px] font-outfit outline-none h-24 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput label="Data Inserimento" type="date" value={formData.created_at} onChange={(v: string) => setFormData({ ...formData, created_at: v })} />
                    <FormSelect label="Stato" options={Object.keys(CLIENTE_STATUS_CONFIG).map(k => ({ v: k, l: CLIENTE_STATUS_CONFIG[k].label }))} value={formData.status} onChange={(v: string) => setFormData({ ...formData, status: v as ClienteStatus })} />
                  </div>
                </div>
              </FormSection>

              {/* Submit Button */}
              <div className="sticky bottom-0 bg-white pt-4 pb-2 mt-4 border-t border-[var(--border-light)]">
                <button
                  type="submit"
                  className="w-full h-11 bg-[#1A1A18] text-white rounded-full font-outfit font-semibold text-[14px] uppercase tracking-widest hover:bg-black transition-all shadow-lg"
                >
                  AGGIUNGI BUYER
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
