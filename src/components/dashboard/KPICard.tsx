import React from "react";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn, formatCurrency } from "@/src/lib/utils";

interface KPICardProps {
  label: string;
  value: number;
  delta: number;
  percent: number;
  isCurrency?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({ 
  label, 
  value, 
  delta, 
  percent, 
  isCurrency = false 
}) => {
  const getProgressColor = (p: number) => {
    if (p < 50) return "var(--rose-fg)";
    if (p < 80) return "var(--amber-fg)";
    return "var(--sage-fg)";
  };

  return (
    <div className="bg-white border border-[var(--border-light)] rounded-[14px] p-4 flex flex-col gap-2 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="font-outfit font-medium text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
          {label}
        </span>
        <div className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
          delta >= 0 
            ? "bg-[var(--sage-bg)] text-[var(--sage-fg)]" 
            : "bg-[var(--rose-bg)] text-[var(--rose-fg)]"
        )}>
          {delta >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {delta >= 0 ? '+' : ''}{delta}
        </div>
      </div>
      
      <div className="font-outfit font-semibold text-[24px] text-[var(--text-primary)] tracking-tight leading-none">
        {isCurrency ? formatCurrency(value) : value}
      </div>

      <div className="w-full h-[4px] bg-[var(--bg-subtle)] rounded-full overflow-hidden mt-1">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percent, 100)}%` }}
          className="h-full rounded-full"
          style={{ backgroundColor: getProgressColor(percent) }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};
