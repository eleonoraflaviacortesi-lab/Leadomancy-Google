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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-white rounded-[16px] p-6 w-[min(90vw,500px)] max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col"
          >
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full transition-colors z-10"
            >
              <X size={24} />
            </button>

            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white">
                <TrendingDown size={20} />
              </div>
              <div>
                <h2 className="font-outfit font-semibold text-[20px] text-[var(--text-primary)]">Funnel di Acquisizione</h2>
                <p className="text-[12px] text-[var(--text-muted)] font-outfit uppercase tracking-wider">Conversione per stato</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
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
                    <div className="flex items-center justify-between mb-1.5 px-1">
                      <div className="flex items-center gap-2">
                        <span className="font-outfit font-bold text-[11px] uppercase tracking-tight text-[var(--text-primary)]">
                          {stage.label}
                        </span>
                        <span className="text-[10px] font-outfit font-medium text-[var(--text-muted)]">
                          {stage.count} notizie
                        </span>
                      </div>
                      <span className="text-[10px] font-outfit font-bold text-[var(--text-muted)]">
                        {stage.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="relative h-10 w-full bg-[var(--bg-subtle)] rounded-xl overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPercent}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
                        className="absolute inset-y-0 left-0 flex items-center justify-end pr-4"
                        style={{ backgroundColor: stage.color }}
                      >
                        {widthPercent > 15 && (
                          <span className="text-[10px] font-outfit font-bold text-black/60 uppercase">
                            {stage.label}
                          </span>
                        )}
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="p-6 bg-[var(--bg-subtle)] rounded-2xl text-center">
              <p className="text-[11px] font-outfit text-[var(--text-muted)] leading-relaxed">
                Il funnel mostra la distribuzione delle notizie attraverso le fasi del processo di acquisizione.<br />
                Il totale delle notizie gestite è <span className="font-bold text-[var(--text-primary)]">{notizie.length}</span>.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
