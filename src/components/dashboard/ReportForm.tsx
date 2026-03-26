import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Plus, Minus, Save, Calendar, AlertCircle } from "lucide-react";
import { useDailyData } from "@/src/hooks/useDailyData";
import { DailyReport } from "@/src/types";
import { cn, formatCurrency } from "@/src/lib/utils";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";

const CounterField = ({ label, field, formData, onCounterChange, onNumberInputChange }: { label: string; field: keyof DailyReport; formData: any; onCounterChange: any; onNumberInputChange: any }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[11px] font-outfit font-semibold text-[var(--text-muted)] uppercase tracking-wider">
      {label}
    </label>
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onCounterChange(field, -1)}
        className="w-7 h-7 rounded-full bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] flex items-center justify-center transition-colors border border-[var(--border-light)]"
      >
        <Minus size={14} className="text-[var(--text-primary)]" />
      </button>
      <input
        type="number"
        value={formData[field] as number}
        onChange={(e) => onNumberInputChange(field, e.target.value)}
        className="w-16 h-9 bg-[var(--bg-subtle)] border-0 rounded-[8px] text-center font-outfit font-medium text-[14px] outline-none focus:ring-1 focus:ring-black/10"
      />
      <button
        type="button"
        onClick={() => onCounterChange(field, 1)}
        className="w-7 h-7 rounded-full bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] flex items-center justify-center transition-colors border border-[var(--border-light)]"
      >
        <Plus size={14} className="text-[var(--text-primary)]" />
      </button>
    </div>
  </div>
);

const CurrencyField = ({ label, field, formData, onNumberInputChange }: { label: string; field: keyof DailyReport; formData: any; onNumberInputChange: any }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[11px] font-outfit font-semibold text-[var(--text-muted)] uppercase tracking-wider">
      {label}
    </label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] font-outfit text-[var(--text-muted)]">€</span>
      <input
        type="number"
        value={formData[field] as number}
        onChange={(e) => onNumberInputChange(field, e.target.value)}
        className="w-full h-9 bg-[var(--bg-subtle)] border-0 rounded-[8px] pl-7 pr-3 font-outfit font-medium text-[14px] outline-none focus:ring-1 focus:ring-black/10"
      />
    </div>
  </div>
);

export const ReportForm: React.FC = () => {
  const { myData, saveDailyData } = useDailyData();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const existingReport = myData.find(r => r.date === selectedDate);

  const [formData, setFormData] = useState<Partial<DailyReport>>({
    contatti_reali: 0,
    notizie_reali: 0,
    appuntamenti_vendita: 0,
    acquisizioni: 0,
    incarichi_vendita: 0,
    valutazioni_fatte: 0,
    vendite_numero: 0,
    vendite_valore: 0,
    nuove_trattative: 0,
    trattative_chiuse: 0,
    fatturato_a_credito: 0,
    notes: ''
  });

  useEffect(() => {
    if (existingReport) {
      setFormData({
        contatti_reali: existingReport.contatti_reali || 0,
        notizie_reali: existingReport.notizie_reali || 0,
        appuntamenti_vendita: existingReport.appuntamenti_vendita || 0,
        acquisizioni: existingReport.acquisizioni || 0,
        incarichi_vendita: existingReport.incarichi_vendita || 0,
        valutazioni_fatte: existingReport.valutazioni_fatte || 0,
        vendite_numero: existingReport.vendite_numero || 0,
        vendite_valore: existingReport.vendite_valore || 0,
        nuove_trattative: existingReport.nuove_trattative || 0,
        trattative_chiuse: existingReport.trattative_chiuse || 0,
        fatturato_a_credito: existingReport.fatturato_a_credito || 0,
        notes: existingReport.notes || ''
      });
    } else {
      setFormData({
        contatti_reali: 0,
        notizie_reali: 0,
        appuntamenti_vendita: 0,
        acquisizioni: 0,
        incarichi_vendita: 0,
        valutazioni_fatte: 0,
        vendite_numero: 0,
        vendite_valore: 0,
        nuove_trattative: 0,
        trattative_chiuse: 0,
        fatturato_a_credito: 0,
        notes: ''
      });
    }
  }, [existingReport, selectedDate]);

  const handleCounterChange = (field: keyof DailyReport, delta: number) => {
    const currentValue = Number(formData[field]) || 0;
    setFormData({ ...formData, [field]: Math.max(0, currentValue + delta) });
  };

  const handleInputChange = (field: keyof DailyReport, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleNumberInputChange = (field: keyof DailyReport, value: string) => {
    const num = parseFloat(value) || 0;
    setFormData({ ...formData, [field]: num });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveDailyData({ data: formData, date: selectedDate });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Date Selector */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-outfit font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
            <Calendar size={12} />
            Data del Report
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full sm:w-48 bg-white border border-[var(--border-light)] rounded-[10px] p-2.5 px-4 text-[13px] font-outfit font-medium outline-none focus:ring-1 focus:ring-black/10 shadow-sm"
          />
        </div>

        {existingReport && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#FEF5D0] border border-[#F5C842]/30 rounded-[12px] p-4 flex items-center gap-3"
          >
            <AlertCircle size={18} className="text-[#5C3800]" />
            <span className="text-[13px] font-outfit font-medium text-[#5C3800]">
              Stai modificando il report del {format(parseISO(selectedDate), 'd MMMM yyyy', { locale: it })}
            </span>
          </motion.div>
        )}
      </div>

      {/* ATTIVITÀ Section */}
      <div className="flex flex-col gap-6">
        <h3 className="font-outfit font-bold text-[12px] uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border-light)] pb-2">
          ATTIVITÀ
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <CounterField label="Contatti Reali" field="contatti_reali" formData={formData} onCounterChange={handleCounterChange} onNumberInputChange={handleNumberInputChange} />
          <CounterField label="Notizie Reali" field="notizie_reali" formData={formData} onCounterChange={handleCounterChange} onNumberInputChange={handleNumberInputChange} />
          <CounterField label="App. Vendita" field="appuntamenti_vendita" formData={formData} onCounterChange={handleCounterChange} onNumberInputChange={handleNumberInputChange} />
          <CounterField label="Incarichi Vendita" field="incarichi_vendita" formData={formData} onCounterChange={handleCounterChange} onNumberInputChange={handleNumberInputChange} />
          <CounterField label="Valutazioni Fatte" field="valutazioni_fatte" formData={formData} onCounterChange={handleCounterChange} onNumberInputChange={handleNumberInputChange} />
        </div>
      </div>

      {/* VENDITE & TRATTATIVE Section */}
      <div className="flex flex-col gap-6">
        <h3 className="font-outfit font-bold text-[12px] uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border-light)] pb-2">
          VENDITE & TRATTATIVE
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CounterField label="Vendite (Numero)" field="vendite_numero" formData={formData} onCounterChange={handleCounterChange} onNumberInputChange={handleNumberInputChange} />
          <CurrencyField label="Valore Vendite" field="vendite_valore" formData={formData} onNumberInputChange={handleNumberInputChange} />
          <CounterField label="Nuove Trattative" field="nuove_trattative" formData={formData} onCounterChange={handleCounterChange} onNumberInputChange={handleNumberInputChange} />
          <CounterField label="Trattative Chiuse" field="trattative_chiuse" formData={formData} onCounterChange={handleCounterChange} onNumberInputChange={handleNumberInputChange} />
          <CurrencyField label="Fatturato a Credito" field="fatturato_a_credito" formData={formData} onNumberInputChange={handleNumberInputChange} />
        </div>
      </div>

      {/* NOTE Section */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-outfit font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          NOTE
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Aggiungi dettagli o commenti sulla giornata..."
          className="w-full bg-[var(--bg-subtle)] border-0 rounded-[10px] p-4 text-[13px] font-outfit outline-none focus:ring-1 focus:ring-black/10 min-h-[100px] resize-none"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full bg-[#1A1A18] text-white h-12 rounded-full font-outfit font-bold text-[14px] uppercase tracking-[0.15em] hover:bg-black transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        <Save size={18} />
        SALVA REPORT
      </button>
    </form>
  );
};
