import React from "react";
import { motion } from "motion/react";
import { MoreHorizontal, Bell, Star } from "lucide-react";
import { Notizia } from "@/src/types";
import { NOTIZIA_STATUS_COLORS } from "./notizieConfig";
import { cn, formatCurrency } from "@/src/lib/utils";

interface NotiziaCardProps {
  notizia: Notizia;
  onClick: (notizia: Notizia) => void;
  isDragging?: boolean;
}

export const NotiziaCard: React.FC<NotiziaCardProps> = ({ notizia, onClick, isDragging }) => {
  const isOnShot = notizia.status === 'on_shot';
  const statusColor = NOTIZIA_STATUS_COLORS[notizia.status as keyof typeof NOTIZIA_STATUS_COLORS] || '#ccc';

  // Check if reminder is within 48h
  const hasUrgentReminder = React.useMemo(() => {
    if (!notizia.reminder_date) return false;
    const reminder = new Date(notizia.reminder_date);
    const now = new Date();
    const diff = reminder.getTime() - now.getTime();
    return diff > 0 && diff < 48 * 60 * 60 * 1000;
  }, [notizia.reminder_date]);

  return (
    <motion.div
      layout
      initial={false}
      animate={{
        rotate: isDragging ? 1 : 0,
        scale: isDragging ? 1.02 : 1,
        y: isDragging ? 0 : 0,
      }}
      whileHover={!isDragging && !isOnShot ? { y: -1, borderColor: 'var(--border-medium)' } : {}}
      onClick={() => onClick(notizia)}
      className={cn(
        "group relative flex flex-col gap-2 p-3 bg-white border border-[var(--border-light)] rounded-[10px] cursor-pointer transition-all duration-150 ease-in-out",
        isDragging && "shadow-[0_12px_40px_rgba(0,0,0,0.16)] z-50",
        !isDragging && "hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
        isOnShot ? "bg-[#F5E642] border-[#F5E642] text-[#5C5500]" : "border-l-[3px]"
      )}
      style={{
        borderLeftColor: !isOnShot ? statusColor : undefined
      }}
    >
      {/* Row 1: Emoji + Name + Menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 overflow-hidden">
          <span className="text-[16px] flex-shrink-0">{notizia.emoji || '🏠'}</span>
          <span className="font-outfit font-medium text-[13px] leading-tight line-clamp-2">
            {notizia.name}
          </span>
        </div>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 -mr-1 hover:bg-black/5 rounded">
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Row 2: Zona */}
      {notizia.zona && (
        <div className={cn(
          "text-[11px] truncate",
          isOnShot ? "text-[#5C5500]/70" : "text-[var(--text-secondary)]"
        )}>
          {notizia.zona}
        </div>
      )}

      {/* Row 3: Prezzo */}
      {notizia.prezzo_richiesto && (
        <div className="font-outfit font-medium text-[12px]">
          {formatCurrency(notizia.prezzo_richiesto)}
        </div>
      )}

      {/* Footer: Rating + Bell */}
      {(notizia.rating || hasUrgentReminder) && (
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-0.5">
            {notizia.rating && Array.from({ length: notizia.rating }).map((_, i) => (
              <Star key={i} size={10} fill="currentColor" className={isOnShot ? "text-[#5C5500]" : "text-amber-400"} />
            ))}
          </div>
          {hasUrgentReminder && (
            <Bell size={12} className={isOnShot ? "text-[#5C5500]" : "text-rose-500"} />
          )}
        </div>
      )}
    </motion.div>
  );
};
