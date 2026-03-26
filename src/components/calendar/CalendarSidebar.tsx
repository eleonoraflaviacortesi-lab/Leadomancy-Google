import React from 'react';
import { motion } from 'motion/react';
import { Check, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { GoogleCalendar } from '@/src/hooks/useGoogleCalendar';
import { cn } from '@/src/lib/utils';

interface CalendarSidebarProps {
  calendars: GoogleCalendar[];
  visibleCalendarIds: string[];
  onToggle: (id: string) => void;
  onToggleAll: (show: boolean) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  calendars,
  visibleCalendarIds,
  onToggle,
  onToggleAll,
  isCollapsed,
  onToggleCollapse
}) => {
  const allVisible = calendars.length > 0 && visibleCalendarIds.length === calendars.length;

  return (
    <div className="relative h-full flex shrink-0 z-30">
      <motion.div
        initial={false}
        animate={{ width: isCollapsed ? 0 : 260 }}
        className={cn(
          "h-full border-r border-[var(--border-light)] bg-[var(--bg-subtle)] overflow-hidden transition-all",
          isCollapsed ? "border-r-0" : ""
        )}
      >
          <div className="w-[260px] p-8 flex flex-col gap-10">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2 className="font-outfit font-bold text-[12px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
                  I Miei Calendari
                </h2>
              </div>

              <div className="flex flex-col gap-2">
                {/* Local Calendar (Always present) */}
                <div className="flex items-center gap-3 w-full p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-black/5 text-left">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center bg-[#1A1A18]">
                    <Check size={12} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-outfit font-bold text-[var(--text-primary)] truncate">
                      Leadomancy
                    </p>
                    <p className="text-[10px] font-outfit text-[var(--text-muted)] uppercase tracking-wider">
                      Appuntamenti Locali
                    </p>
                  </div>
                </div>

                <div className="h-px bg-[var(--border-light)] my-2" />

                {calendars.length > 0 && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-outfit font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      Google Calendar
                    </span>
                    <button
                      onClick={() => onToggleAll(!allVisible)}
                      className="text-[10px] font-outfit font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-tight"
                    >
                      {allVisible ? 'Nascondi tutti' : 'Mostra tutti'}
                    </button>
                  </div>
                )}

                {calendars.length === 0 ? (
                  <div className="p-4 bg-amber-50/50 border border-amber-100/50 rounded-2xl text-center">
                    <p className="text-[11px] font-outfit text-amber-700 leading-relaxed">
                      Connetti il tuo account Google per visualizzare i tuoi calendari esterni qui.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {calendars.map((calendar) => {
                      const isVisible = visibleCalendarIds.includes(calendar.id);
                      return (
                        <button
                          key={calendar.id}
                          onClick={() => onToggle(calendar.id)}
                          className={cn(
                            "flex items-center gap-3 w-full p-2.5 rounded-xl transition-all text-left group",
                            isVisible ? "bg-white shadow-sm ring-1 ring-black/5" : "hover:bg-black/[0.03] opacity-60"
                          )}
                        >
                          <div
                            className={cn(
                              "w-5 h-5 rounded-md flex items-center justify-center transition-all border",
                              isVisible ? "border-transparent" : "border-[var(--border-light)] bg-white"
                            )}
                            style={{ backgroundColor: isVisible ? calendar.backgroundColor : 'transparent' }}
                          >
                            {isVisible && <Check size={12} style={{ color: calendar.foregroundColor }} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-[13px] font-outfit font-medium truncate transition-colors",
                              isVisible ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                            )}>
                              {calendar.summary}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
      </motion.div>

      {/* Collapse Toggle Button (Floating) */}
      <button
        onClick={onToggleCollapse}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 w-6 h-12 bg-white border border-[var(--border-light)] rounded-full flex items-center justify-center shadow-sm hover:bg-[var(--bg-subtle)] transition-all z-20",
          isCollapsed ? "left-2 rotate-180" : "right-0 translate-x-1/2"
        )}
      >
        <ChevronLeft size={14} className="text-[var(--text-muted)]" />
      </button>
    </div>
  );
};
