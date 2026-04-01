import React, { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, TrendingDown, Filter } from "lucide-react";
import { Notizia } from "@/src/types";
import { NOTIZIA_STATUSES, NOTIZIA_STATUS_LABELS, NOTIZIA_STATUS_COLORS } from "./notizieConfig";
import { cn } from "@/src/lib/utils";

interface FunnelChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  notizie: Notizia[];
}

export const FunnelChartModal: React.FC<FunnelChartModalProps> = ({ isOpen, onClose, notizie }) => {
  const funnelData = useMemo(() => {
    const total = notizie.length;
    if (total === 0) return [];

    return NOTIZIA_STATUSES.map(status => {
      const count = notizie.filter(n => n.status === status).length;
      return {
        key: status,
        label: NOTIZIA_STATUS_LABELS[status],
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
        color: NOTIZIA_STATUS_COLORS[status]
      };
    });
  }, [notizie]);

  const maxCount = Math.max(...funnelData.map(d => d.count), 1);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/25"
          />
          <motion.div
            initial={{ scale: 0.97, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[500px] bg-white rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 sm:p-8 border-b border-[var(--border-light)] shrink-0">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#1A1A18] flex items-center justify-center text-white shadow-lg shadow-black/10 shrink-0">
                  <TrendingDown size={20} className="sm:w-[22px] sm:h-[22px]" />
                </div>
                <div>
                  <h2 className="font-outfit font-bold text-[18px] sm:text-[20px] text-[var(--text-primary)] tracking-[-0.5px]">Funnel di Acquisizione</h2>
                  <p className="font-outfit font-bold text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">Conversione per stato</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] rounded-full transition-colors shrink-0"
              >
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto flex-1">
              <div className="flex flex-col gap-5 sm:gap-6">
                {funnelData.map((stage, index) => {
                  const widthPercent = Math.max((stage.count / maxCount) * 100, 5);
                  
                  return (
                    <motion.div 
                      key={stage.key}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="group"
                    >
                      <div className="flex items-center justify-between mb-2 px-1">
                        <div className="flex items-center gap-2">
                          <span className="font-outfit font-bold text-[10px] sm:text-[11px] uppercase tracking-[0.05em] text-[var(--text-primary)]">
                            {stage.label}
                          </span>
                          <span className="text-[9px] sm:text-[10px] font-outfit font-bold text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded-full">
                            {stage.count}
                          </span>
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-outfit font-bold text-[var(--text-muted)]">
                          {stage.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="relative h-9 sm:h-11 w-full bg-[var(--bg-subtle)] rounded-[12px] sm:rounded-[14px] overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${widthPercent}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
                          className="absolute inset-y-0 left-0 flex items-center justify-end pr-3 sm:pr-4 shadow-sm"
                          style={{ backgroundColor: stage.color }}
                        >
                          {widthPercent > 25 && (
                            <span className="text-[9px] sm:text-[10px] font-outfit font-bold text-black/40 uppercase tracking-wider truncate pl-2">
                              {stage.label}
                            </span>
                          )}
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 sm:p-8 border-t border-[var(--border-light)] bg-[var(--bg-subtle)] shrink-0">
              <div className="bg-white/50 rounded-[14px] sm:rounded-[16px] p-3 sm:p-4 border border-white/50">
                <p className="text-[11px] sm:text-[12px] font-outfit text-[var(--text-secondary)] leading-relaxed text-center">
                  Il funnel mostra la distribuzione delle notizie attraverso le fasi del processo di acquisizione.<br className="hidden sm:block" />
                  Il totale delle notizie gestite è <span className="font-bold text-[var(--text-primary)]">{notizie.length}</span>.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
