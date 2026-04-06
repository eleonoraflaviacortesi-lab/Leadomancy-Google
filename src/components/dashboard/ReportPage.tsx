import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, List, Edit2, FileText, TrendingUp, DollarSign, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { ReportForm } from "./ReportForm";
import { useDailyData } from "@/src/hooks/useDailyData";
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, isWithinInterval } from "date-fns";
import { it } from "date-fns/locale";
import { cn, formatCurrency } from "@/src/lib/utils";
import { CicloProduttivo } from "@/src/types";

type Tab = 'new' | 'history';
type Period = 'week' | 'month' | 'quarter' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  week: 'Settimana',
  month: 'Mese',
  quarter: 'Trimestre',
  all: 'Tutti',
};

function getPeriodInterval(period: Period): { start: Date; end: Date } | null {
  const now = new Date();
  if (period === 'week') return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
  if (period === 'month') return { start: startOfMonth(now), end: endOfMonth(now) };
  if (period === 'quarter') return { start: startOfQuarter(now), end: endOfQuarter(now) };
  return null;
}

function sumReports(reports: CicloProduttivo[]) {
  return reports.reduce((acc, r) => ({
    contatti_reali: acc.contatti_reali + (Number(r.contatti_reali) || 0),
    notizie_reali: acc.notizie_reali + (Number(r.notizie_reali) || 0),
    appuntamenti_vendita: acc.appuntamenti_vendita + (Number(r.appuntamenti_vendita) || 0),
    acquisizioni: acc.acquisizioni + (Number(r.acquisizioni) || 0),
    incarichi_vendita: acc.incarichi_vendita + (Number(r.incarichi_vendita) || 0),
    valutazioni_fatte: acc.valutazioni_fatte + (Number(r.valutazioni_fatte) || 0),
    vendite_numero: acc.vendite_numero + (Number(r.vendite_numero) || 0),
    vendite_valore: acc.vendite_valore + (Number(r.vendite_valore) || 0),
    nuove_trattative: acc.nuove_trattative + (Number(r.nuove_trattative) || 0),
    trattative_chiuse: acc.trattative_chiuse + (Number(r.trattative_chiuse) || 0),
    fatturato_a_credito: acc.fatturato_a_credito + (Number(r.fatturato_a_credito) || 0),
  }), {
    contatti_reali: 0, notizie_reali: 0, appuntamenti_vendita: 0,
    acquisizioni: 0, incarichi_vendita: 0, valutazioni_fatte: 0,
    vendite_numero: 0, vendite_valore: 0, nuove_trattative: 0,
    trattative_chiuse: 0, fatturato_a_credito: 0,
  });
}

const SummaryCard: React.FC<{ label: string; value: number | string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className={cn(
    "flex flex-col gap-1 p-3 rounded-[12px] border",
    highlight
      ? "bg-[#1A1A18] border-transparent"
      : "bg-white border-[var(--border-light)]"
  )}>
    <span className={cn("text-[9px] font-outfit font-bold uppercase tracking-[0.1em]", highlight ? "text-white/60" : "text-[var(--text-muted)]")}>
      {label}
    </span>
    <span className={cn("text-[18px] font-outfit font-bold", highlight ? "text-white" : "text-[var(--text-primary)]")}>
      {value}
    </span>
  </div>
);

const PeriodSummary: React.FC<{ reports: CicloProduttivo[]; period: Period }> = ({ reports, period }) => {
  const [open, setOpen] = useState(true);
  if (reports.length === 0 || period === 'all') return null;
  const totals = sumReports(reports);

  return (
    <div className="bg-[var(--bg-subtle)] border border-[var(--border-light)] rounded-[16px] overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-black/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BarChart3 size={15} className="text-[var(--text-muted)]" />
          <span className="font-outfit font-bold text-[12px] uppercase tracking-[0.1em] text-[var(--text-primary)]">
            Totale {PERIOD_LABELS[period]} — {reports.length} {reports.length === 1 ? 'ciclo' : 'cicli'}
          </span>
        </div>
        {open ? <ChevronUp size={16} className="text-[var(--text-muted)]" /> : <ChevronDown size={16} className="text-[var(--text-muted)]" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              <SummaryCard label="Contatti" value={totals.contatti_reali} />
              <SummaryCard label="Notizie" value={totals.notizie_reali} />
              <SummaryCard label="App. Vendita" value={totals.appuntamenti_vendita} />
              <SummaryCard label="Incarichi" value={totals.incarichi_vendita} />
              <SummaryCard label="Acquisizioni" value={totals.acquisizioni} />
              <SummaryCard label="Valutazioni" value={totals.valutazioni_fatte} />
              <SummaryCard label="Vendite" value={totals.vendite_numero} />
              <SummaryCard label="Nuove Trattative" value={totals.nuove_trattative} />
              <SummaryCard label="Trattative Chiuse" value={totals.trattative_chiuse} />
              <SummaryCard label="Valore Vendite" value={formatCurrency(totals.vendite_valore)} highlight={totals.vendite_valore > 0} />
              <SummaryCard label="Fatt. a Credito" value={formatCurrency(totals.fatturato_a_credito)} highlight={totals.fatturato_a_credito > 0} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ReportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('new');
  const [period, setPeriod] = useState<Period>('month');
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const { myData, isLoading } = useDailyData();

  const filteredReports = useMemo(() => {
    const interval = getPeriodInterval(period);
    if (!interval) return myData;
    return myData.filter(r => {
      try {
        return isWithinInterval(parseISO(r.date), interval);
      } catch { return false; }
    });
  }, [myData, period]);

  const handleEditClick = (date: string) => {
    setEditingDate(date);
    setActiveTab('new');
  };

  return (
    <div className="flex flex-col gap-4 pb-6 w-full">
      {/* Header */}
      <div className="flex flex-col px-4 sm:px-0">
        <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest mb-1 mt-6">
          ALTAIR / Produzione
        </p>
        <h1 className="text-[24px] sm:text-[28px] font-semibold tracking-tight text-[var(--text-primary)] mb-0">
          Ciclo Produttivo
        </h1>
      </div>

      {/* Tab Switcher */}
      <div className="bg-[var(--bg-subtle)] p-1 rounded-full border border-[var(--border-light)] flex max-w-md mx-4 sm:mx-0">
        <button
          onClick={() => setActiveTab('new')}
          className={cn(
            "flex-1 py-2.5 rounded-full font-outfit text-[11px] sm:text-[12px] font-bold uppercase transition-all flex items-center justify-center gap-2",
            activeTab === 'new' ? "bg-white text-black shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          )}
        >
          <Plus size={16} />
          Nuovo Ciclo
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex-1 py-2.5 rounded-full font-outfit text-[11px] sm:text-[12px] font-bold uppercase transition-all flex items-center justify-center gap-2",
            activeTab === 'history' ? "bg-white text-black shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          )}
        >
          <List size={16} />
          I Miei Cicli
        </button>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-0">
        <AnimatePresence mode="wait">
          {activeTab === 'new' ? (
            <motion.div
              key="new-report"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white border border-[var(--border-light)] rounded-[20px] p-4 sm:p-8 shadow-sm"
            >
              <ReportForm initialDate={editingDate || undefined} />
            </motion.div>
          ) : (
            <motion.div
              key="history-reports"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4"
            >
              {/* Period filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-outfit text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Periodo:
                </span>
                <div className="flex bg-[var(--bg-subtle)] p-0.5 rounded-full border border-[var(--border-light)]">
                  {(['week', 'month', 'quarter', 'all'] as Period[]).map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={cn(
                        "px-4 py-1.5 rounded-full font-outfit text-[11px] font-bold uppercase tracking-wide transition-all",
                        period === p
                          ? "bg-[#1A1A18] text-white shadow-sm"
                          : "text-[var(--text-secondary)] hover:bg-black/5"
                      )}
                    >
                      {PERIOD_LABELS[p]}
                    </button>
                  ))}
                </div>
                <span className="font-outfit text-[11px] text-[var(--text-muted)] ml-auto">
                  {filteredReports.length} {filteredReports.length === 1 ? 'ciclo' : 'cicli'}
                </span>
              </div>

              {/* Period summary */}
              <PeriodSummary reports={filteredReports} period={period} />

              {/* Report list */}
              {isLoading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-[var(--bg-subtle)] animate-pulse rounded-[14px]" />
                  ))}
                </div>
              ) : filteredReports.length > 0 ? (
                filteredReports.map(report => (
                  <div
                    key={report.id}
                    className="bg-white border border-[var(--border-light)] rounded-[14px] p-4 sm:p-5 flex items-center justify-between shadow-sm hover:border-[var(--border-medium)] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-[var(--bg-subtle)] flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-outfit font-bold uppercase text-[var(--text-muted)] leading-none">
                          {format(parseISO(report.date), 'MMM', { locale: it })}
                        </span>
                        <span className="text-[15px] font-outfit font-bold text-[var(--text-primary)] leading-tight">
                          {format(parseISO(report.date), 'd')}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-[13px] font-outfit font-semibold text-[var(--text-primary)]">
                          {format(parseISO(report.date), 'EEEE d MMMM yyyy', { locale: it })}
                        </span>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1">
                            <TrendingUp size={11} className="text-[var(--text-muted)]" />
                            <span className="text-[11px] font-outfit text-[var(--text-muted)]">
                              {report.contatti_reali || 0} Contatti
                            </span>
                          </div>
                          <span className="text-[var(--border-light)]">·</span>
                          <span className="text-[11px] font-outfit text-[var(--text-muted)]">
                            {report.notizie_reali || 0} Notizie
                          </span>
                          <span className="text-[var(--border-light)]">·</span>
                          <span className="text-[11px] font-outfit text-[var(--text-muted)]">
                            {report.appuntamenti_vendita || 0} App.
                          </span>
                          {(report.vendite_numero || 0) > 0 && (
                            <>
                              <span className="text-[var(--border-light)]">·</span>
                              <div className="flex items-center gap-1">
                                <DollarSign size={11} className="text-green-600" />
                                <span className="text-[11px] font-outfit font-bold text-green-600">
                                  {report.vendite_numero} vendite ({formatCurrency(report.vendite_valore || 0)})
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleEditClick(report.date)}
                      className="p-2.5 rounded-full hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all flex-shrink-0"
                      title="Modifica"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-[var(--bg-subtle)] rounded-[20px] border border-dashed border-[var(--border-light)]">
                  <FileText size={40} className="text-[var(--border-medium)] mb-3" />
                  <p className="font-outfit text-[13px] text-[var(--text-muted)]">
                    Nessun ciclo in questo periodo
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
