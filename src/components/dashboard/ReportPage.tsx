import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, List, Edit2, Calendar, FileText, TrendingUp, DollarSign } from "lucide-react";
import { ReportForm } from "./ReportForm";
import { useDailyData } from "@/src/hooks/useDailyData";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { cn, formatCurrency } from "@/src/lib/utils";

type Tab = 'new' | 'history';

export const ReportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('new');
  const { myData, isLoading } = useDailyData();

  return (
    <div className="flex flex-col gap-8 p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <span className="font-outfit text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
          Leadomancy / Produzione
        </span>
        <h1 className="font-outfit font-semibold text-[28px] tracking-tight text-[var(--text-primary)]">
          Report di Produzione
        </h1>
      </div>

      {/* Tab Switcher */}
      <div className="bg-[var(--bg-subtle)] p-1 rounded-full border border-[var(--border-light)] flex max-w-md">
        <button
          onClick={() => setActiveTab('new')}
          className={cn(
            "flex-1 py-2.5 rounded-full font-outfit text-[12px] font-bold uppercase transition-all flex items-center justify-center gap-2",
            activeTab === 'new' ? "bg-white text-black shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          )}
        >
          <Plus size={16} />
          Nuovo Report
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex-1 py-2.5 rounded-full font-outfit text-[12px] font-bold uppercase transition-all flex items-center justify-center gap-2",
            activeTab === 'history' ? "bg-white text-black shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          )}
        >
          <List size={16} />
          I Miei Report
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'new' ? (
          <motion.div
            key="new-report"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-[var(--border-light)] rounded-[20px] p-8 shadow-sm"
          >
            <ReportForm />
          </motion.div>
        ) : (
          <motion.div
            key="history-reports"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4"
          >
            {isLoading ? (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-[var(--bg-subtle)] animate-pulse rounded-[14px]" />
                ))}
              </div>
            ) : myData.length > 0 ? (
              myData.map(report => (
                <div 
                  key={report.id}
                  className="bg-white border border-[var(--border-light)] rounded-[14px] p-5 flex items-center justify-between shadow-sm hover:border-[var(--border-medium)] transition-all group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-full bg-[var(--bg-subtle)] flex flex-col items-center justify-center">
                      <span className="text-[10px] font-outfit font-bold uppercase text-[var(--text-muted)] leading-none">
                        {format(parseISO(report.date), 'MMM', { locale: it })}
                      </span>
                      <span className="text-[16px] font-outfit font-bold text-[var(--text-primary)] leading-tight">
                        {format(parseISO(report.date), 'd')}
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <span className="text-[14px] font-outfit font-semibold text-[var(--text-primary)]">
                        {format(parseISO(report.date), 'EEEE d MMMM yyyy', { locale: it })}
                      </span>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp size={12} className="text-[var(--text-muted)]" />
                          <span className="text-[11px] font-outfit font-medium text-[var(--text-muted)]">
                            {report.contatti_reali} Contatti • {report.notizie_reali} Notizie
                          </span>
                        </div>
                        {report.vendite_numero > 0 && (
                          <div className="flex items-center gap-1.5">
                            <DollarSign size={12} className="text-[var(--sage-fg)]" />
                            <span className="text-[11px] font-outfit font-bold text-[var(--sage-fg)]">
                              {report.vendite_numero} Vendite ({formatCurrency(report.vendite_valore)})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('new')} // In a real app, we'd pass the date to ReportForm
                    className="p-3 rounded-full hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-[var(--bg-subtle)] rounded-[20px] border border-dashed border-[var(--border-light)]">
                <FileText size={48} className="text-[var(--border-medium)] mb-4" />
                <p className="font-outfit text-[14px] text-[var(--text-muted)]">Nessun report salvato</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
