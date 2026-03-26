import React from "react";
import { motion } from "motion/react";
import { MoreHorizontal, Bell } from "lucide-react";
import { Cliente } from "@/src/types";
import { CLIENTE_STATUS_CONFIG } from "./clienteFormOptions";
import { cn, formatCurrency } from "@/src/lib/utils";

interface ClienteCardProps {
  cliente: Cliente;
  onClick: (cliente: Cliente) => void;
  isDragging?: boolean;
}

export const ClienteCard: React.FC<ClienteCardProps> = ({ cliente, onClick, isDragging }) => {
  const statusConfig = CLIENTE_STATUS_CONFIG[cliente.status] || CLIENTE_STATUS_CONFIG.new;

  // Check if reminder is within 48h
  const hasUrgentReminder = React.useMemo(() => {
    if (!cliente.reminder_date) return false;
    const reminder = new Date(cliente.reminder_date);
    const now = new Date();
    const diff = reminder.getTime() - now.getTime();
    return diff > 0 && diff < 48 * 60 * 60 * 1000;
  }, [cliente.reminder_date]);

  const displayedRegioni = cliente.regioni?.slice(0, 2) || [];
  const remainingRegioniCount = (cliente.regioni?.length || 0) - 2;

  return (
    <motion.div
      layout
      initial={false}
      animate={{
        rotate: isDragging ? 1 : 0,
        scale: isDragging ? 1.02 : 1,
      }}
      whileHover={!isDragging ? { y: -1, borderColor: 'var(--border-medium)' } : {}}
      onClick={() => onClick(cliente)}
      className={cn(
        "group relative flex flex-col gap-2 p-3 bg-white border border-[var(--border-light)] rounded-[10px] cursor-pointer transition-all duration-150 ease-in-out border-l-[3px]",
        isDragging && "shadow-[0_12px_40px_rgba(0,0,0,0.16)] z-50",
        !isDragging && "hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
      )}
      style={{ borderLeftColor: statusConfig.color }}
    >
      {/* Header: Name + Menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col overflow-hidden">
          <span className="font-outfit font-medium text-[13px] leading-tight truncate">
            {cliente.nome} {cliente.cognome}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {cliente.paese && (
              <span className="text-[11px] text-[var(--text-secondary)] truncate">
                {cliente.paese}
              </span>
            )}
            {cliente.budget_max && (
              <span className="text-[11px] text-[var(--text-secondary)] font-medium">
                • {formatCurrency(cliente.budget_max)}
              </span>
            )}
          </div>
        </div>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 -mr-1 hover:bg-black/5 rounded">
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Regions */}
      {cliente.regioni && cliente.regioni.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {displayedRegioni.map((regione) => (
            <span
              key={regione}
              className="px-1.5 py-0.5 bg-[var(--bg-subtle)] text-[var(--text-secondary)] rounded-md text-[9px] font-outfit uppercase tracking-wider"
            >
              {regione}
            </span>
          ))}
          {remainingRegioniCount > 0 && (
            <span className="text-[9px] text-[var(--text-muted)] font-outfit self-center">
              +{remainingRegioniCount} more
            </span>
          )}
        </div>
      )}

      {/* Footer: Status + Bell */}
      <div className="flex items-center justify-between mt-1">
        <span
          className="px-2 py-0.5 rounded-full font-outfit font-medium text-[9px] uppercase tracking-wider"
          style={{ backgroundColor: statusConfig.bg, color: statusConfig.fg }}
        >
          {statusConfig.label}
        </span>
        {hasUrgentReminder && (
          <Bell size={12} className="text-rose-500" />
        )}
      </div>
    </motion.div>
  );
};
