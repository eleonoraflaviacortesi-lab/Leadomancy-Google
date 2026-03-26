import React from "react";
import { Cliente } from "@/src/types";
import { CLIENTE_STATUS_CONFIG } from "./clienteFormOptions";
import { cn, formatCurrency } from "@/src/lib/utils";

interface ClientiSheetViewProps {
  clienti: Cliente[];
  onRowClick: (cliente: Cliente) => void;
}

export const ClientiSheetView: React.FC<ClientiSheetViewProps> = ({ clienti, onRowClick }) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[var(--border-light)] bg-white">
      <table className="min-w-[1000px] w-full border-collapse text-left">
        <thead>
          <tr className="bg-[var(--bg-page)] sticky top-0 z-10">
            <th className="h-9 px-3 border-bottom-2 border-[var(--border-medium)] font-outfit font-medium text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Nome</th>
            <th className="h-9 px-3 border-bottom-2 border-[var(--border-medium)] font-outfit font-medium text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Cognome</th>
            <th className="h-9 px-3 border-bottom-2 border-[var(--border-medium)] font-outfit font-medium text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Paese</th>
            <th className="h-9 px-3 border-bottom-2 border-[var(--border-medium)] font-outfit font-medium text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Budget</th>
            <th className="h-9 px-3 border-bottom-2 border-[var(--border-medium)] font-outfit font-medium text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Status</th>
            <th className="h-9 px-3 border-bottom-2 border-[var(--border-medium)] font-outfit font-medium text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Regioni</th>
            <th className="h-9 px-3 border-bottom-2 border-[var(--border-medium)] font-outfit font-medium text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Tipologia</th>
            <th className="h-9 px-3 border-bottom-2 border-[var(--border-medium)] font-outfit font-medium text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Portale</th>
            <th className="h-9 px-3 border-bottom-2 border-[var(--border-medium)] font-outfit font-medium text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Agente</th>
            <th className="h-9 px-3 border-bottom-2 border-[var(--border-medium)] font-outfit font-medium text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Reminder</th>
            <th className="h-9 px-3 border-bottom-2 border-[var(--border-medium)] font-outfit font-medium text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Data</th>
          </tr>
        </thead>
        <tbody>
          {clienti.map((cliente, index) => {
            const statusConfig = CLIENTE_STATUS_CONFIG[cliente.status] || CLIENTE_STATUS_CONFIG.new;
            return (
              <tr
                key={cliente.id}
                onClick={() => onRowClick(cliente)}
                className={cn(
                  "h-11 cursor-pointer border-b border-[var(--border-light)] transition-colors duration-100",
                  index % 2 === 0 ? "bg-white" : "bg-[var(--bg-subtle)]",
                  "hover:bg-[#FDFBC0]"
                )}
              >
                <td className="px-3 font-outfit font-medium text-[13px] text-[var(--text-primary)]">{cliente.nome}</td>
                <td className="px-3 font-outfit font-medium text-[13px] text-[var(--text-primary)]">{cliente.cognome}</td>
                <td className="px-3 text-[12px] text-[var(--text-secondary)]">{cliente.paese}</td>
                <td className="px-3 font-outfit font-medium text-[12px]">{cliente.budget_max ? formatCurrency(cliente.budget_max) : '-'}</td>
                <td className="px-3">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full font-outfit font-medium text-[10px] uppercase tracking-wider"
                    style={{ backgroundColor: statusConfig.bg, color: statusConfig.fg }}
                  >
                    {statusConfig.label}
                  </span>
                </td>
                <td className="px-3 text-[11px] text-[var(--text-secondary)] truncate max-w-[150px]">
                  {cliente.regioni?.join(', ')}
                </td>
                <td className="px-3 text-[11px] text-[var(--text-secondary)] truncate max-w-[150px]">
                  {cliente.tipologia?.join(', ')}
                </td>
                <td className="px-3 text-[12px] text-[var(--text-secondary)]">{cliente.portale}</td>
                <td className="px-3 text-[12px] text-[var(--text-secondary)]">{cliente.assigned_to}</td>
                <td className="px-3 text-[11px] text-[var(--text-secondary)]">
                  {cliente.reminder_date ? new Date(cliente.reminder_date).toLocaleDateString('it-IT') : '-'}
                </td>
                <td className="px-3 text-[11px] text-[var(--text-secondary)]">
                  {new Date(cliente.created_at).toLocaleDateString('it-IT')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
