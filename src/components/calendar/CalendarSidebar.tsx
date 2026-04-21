import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Menu, Palette } from 'lucide-react';
import { GoogleCalendar } from '@/src/hooks/useGoogleCalendar';
import { useCategoryColors, CategoryType } from '@/src/hooks/useCategoryColors';
import { useFavoriteColors } from '@/src/hooks/useFavoriteColors';
import { cn } from '@/src/lib/utils';

interface CalendarSidebarProps {
  calendars: GoogleCalendar[];
  visibleCalendarIds: string[];
  visibleLocalTypes: string[];
  onToggle: (id: string) => void;
  onToggleLocal: (type: string) => void;
  onToggleAll: (show: boolean) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  calendars,
  visibleCalendarIds,
  visibleLocalTypes,
  onToggle,
  onToggleLocal,
  onToggleAll,
  isCollapsed,
  onToggleCollapse
}) => {
  const { colors, updateCategoryColor } = useCategoryColors();
  const { favorites } = useFavoriteColors();
  const [editingCategory, setEditingCategory] = useState<CategoryType | null>(null);
  const allVisible = calendars.length > 0 && visibleCalendarIds.length === calendars.length;

  const localTypes = [
    { id: 'appointment' as CategoryType, label: 'Appuntamenti', sub: 'ALTAIR', color: colors.appointment },
    { id: 'task' as CategoryType, label: 'Task', sub: 'Le mie attività', color: colors.task },
    { id: 'cliente_reminder' as CategoryType, label: 'Promemoria Buyer', sub: 'Scadenze clienti', color: colors.cliente_reminder },
    { id: 'notizia_reminder' as CategoryType, label: 'Promemoria Notizie', sub: 'Scadenze immobili', color: colors.notizia_reminder },
  ];

  const PRESET_COLORS = [
    '#1A1A18', '#6DC88A', '#EDE8FD', '#FEF5D0',
    '#FCD34D', '#6EE7B7', '#93C5FD', '#C4B5FD',
    '#F9A8D4', '#FCA5A5', '#86EFAC', '#67E8F9'
  ];

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
                {/* Local Calendars */}
                <div className="flex flex-col gap-1">
                  {localTypes.map((type) => {
                    const isVisible = visibleLocalTypes.includes(type.id);
                    return (
                      <div key={type.id} className="relative group/item">
                        <div
                          onClick={() => onToggleLocal(type.id)}
                          className={cn(
                            "flex items-center gap-3 w-full p-2.5 rounded-full transition-all text-left group cursor-pointer",
                            isVisible ? "bg-white shadow-sm" : "hover:bg-black/[0.03] opacity-60"
                          )}
                        >
                          <div
                            className={cn(
                              "w-5 h-5 rounded-lg flex items-center justify-center transition-all",
                              isVisible ? "" : "bg-black/[0.05]"
                            )}
                            style={{ 
                              backgroundColor: isVisible ? type.color : undefined,
                              border: isVisible && (type.id === 'cliente_reminder' || type.id === 'notizia_reminder') ? '1px solid rgba(0,0,0,0.1)' : 'none'
                            }}
                          >
                            {isVisible && <Check size={12} className={cn(type.id === 'cliente_reminder' || type.id === 'notizia_reminder' ? "text-black/60" : "text-white")} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-[13px] font-outfit font-bold truncate transition-colors",
                              isVisible ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                            )}>
                              {type.label}
                            </p>
                            <p className="text-[9px] font-outfit text-[var(--text-muted)] uppercase tracking-wider">
                              {type.sub}
                            </p>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCategory(editingCategory === type.id ? null : type.id);
                            }}
                            className="opacity-0 group-hover/item:opacity-100 p-1.5 hover:bg-[var(--bg-subtle)] rounded-full transition-all"
                          >
                            <Menu size={14} className="text-[var(--text-muted)]" />
                          </button>
                        </div>

                        <AnimatePresence>
                          {editingCategory === type.id && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-xl border border-[var(--border-light)] p-4"
                            >
                              <div className="flex items-center gap-2 mb-3">
                                <Palette size={12} className="text-[var(--text-muted)]" />
                                <span className="text-[10px] font-outfit font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                  Colore Predefinito
                                </span>
                              </div>
                              <div className="grid grid-cols-6 gap-2">
                                {PRESET_COLORS.map(color => (
                                  <button
                                    key={color}
                                    onClick={() => {
                                      updateCategoryColor(type.id, color);
                                      setEditingCategory(null);
                                    }}
                                    className="w-6 h-6 rounded-full border border-black/5 transition-transform hover:scale-110"
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                                {favorites.map(color => (
                                  <button
                                    key={color}
                                    onClick={() => {
                                      updateCategoryColor(type.id, color);
                                      setEditingCategory(null);
                                    }}
                                    className="w-6 h-6 rounded-full border border-black/5 transition-transform hover:scale-110"
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
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
                            "flex items-center gap-3 w-full p-2.5 rounded-full transition-all text-left group",
                            isVisible ? "bg-white" : "hover:bg-black/[0.03] opacity-60"
                          )}
                        >
                          <div
                            className={cn(
                              "w-5 h-5 rounded-lg flex items-center justify-center transition-all",
                              isVisible ? "" : "bg-black/[0.05]"
                            )}
                            style={{ backgroundColor: isVisible ? calendar.backgroundColor : undefined }}
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
          "absolute top-1/2 -translate-y-1/2 w-6 h-12 flex items-center justify-center transition-all z-20",
          isCollapsed ? "left-2 rotate-180" : "right-0 translate-x-1/2"
        )}
      >
        <ChevronLeft size={20} className="text-[var(--text-muted)]" />
      </button>
    </div>
  );
};
