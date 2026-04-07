import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Plus, Minus, Save, Calendar, AlertCircle, TrendingUp, DollarSign, Users, FileText, ShoppingBag, CreditCard } from "lucide-react";
import { useDailyData } from "@/src/hooks/useDailyData";
import { CicloProduttivo } from "@/src/types";
import { cn, formatCurrency } from "@/src/lib/utils";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";

const CounterField = ({ label, field, formData, onNumberInputChange }: { 
  label: string; 
  field: keyof CicloProduttivo; 
  formData: any; 
  onNumberInputChange: any;
}) => (
  <div className="flex flex-col gap-1.5 p-3 bg-[var(--bg-subtle)] border border-[var(--border-light)] rounded-[12px] group hover:border-[var(--border-medium)] transition-all shadow-sm">
    <span className="text-[9px] font-outfit font-bold text-[var(--text-primary)] uppercase tracking-[0.1em]">{label}</span>
    <input
      type="number"
      value={formData[field] === null ? '' : formData[field]}
      onChange={(e) => onNumberInputChange(field, e.target.value)}
      placeholder="0"
      className="w-full bg-white border border-[var(--border-light)] rounded-lg h-7 text-center font-outfit font-bold text-[12px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/10 transition-all shadow-sm"
    />
  </div>
);

const CurrencyField = ({ label, field, formData, onNumberInputChange }: { 
  label: string; 
  field: keyof CicloProduttivo; 
  formData: any; 
  onNumberInputChange: any 
}) => (
  <div className="flex flex-col gap-1.5 p-3 bg-[var(--bg-subtle)] border border-[var(--border-light)] rounded-[12px] group hover:border-[var(--border-medium)] transition-all shadow-sm">
    <span className="text-[9px] font-outfit font-bold text-[var(--text-primary)] uppercase tracking-[0.1em]">{label}</span>
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-outfit font-bold text-[var(--text-muted)]">€</span>
      <input
        type="number"
        value={formData[field] === null ? '' : formData[field]}
        onChange={(e) => onNumberInputChange(field, e.target.value)}
        placeholder="0.00"
        className="w-full pl-6 pr-3 h-7 bg-white border border-[var(--border-light)] rounded-lg font-outfit font-bold text-[12px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/10 transition-all shadow-sm"
      />
    </div>
  </div>
);

interface ReportFormProps {
  initialDate?: string;
}

export const ReportForm: React.FC<ReportFormProps> = ({ initialDate }) => {
  const { myData, saveDailyData } = useDailyData();
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (initialDate) setSelectedDate(initialDate);
  }, [initialDate]);
  
  const existingReport = myData.find(r => r.date === selectedDate);

  const [formData, setFormData] = useState<Partial<Record<keyof CicloProduttivo, number | null | string>>>({
    contatti_reali: null,
    notizie_reali: null,
    appuntamenti_vendita: null,
    acquisizioni: null,
    incarichi_vendita: null,
    valutazioni_fatte: null,
    vendite_numero: null,
    vendite_valore: null,
    nuove_trattative: null,
    trattative_chiuse: null,
    fatturato_a_credito: null,
    notes: ''
  });

  useEffect(() => {
    if (existingReport) {
      setFormData({
        contatti_reali: existingReport.contatti_reali ?? null,
        notizie_reali: existingReport.notizie_reali ?? null,
        appuntamenti_vendita: existingReport.appuntamenti_vendita ?? null,
        acquisizioni: existingReport.acquisizioni ?? null,
        incarichi_vendita: existingReport.incarichi_vendita ?? null,
        valutazioni_fatte: existingReport.valutazioni_fatte ?? null,
        vendite_numero: existingReport.vendite_numero ?? null,
        vendite_valore: existingReport.vendite_valore ?? null,
        nuove_trattative: existingReport.nuove_trattative ?? null,
        trattative_chiuse: existingReport.trattative_chiuse ?? null,
        fatturato_a_credito: existingReport.fatturato_a_credito ?? null,
        notes: existingReport.notes || ''
      });
    } else {
      setFormData({
        contatti_reali: null,
        notizie_reali: null,
        appuntamenti_vendita: null,
        acquisizioni: null,
        incarichi_vendita: null,
        valutazioni_fatte: null,
        vendite_numero: null,
        vendite_valore: null,
        nuove_trattative: null,
        trattative_chiuse: null,
        fatturato_a_credito: null,
        notes: ''
      });
    }
  }, [existingReport, selectedDate]);

  const handleInputChange = (field: keyof CicloProduttivo, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleNumberInputChange = (field: keyof CicloProduttivo, value: string) => {
    if (value === '') {
      setFormData({ ...formData, [field]: null });
      return;
    }
    const num = parseFloat(value);
    setFormData({ ...formData, [field]: Math.max(0, isNaN(num) ? 0 : num) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = { ...formData };
    // Convert null to 0
    (Object.keys(dataToSave) as (keyof CicloProduttivo)[]).forEach(key => {
      if (dataToSave[key] === null) {
        dataToSave[key] = 0;
      }
    });
    saveDailyData({ data: dataToSave as CicloProduttivo, date: selectedDate });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10">
      {/* Date Selector */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-outfit font-bold text-[var(--text-muted)] uppercase tracking-[0.1em] flex items-center gap-2 px-1">
            <Calendar size={12} />
            Data del Ciclo
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full sm:w-56 bg-[var(--bg-subtle)] border border-[var(--border-light)] rounded-[14px] p-3 px-4 text-[14px] font-outfit font-bold text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--text-primary)]/10 transition-all shadow-sm hover:border-[var(--border-medium)]"
          />
        </div>

        {existingReport && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#FEF5D0] border border-[#F5C842]/30 rounded-[16px] p-4 flex items-center gap-3 shadow-sm"
          >
            <AlertCircle size={18} className="text-[#5C3800]" />
            <span className="text-[13px] font-outfit font-bold text-[#5C3800]">
              Stai modificando il ciclo del {format(parseISO(selectedDate), 'd MMMM yyyy', { locale: it })}
            </span>
          </motion.div>
        )}
      </div>

      {/* ATTIVITÀ Section */}
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex items-center gap-2 px-1">
          <TrendingUp size={14} className="text-[var(--text-muted)]" />
          <h3 className="font-outfit font-bold text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
            ATTIVITÀ DEL GIORNO
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          <CounterField label="Contatti Reali" field="contatti_reali" formData={formData} onNumberInputChange={handleNumberInputChange} />
          <CounterField label="Notizie Reali" field="notizie_reali" formData={formData} onNumberInputChange={handleNumberInputChange} />
          <CounterField label="App. Vendita" field="appuntamenti_vendita" formData={formData} onNumberInputChange={handleNumberInputChange} />
          <CounterField label="Incarichi Vendita" field="incarichi_vendita" formData={formData} onNumberInputChange={handleNumberInputChange} />
          <CounterField label="Valutazioni Fatte" field="valutazioni_fatte" formData={formData} onNumberInputChange={handleNumberInputChange} />
        </div>
      </div>

      {/* VENDITE & TRATTATIVE Section */}
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex items-center gap-2 px-1">
          <DollarSign size={14} className="text-[var(--text-muted)]" />
          <h3 className="font-outfit font-bold text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
            VENDITE & TRATTATIVE
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          <CounterField label="Vendite (Numero)" field="vendite_numero" formData={formData} onNumberInputChange={handleNumberInputChange} />
          <CurrencyField label="Valore Vendite" field="vendite_valore" formData={formData} onNumberInputChange={handleNumberInputChange} />
          <CounterField label="Nuove Trattative" field="nuove_trattative" formData={formData} onNumberInputChange={handleNumberInputChange} />
          <CounterField label="Trattative Chiuse" field="trattative_chiuse" formData={formData} onNumberInputChange={handleNumberInputChange} />
          <CurrencyField label="Fatturato a Credito" field="fatturato_a_credito" formData={formData} onNumberInputChange={handleNumberInputChange} />
        </div>
      </div>

      {/* NOTE Section */}
      <div className="flex flex-col gap-3">
        <label className="text-[11px] font-outfit font-bold text-[var(--text-muted)] uppercase tracking-[0.1em] px-1">
          NOTE E COMMENTI
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Aggiungi dettagli o commenti sulla giornata..."
          className="w-full bg-[var(--bg-subtle)] border border-[var(--border-light)] rounded-[16px] p-5 text-[14px] font-outfit text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--text-primary)]/10 min-h-[120px] resize-none shadow-sm hover:border-[var(--border-medium)] transition-all"
        />
      </div>

      {/* Submit */}
      <div className="pt-6 border-t border-[var(--border-light)]">
        <button
          type="submit"
          className="w-full bg-[var(--text-primary)] text-white h-14 rounded-full font-outfit font-bold text-[14px] uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-lg shadow-[var(--text-primary)]/10 flex items-center justify-center gap-3 active:scale-[0.98]"
        >
          <Save size={20} />
          SALVA CICLO
        </button>
      </div>
    </form>
  );
};
