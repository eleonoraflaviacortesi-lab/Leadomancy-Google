import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  User, 
  Bell, 
  CheckCircle2, 
  Circle,
  Calendar as CalendarIcon,
  AlertCircle,
  ExternalLink,
  X
} from "lucide-react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  subDays, 
  startOfDay, 
  endOfDay,
  isToday,
  differenceInMinutes,
  parseISO,
  setHours,
  setMinutes,
  addWeeks,
  subWeeks
} from "date-fns";
import { it } from "date-fns/locale";
import { useAppointments } from "@/src/hooks/useAppointments";
import { useClienti } from "@/src/hooks/useClienti";
import { useNotizie } from "@/src/hooks/useNotizie";
import { useSwipeGesture } from "@/src/hooks/useSwipeGesture";
import { useAuth } from "@/src/hooks/useAuth";
import { useGoogleCalendar } from "@/src/hooks/useGoogleCalendar";
import { useCategoryColors } from "@/src/hooks/useCategoryColors";
import { useEventOverrides } from "@/src/hooks/useEventOverrides";
import { Appointment, Cliente, Notizia } from "@/src/types";
import { AddAppointmentDialog } from "./AddAppointmentDialog";
import { CalendarSidebar } from "./CalendarSidebar";
import { EventDetailsDialog } from "./EventDetailsDialog";
import { CalendarContextMenu } from "./CalendarContextMenu";
import { useLongPress } from "@/src/hooks/useLongPress";
import { cn, formatCurrency, getContrastColor } from "@/src/lib/utils";
import { toast } from "sonner";

type ViewMode = 'day' | '3days' | 'week' | 'month';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'appointment' | 'cliente_reminder' | 'notizia_reminder' | 'task' | 'google_calendar';
  originalData: any;
  allDay?: boolean;
}

export const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('altair-calendar-view');
    if (saved) return saved as ViewMode;
    return window.innerWidth < 768 ? '3days' : 'week';
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<'visit' | 'meeting' | 'call' | 'other' | 'task'>('visit');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [initialStartTime, setInitialStartTime] = useState<string>('10:00');
  const [initialEndTime, setInitialEndTime] = useState<string>('11:00');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [isErrorDismissed, setIsErrorDismissed] = useState(() => {
    return localStorage.getItem('altair-calendar-error-dismissed') === 'true';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('altair-calendar-sidebar-collapsed');
    if (saved !== null) return JSON.parse(saved);
    return window.innerWidth < 1280; // Only collapse by default on smaller screens
  });
  const { user } = useAuth();
  const localVisibilityKey = useMemo(() => 
    user?.email ? `altair-visible-local-types-${user.email}` : 'altair-visible-local-types'
  , [user?.email]);

  const [visibleLocalTypes, setVisibleLocalTypes] = useState<string[]>(['appointment', 'task', 'cliente_reminder', 'notizia_reminder']);
  const isInitialLoadRef = useRef(true);
  const lastKeyRef = useRef<string | null>(null);
  const { colors } = useCategoryColors();
  const { overrides, updateEventOverride } = useEventOverrides();
  const { appointments, updateAppointment, toggleComplete } = useAppointments();
  const [showSchemaWarning, setShowSchemaWarning] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    event: CalendarEvent | null;
  } | null>(null);

  // Check for schema update
  useEffect(() => {
    if (appointments.length > 0 && appointments.every(a => !a.type)) {
      setShowSchemaWarning(true);
    }
  }, [appointments]);

  const { 
    calendars, 
    visibleCalendarIds, 
    events: googleEvents, 
    isLoading: isGoogleLoading,
    hasAttemptedFetch,
    toggleCalendar,
    toggleAll,
    error: googleError,
    updateEvent: updateGoogleEvent
  } = useGoogleCalendar();
  const { clienti, updateCliente } = useClienti();
  const { notizie, updateNotizia } = useNotizie();
  const { isAuthenticated } = useAuth();

  const calendarRef = useRef<HTMLDivElement>(null);

  // Sidebar persistence
  useEffect(() => {
    localStorage.setItem('altair-calendar-sidebar-collapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Local visibility persistence
  useEffect(() => {
    if (isInitialLoadRef.current || lastKeyRef.current !== localVisibilityKey) return;
    localStorage.setItem(localVisibilityKey, JSON.stringify(visibleLocalTypes));
  }, [visibleLocalTypes, localVisibilityKey]);

  // Update local visibility when user changes
  useEffect(() => {
    if (!user?.email) return;
    const saved = localStorage.getItem(localVisibilityKey);
    if (saved) {
      setVisibleLocalTypes(JSON.parse(saved));
    } else {
      setVisibleLocalTypes(['appointment', 'task', 'cliente_reminder', 'notizia_reminder']);
    }
    lastKeyRef.current = localVisibilityKey;
    isInitialLoadRef.current = false;
  }, [localVisibilityKey, user?.email]);

  // Event listeners for opening details
  useEffect(() => {
    const handleOpenCliente = (e: any) => {
      window.location.href = `/clienti/${e.detail.id}`;
    };
    const handleOpenNotizia = (e: any) => {
      window.location.href = `/notizie/${e.detail.id}`;
    };

    window.addEventListener('altair:open-cliente', handleOpenCliente as EventListener);
    window.addEventListener('altair:open-notizia', handleOpenNotizia as EventListener);

    return () => {
      window.removeEventListener('altair:open-cliente', handleOpenCliente as EventListener);
      window.removeEventListener('altair:open-notizia', handleOpenNotizia as EventListener);
    };
  }, []);

  // Error handling
  useEffect(() => {
    if (googleError && hasAttemptedFetch) {
      const status = googleError.status || googleError.result?.error?.code;
      if (status === 403 || status === 404) {
        setCalendarError("Abilita Google Calendar API su console.cloud.google.com");
      } else {
        setCalendarError(null);
      }
    } else if (hasAttemptedFetch && !googleError) {
      setCalendarError(null);
      // If it was dismissed but now it's fixed, we could reset dismissal for future real errors
      // but let's keep it simple: if no error, no banner.
    }
  }, [googleError, hasAttemptedFetch]);

  const handleDismissError = () => {
    setIsErrorDismissed(true);
    localStorage.setItem('altair-calendar-error-dismissed', 'true');
  };

  // View Mode persistence
  useEffect(() => {
    localStorage.setItem('altair-calendar-view', viewMode);
  }, [viewMode]);

  // Combine all events
  const allEvents = useMemo(() => {
    const events: CalendarEvent[] = [];
    const googleEventIdsInLocal = new Set(
      appointments
        .filter(a => a.google_event_id)
        .map(a => a.google_event_id)
    );

    // Appointments
    appointments.forEach(app => {
      const isTask = app.type === 'task';
      const type = isTask ? 'task' : 'appointment';
      if (!visibleLocalTypes.includes(type)) return;

      const calendar = calendars.find(c => c.id === app.calendar_id);
      const override = overrides[app.id];
      events.push({
        id: app.id,
        title: app.title,
        start: app.start_time && !isNaN(parseISO(app.start_time).getTime()) ? parseISO(app.start_time) : new Date(),
        end: app.end_time && !isNaN(parseISO(app.end_time).getTime()) ? parseISO(app.end_time) : new Date(),
        type: isTask ? 'task' : 'appointment',
        allDay: false,
        originalData: {
          ...app,
          card_color: override?.card_color !== undefined ? override.card_color : app.card_color,
          calendarColor: calendar?.backgroundColor || '#1A1A18',
          calendarSummary: calendar?.summary || 'ALTAIR'
        }
      });
    });

    // Google Calendar Events (deduplicated)
    googleEvents.forEach(gEvent => {
      if (!googleEventIdsInLocal.has(gEvent.id)) {
        const start = gEvent.start.dateTime ? parseISO(gEvent.start.dateTime) : parseISO(gEvent.start.date);
        const end = gEvent.end.dateTime ? parseISO(gEvent.end.dateTime) : parseISO(gEvent.end.date);
        const override = overrides[gEvent.id];
        
        events.push({
          id: gEvent.id,
          title: gEvent.summary || '(Nessun titolo)',
          start,
          end,
          type: 'google_calendar',
          allDay: !gEvent.start.dateTime,
          originalData: {
            ...gEvent,
            card_color: override?.card_color || null,
            calendarId: gEvent.organizer?.email || 'primary'
          }
        });
      }
    });

    // Cliente Reminders
    clienti.forEach(c => {
      if (c.reminder_date && visibleLocalTypes.includes('cliente_reminder')) {
        const date = parseISO(c.reminder_date);
        const override = overrides[`c-${c.id}`];
        events.push({
          id: `c-${c.id}`,
          title: `Reminder: ${c.nome} ${c.cognome}`,
          start: startOfDay(date),
          end: endOfDay(date),
          type: 'cliente_reminder',
          allDay: true,
          originalData: {
            ...c,
            card_color: override?.card_color !== undefined ? override.card_color : c.card_color
          }
        });
      }
    });

    // Notizia Reminders
    notizie.forEach(n => {
      if (n.reminder_date && visibleLocalTypes.includes('notizia_reminder')) {
        const date = parseISO(n.reminder_date);
        const override = overrides[`n-${n.id}`];
        events.push({
          id: `n-${n.id}`,
          title: `Reminder: ${n.nome || n.name}`,
          start: startOfDay(date),
          end: endOfDay(date),
          type: 'notizia_reminder',
          allDay: true,
          originalData: {
            ...n,
            card_color: override?.card_color !== undefined ? override.card_color : n.card_color
          }
        });
      }
    });

    return events;
  }, [appointments, googleEvents, clienti, notizie, overrides]);

  // Sync selectedEvent with the latest allEvents after every refetch
  useEffect(() => {
    if (selectedEvent && isDetailsOpen) {
      const updated = allEvents.find(e => e.id === selectedEvent.id);
      if (updated) setSelectedEvent(updated);
    }
  }, [allEvents, isDetailsOpen]);

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else if (viewMode === '3days') setCurrentDate(subDays(currentDate, 3));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else if (viewMode === '3days') setCurrentDate(addDays(currentDate, 3));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

  // Swipe support
  useSwipeGesture(calendarRef, handleNext, handlePrev);

  const handleEventDrop = async (eventId: string, newStart: Date, newEnd: Date) => {
    const event = allEvents.find(e => e.id === eventId);
    if (!event) return;

    if (event.type === 'google_calendar') {
      try {
        const calendarId = event.originalData.calendarId || 'primary';
        await updateGoogleEvent(calendarId, eventId, { start: newStart, end: newEnd });
        toast.success("Evento Google aggiornato");
      } catch (error) {
        toast.error("Errore durante l'aggiornamento dell'evento Google");
      }
      return;
    }

    if (event.type !== 'appointment' && event.type !== 'task') {
      return;
    }

    try {
      await updateAppointment({
        id: eventId,
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
        date: format(newStart, 'yyyy-MM-dd'),
        time: format(newStart, 'HH:mm')
      });
      toast.success("Evento spostato con successo");
    } catch (error) {
      toast.error("Errore durante lo spostamento");
    }
  };

  const handleContextMenu = (e: React.MouseEvent | React.TouchEvent, event: CalendarEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    let clientX, clientY;
    if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    setContextMenu({
      x: clientX,
      y: clientY,
      event
    });
  };

  const handleColorSelect = (color: string | null) => {
    if (contextMenu?.event) {
      const event = contextMenu.event;
      
      // Always update local override for persistence
      updateEventOverride(event.id, { card_color: color });

      if (event.type === 'appointment' || event.type === 'task') {
        updateAppointment({
          id: event.id,
          card_color: color
        });
      } else if (event.type === 'cliente_reminder') {
        const clienteId = event.id.replace('c-', '');
        updateCliente({
          id: clienteId,
          card_color: color || undefined
        });
      } else if (event.type === 'notizia_reminder') {
        const notiziaId = event.id.replace('n-', '');
        updateNotizia({
          id: notiziaId,
          card_color: color || undefined
        });
      }
      
      toast.success("Colore aggiornato con successo");
    }
  };

  const handleTimeRangeSelect = (date: Date, startTime: string, endTime: string) => {
    setSelectedDate(date);
    setInitialStartTime(startTime);
    setInitialEndTime(endTime);
    setDefaultType('visit');
    setIsAddDialogOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-col">
            <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-[0.1em] mb-1 mt-8">
              ALTAIR / Attività
            </p>
            <h1 className="text-[28px] font-semibold tracking-tight text-[var(--text-primary)] mb-0 capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: it })}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {isGoogleLoading && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100 animate-pulse">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                <span className="text-[10px] font-outfit font-bold uppercase tracking-wider hidden sm:inline">Sincronizzazione...</span>
              </div>
            )}
            <div className="flex items-center bg-[var(--bg-subtle)] rounded-full p-1 border border-[var(--border-light)]">
              <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className={cn(
                  "p-1.5 rounded-full transition-all flex items-center gap-2 px-2 sm:px-3",
                  !isSidebarCollapsed ? "bg-[#1A1A18] text-white shadow-sm" : "hover:bg-black/5 text-[var(--text-secondary)]"
                )}
                title={isSidebarCollapsed ? "Mostra Calendari" : "Nascondi Calendari"}
              >
                <CalendarIcon size={16} />
                <span className="text-[12px] font-outfit font-bold uppercase tracking-tight hidden sm:inline">Calendari</span>
              </button>
              <div className="w-px h-4 bg-[var(--border-light)] mx-1" />
              <button onClick={handlePrev} className="p-1.5 hover:bg-black/5 rounded-full transition-colors">
                <ChevronLeft size={18} />
              </button>
              <button onClick={handleToday} className="px-2 sm:px-3 py-1 text-[12px] font-outfit font-medium hover:bg-black/5 rounded-full transition-colors">
                Oggi
              </button>
              <button onClick={handleNext} className="p-1.5 hover:bg-black/5 rounded-full transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="flex bg-[var(--bg-subtle)] p-1 rounded-full border border-[var(--border-light)] overflow-x-auto hide-scrollbar">
              {(['day', '3days', 'week', 'month'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "px-3 py-1 rounded-full font-outfit text-[12px] transition-all uppercase whitespace-nowrap",
                    viewMode === mode ? "bg-[#1A1A18] text-white" : "text-[var(--text-secondary)] hover:bg-black/5"
                  )}
                >
                  {mode === 'day' ? 'G' : mode === '3days' ? '3G' : mode === 'week' ? 'S' : 'M'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto md:ml-0">
              <button
                onClick={() => {
                  setDefaultType('task');
                  setIsAddDialogOpen(true);
                }}
                className="flex items-center justify-center w-[38px] h-[38px] sm:w-auto sm:h-auto sm:px-5 sm:py-2 bg-[var(--bg-subtle)] text-[var(--text-primary)] rounded-full font-outfit font-medium text-[13px] hover:bg-black/5 transition-all border border-[var(--border-light)]"
                title="Nuovo Task"
              >
                <CheckCircle2 size={16} className="sm:mr-2" />
                <span className="hidden sm:inline">Task</span>
              </button>

              <button
                onClick={() => {
                  setDefaultType('visit');
                  setIsAddDialogOpen(true);
                }}
                className="flex items-center justify-center w-[38px] h-[38px] sm:w-auto sm:h-auto sm:px-5 sm:py-2 bg-[#1A1A18] text-white rounded-full font-outfit font-medium text-[13px] hover:bg-black transition-all"
                title="Nuovo Appuntamento"
              >
                <Plus size={16} className="sm:mr-2" />
                <span className="hidden sm:inline">Appuntamento</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <CalendarSidebar 
          calendars={calendars}
          visibleCalendarIds={visibleCalendarIds}
          visibleLocalTypes={visibleLocalTypes}
          onToggle={toggleCalendar}
          onToggleLocal={(type) => setVisibleLocalTypes(prev => 
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
          )}
          onToggleAll={toggleAll}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Calendar Area */}
        <div ref={calendarRef} className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${viewMode}-${currentDate.toISOString()}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {viewMode === 'month' ? (
                <MonthView 
                  currentDate={currentDate} 
                  events={allEvents} 
                  colors={colors}
                  onDayClick={(date) => {
                    setCurrentDate(date);
                    setViewMode('day');
                  }}
                  onEventClick={handleEventClick}
                  onContextMenu={handleContextMenu}
                  toggleComplete={toggleComplete}
                />
              ) : (
                <TimeGridView 
                  currentDate={currentDate} 
                  events={allEvents} 
                  viewMode={viewMode}
                  colors={colors}
                  onEventClick={handleEventClick}
                  onContextMenu={handleContextMenu}
                  onTimeRangeSelect={handleTimeRangeSelect}
                  onEventDrop={handleEventDrop}
                  toggleComplete={toggleComplete}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AddAppointmentDialog 
        isOpen={isAddDialogOpen} 
        onClose={() => {
          setIsAddDialogOpen(false);
          setDefaultType('visit');
        }} 
        initialDate={selectedDate || currentDate}
        initialStartTime={initialStartTime}
        initialEndTime={initialEndTime}
        calendars={calendars}
        defaultType={defaultType}
      />

      <EventDetailsDialog
        event={selectedEvent}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        calendars={calendars}
      />

      <CalendarContextMenu
        x={contextMenu?.x || 0}
        y={contextMenu?.y || 0}
        isOpen={!!contextMenu}
        onClose={() => setContextMenu(null)}
        onColorSelect={handleColorSelect}
      />
    </div>
  );
};

// --- Month View Component ---
const MonthEventItem: React.FC<{
  event: CalendarEvent;
  colors: any;
  onEventClick: (event: CalendarEvent) => void;
  onContextMenu: (e: React.MouseEvent | React.TouchEvent, event: CalendarEvent) => void;
}> = ({ event, colors, onEventClick, onContextMenu }) => {
  const longPressProps = useLongPress(
    (e) => onContextMenu(e, event),
    () => onEventClick(event)
  );

  const backgroundColor = event.originalData?.card_color || (
    event.type === 'task' 
      ? (event.originalData?.completed ? 'var(--bg-subtle)' : colors.task)
      : (
          event.originalData?.cliente_id ? colors.cliente_reminder :
          event.originalData?.notizia_id ? colors.notizia_reminder :
          event.originalData?.calendarColor || (
            event.type === 'appointment' ? colors.appointment :
            event.type === 'cliente_reminder' ? colors.cliente_reminder :
            event.type === 'notizia_reminder' ? colors.notizia_reminder :
            '#1A1A18'
          )
        )
  );

  const textColor = getContrastColor(backgroundColor);

  return (
    <div
      {...longPressProps}
      onContextMenu={(e) => onContextMenu(e, event)}
      className={cn(
        "h-5 px-1.5 rounded-[4px] text-[11px] font-outfit font-medium truncate flex items-center"
      )}
      style={{ 
        backgroundColor,
        color: textColor === 'white' ? '#FFFFFF' : (
          event.type === 'cliente_reminder' ? '#3B2B8A' :
          event.type === 'notizia_reminder' ? '#5C3800' :
          event.type === 'task' ? '#2B3A5C' : '#1A1A18'
        )
      }}
    >
      {event.type === 'task' && (event.originalData?.completed ? '✓ ' : '○ ')}
      {!event.allDay && format(event.start, 'HH:mm')} {event.title}
    </div>
  );
};

const MonthView: React.FC<{ 
  currentDate: Date; 
  events: CalendarEvent[];
  colors: any;
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onContextMenu: (e: React.MouseEvent | React.TouchEvent, event: CalendarEvent) => void;
  toggleComplete: (args: { id: string; completed: boolean }) => void;
}> = ({ currentDate, events, colors, onDayClick, onEventClick, onContextMenu, toggleComplete }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getEventsForDay = (day: Date) => events.filter(e => isSameDay(e.start, day));

  return (
    <div className="grid grid-cols-7 h-full border-b border-[var(--border-calendar)] bg-white">
      {/* Weekday headers */}
      {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
        <div key={day} className="h-10 flex items-center justify-center border-b border-[var(--border-calendar)]">
          <span className="text-[11px] font-outfit font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            {day}
          </span>
        </div>
      ))}

      {/* Day cells */}
      {days.map((day, i) => {
        const dayEvents = getEventsForDay(day);
        const displayedEvents = dayEvents.slice(0, 3);
        const overflowCount = dayEvents.length - 3;

        return (
          <div
            key={day.toISOString()}
            onClick={() => onDayClick(day)}
            className={cn(
              "min-h-[100px] border-r border-b border-[var(--border-calendar)] p-2 flex flex-col gap-1 transition-colors hover:bg-black/[0.02] cursor-pointer",
              !isSameMonth(day, monthStart) && "opacity-35 bg-[var(--bg-subtle)]",
              i % 7 === 6 && "border-r-0"
            )}
          >
            <div className="flex justify-end">
              <span className={cn(
                "w-6 h-6 flex items-center justify-center rounded-full text-[13px] font-outfit font-medium",
                isToday(day) ? "bg-black text-white" : "text-[var(--text-primary)]"
              )}>
                {format(day, 'd')}
              </span>
            </div>

            <div className="flex flex-col gap-0.5 mt-1">
              {displayedEvents.map(event => (
                <MonthEventItem
                  key={event.id}
                  event={event}
                  colors={colors}
                  onEventClick={onEventClick}
                  onContextMenu={onContextMenu}
                />
              ))}
              {overflowCount > 0 && (
                <div className="h-5 px-1.5 rounded-[4px] bg-[var(--bg-subtle)] text-[var(--text-muted)] text-[10px] font-outfit font-medium flex items-center">
                  +{overflowCount} altri
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- Time Grid View (Week, 3-Day, Day) ---
const TimeGridEventItem: React.FC<{
  event: CalendarEvent;
  layout: Map<string, { left: number; width: number; zIndex: number }>;
  getEventStyle: (event: CalendarEvent) => any;
  colors: any;
  onEventClick: (event: CalendarEvent) => void;
  onContextMenu: (e: React.MouseEvent | React.TouchEvent, event: CalendarEvent) => void;
  toggleComplete: (args: { id: string; completed: boolean }) => void;
}> = ({ event, layout, getEventStyle, colors, onEventClick, onContextMenu, toggleComplete }) => {
  const longPressProps = useLongPress(
    (e) => onContextMenu(e, event),
    () => onEventClick(event)
  );

  if (event.type === 'task') {
    const backgroundColor = event.originalData?.card_color || (event.originalData?.completed ? 'var(--bg-subtle)' : colors.task);
    const textColor = getContrastColor(backgroundColor);

    return (
      <div
        key={event.id}
        draggable={true}
        {...longPressProps}
        onContextMenu={(e) => onContextMenu(e, event)}
        style={(() => {
          const pos = layout.get(event.id) || { left: 2, width: 96, zIndex: 10 };
          return {
            ...getEventStyle(event),
            background: backgroundColor,
            borderLeft: '3px solid #6DC88A',
            borderRadius: 6,
            padding: '3px 7px',
            display: 'flex', alignItems: 'center', gap: 5,
            opacity: event.originalData?.completed ? 0.5 : 1,
            cursor: 'pointer',
            overflow: 'hidden',
            position: 'absolute' as const,
            left: `${pos.left}%`,
            width: `${pos.width}%`,
            right: 'unset',
            zIndex: pos.zIndex,
            color: textColor === 'white' ? '#FFFFFF' : '#2B3A5C'
          };
        })()}
      >
        <button
          type="button"
          onClick={(e) => { 
            e.stopPropagation(); 
            toggleComplete({ id: event.id, completed: !event.originalData?.completed });
          }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
        >
          {event.originalData?.completed
            ? <CheckCircle2 size={12} style={{ color: textColor === 'white' ? '#FFFFFF' : '#6DC88A' }} />
            : <Circle size={12} style={{ color: textColor === 'white' ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }} />
          }
        </button>
        <span style={{
          fontSize: 11, fontFamily: 'Outfit', fontWeight: 500,
          textDecoration: event.originalData?.completed ? 'line-through' : 'none',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          flex: 1
        }}>
          {event.originalData?.notizia_id ? '🏠 ' : event.originalData?.cliente_id ? '👤 ' : ''}
          {event.title}
        </span>
      </div>
    );
  }

  const backgroundColor = event.originalData?.card_color || (
    event.originalData?.cliente_id ? colors.cliente_reminder :
    event.originalData?.notizia_id ? colors.notizia_reminder :
    event.originalData?.calendarColor || (
      event.type === 'appointment' ? colors.appointment :
      event.type === 'cliente_reminder' ? colors.cliente_reminder :
      event.type === 'notizia_reminder' ? colors.notizia_reminder :
      '#1A1A18'
    )
  );
  const textColor = getContrastColor(backgroundColor);

  return (
    <div
      key={event.id}
      draggable={event.type === 'appointment' || event.type === 'google_calendar'}
      {...longPressProps}
      onContextMenu={(e) => onContextMenu(e, event)}
      className={cn(
        "rounded-[6px] p-1 px-2 shadow-sm border-l-[3px] overflow-hidden transition-transform active:scale-[0.98] cursor-pointer",
        textColor === 'white' ? "border-white/20" : "border-black/10"
      )}
      style={(() => {
        const pos = layout.get(event.id) || { left: 2, width: 96, zIndex: 10 };
        return {
          ...getEventStyle(event),
          position: 'absolute' as const,
          left: `${pos.left}%`,
          width: `${pos.width}%`,
          right: 'unset',
          zIndex: pos.zIndex,
          backgroundColor,
          color: textColor === 'white' ? '#FFFFFF' : (
            event.type === 'cliente_reminder' ? '#3B2B8A' :
            event.type === 'notizia_reminder' ? '#5C3800' :
            '#1A1A18'
          )
        };
      })()}
    >
      <div className="font-outfit font-semibold text-[11px] leading-tight truncate">
        {event.title}
      </div>
      <div className="flex items-center gap-1 mt-0.5 opacity-80">
        <Clock size={10} />
        <span className="text-[9px] font-outfit">
          {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
        </span>
      </div>
    </div>
  );
};

const TimeGridView: React.FC<{
  currentDate: Date;
  events: CalendarEvent[];
  viewMode: ViewMode;
  colors: any;
  onEventClick: (event: CalendarEvent) => void;
  onContextMenu: (e: React.MouseEvent | React.TouchEvent, event: CalendarEvent) => void;
  onTimeRangeSelect: (date: Date, start: string, end: string) => void;
  onEventDrop: (eventId: string, start: Date, end: Date) => void;
  toggleComplete: (args: { id: string; completed: boolean }) => void;
}> = ({ currentDate, events, viewMode, colors, onEventClick, onContextMenu, onTimeRangeSelect, onEventDrop, toggleComplete }) => {
  const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 06:00 to 22:00
  const HOUR_HEIGHT = 64;

  const [selection, setSelection] = useState<{ day: Date; startHour: number; endHour: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingEvent, setIsDraggingEvent] = useState(false);
  const colRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const days = useMemo(() => {
    if (viewMode === 'day') return [currentDate];
    if (viewMode === '3days') return [currentDate, addDays(currentDate, 1), addDays(currentDate, 2)];
    
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end: addDays(start, 6) });
  }, [currentDate, viewMode]);

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getEventStyle = (event: CalendarEvent) => {
    const startHour = event.start.getHours();
    const startMinutes = event.start.getMinutes();
    const duration = differenceInMinutes(event.end, event.start);

    const top = ((startHour - 6) * HOUR_HEIGHT + startMinutes * (HOUR_HEIGHT / 60));
    const height = Math.max(28, duration * (HOUR_HEIGHT / 60));

    return { top: `${top}px`, height: `${height}px` };
  };

  // Google Calendar-style overlap layout
  const computeLayout = (dayEvents: CalendarEvent[]) => {
    if (dayEvents.length === 0) return new Map<string, { left: number; width: number; zIndex: number }>();

    // Sort: longer events first (they go behind), then by start time
    const sorted = [...dayEvents].sort((a, b) => {
      const durA = differenceInMinutes(a.end, a.start);
      const durB = differenceInMinutes(b.end, b.start);
      if (durB !== durA) return durB - durA; // longer first
      return a.start.getTime() - b.start.getTime();
    });

    // Build overlap groups: events that overlap with each other
    const groups: CalendarEvent[][] = [];
    for (const event of sorted) {
      let placed = false;
      for (const group of groups) {
        const overlapsGroup = group.some(
          other => event.start < other.end && event.end > other.start
        );
        if (overlapsGroup) {
          group.push(event);
          placed = true;
          break;
        }
      }
      if (!placed) groups.push([event]);
    }

    const layout = new Map<string, { left: number; width: number; zIndex: number }>();

    for (const group of groups) {
      // Within a group, assign columns using a greedy algorithm
      // Each column holds non-overlapping events
      const columns: CalendarEvent[][] = [];

      // Re-sort group by start time for column assignment
      const groupSorted = [...group].sort((a, b) => a.start.getTime() - b.start.getTime());

      for (const event of groupSorted) {
        let assigned = false;
        for (let col = 0; col < columns.length; col++) {
          const fits = !columns[col].some(
            other => event.start < other.end && event.end > other.start
          );
          if (fits) {
            columns[col].push(event);
            assigned = true;
            break;
          }
        }
        if (!assigned) {
          columns.push([event]);
        }
      }

      const totalCols = columns.length;

      // Assign position: events in later columns are smaller/narrower
      // to create the Google Calendar cascade effect
      for (let col = 0; col < columns.length; col++) {
        for (const event of columns[col]) {
          const dur = differenceInMinutes(event.end, event.start);
          
          // Google Calendar style: first col takes more space
          // subsequent cols overlap slightly to the right
          let left: number;
          let width: number;

          if (totalCols === 1) {
            left = 2;
            width = 96;
          } else {
            // Each column is offset by (colWidth * 0.7) and has width = colWidth * 1.1
            // so events slightly overlap each other (like Google Calendar)
            const offset = (col / totalCols) * 85;
            left = offset + 2;
            width = Math.min(95 - offset, (100 / totalCols) * 1.3);
          }

          // Shorter events go on top (higher zIndex)
          const zIndex = Math.max(10, 50 - Math.floor(dur / 30));

          layout.set(event.id, { left, width, zIndex });
        }
      }
    }

    return layout;
  };

  const isCurrentTimeVisible = useMemo(() => {
    return days.some(day => isSameDay(day, now)) && now.getHours() >= 6 && now.getHours() <= 22;
  }, [days, now]);

  const currentTimeTop = useMemo(() => {
    if (!isCurrentTimeVisible) return 0;
    return ((now.getHours() - 6) * HOUR_HEIGHT + now.getMinutes() * (HOUR_HEIGHT / 60));
  }, [now, isCurrentTimeVisible]);

  // Click and drag to create logic
  const handleMouseDown = (day: Date, hour: number) => {
    setSelection({ day, startHour: hour, endHour: hour + 1 });
    setIsDragging(true);
  };

  const handleMouseEnter = (hour: number) => {
    if (isDragging && selection) {
      setSelection({ ...selection, endHour: Math.max(selection.startHour + 1, hour + 1) });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && selection) {
      const start = `${selection.startHour.toString().padStart(2, '0')}:00`;
      const end = `${selection.endHour.toString().padStart(2, '0')}:00`;
      onTimeRangeSelect(selection.day, start, end);
      setSelection(null);
      setIsDragging(false);
    }
  };

  // Drag and drop to move logic
  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    e.dataTransfer.setData('eventId', eventId);
    e.dataTransfer.effectAllowed = 'move';
    setIsDraggingEvent(true);
  };

  const handleDragEnd = () => {
    setIsDraggingEvent(false);
  };

  return (
    <div 
      className="flex flex-col h-full overflow-hidden select-none"
      onMouseLeave={() => {
        if (isDragging) {
          setSelection(null);
          setIsDragging(false);
        }
      }}
    >
      {/* All-day reminders section */}
      <div className="flex border-b border-[var(--border-calendar)] bg-[var(--bg-subtle)]">
        <div className="w-16 border-r border-[var(--border-calendar)] flex items-center justify-center">
          <Bell size={14} className="text-[var(--text-muted)]" />
        </div>
        <div className="flex-1 flex divide-x divide-[var(--border-calendar)]">
          {days.map(day => {
            const dayReminders = events.filter(e => e.allDay && e.type !== 'task' && isSameDay(e.start, day));
            return (
              <div 
                key={day.toISOString()} 
                className="flex-1 p-2 flex flex-col gap-1 min-h-[40px]"
                onClick={() => onTimeRangeSelect(day, '10:00', '11:00')}
              >
                {dayReminders.map(rem => {
                  if (rem.type === 'task') {
                    return (
                      <div
                        key={rem.id}
                        onClick={(e) => { e.stopPropagation(); onEventClick(rem); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '2px 7px', borderRadius: 6, cursor: 'pointer',
                          background: 'white', border: '1px solid var(--border-light)',
                          opacity: rem.originalData?.completed ? 0.5 : 1, marginBottom: 2
                        }}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleComplete({ id: rem.id, completed: !rem.originalData?.completed });
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                        >
                          {rem.originalData?.completed
                            ? <CheckCircle2 size={12} style={{ color: '#6DC88A', flexShrink: 0 }} />
                            : <Circle size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          }
                        </button>
                        <span style={{
                          fontSize: 11, fontFamily: 'Outfit',
                          color: rem.originalData?.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                          textDecoration: rem.originalData?.completed ? 'line-through' : 'none',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                          {rem.originalData?.notizia_id ? '🏠 ' : rem.originalData?.cliente_id ? '👤 ' : ''}
                          {rem.title}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={rem.id}
                      onClick={(e) => { e.stopPropagation(); onEventClick(rem); }}
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-outfit font-medium truncate cursor-pointer",
                        rem.type === 'cliente_reminder' && "bg-[#EDE8FD] text-[#3B2B8A]",
                        rem.type === 'notizia_reminder' && "bg-[#FEF5D0] text-[#5C3800]"
                      )}
                    >
                      {rem.title}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day headers */}
      <div className="flex border-b border-[var(--border-calendar)]">
        <div className="w-16 border-r border-[var(--border-calendar)]" />
        <div className="flex-1 flex divide-x divide-[var(--border-calendar)]">
          {days.map(day => (
            <div key={day.toISOString()} className="flex-1 py-3 flex flex-col items-center gap-1">
              <span className="text-[11px] font-outfit font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {format(day, 'EEE', { locale: it })}
              </span>
              <span className={cn(
                "w-8 h-8 flex items-center justify-center rounded-full text-[15px] font-outfit font-semibold",
                isToday(day) ? "bg-black text-white" : "text-[var(--text-primary)]"
              )}>
                {format(day, 'd')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable grid */}
      <div className="flex-1 overflow-y-auto relative scrollbar-hide">
        <div className="flex min-h-full">
          {/* Time labels */}
          <div className="w-16 border-r border-[var(--border-calendar)] bg-white sticky left-0 z-10">
            {hours.map(hour => (
              <div key={hour} className="h-[64px] flex items-start justify-center pt-1">
                <span className="text-[11px] font-outfit font-medium text-[var(--text-muted)]">
                  {hour.toString().padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Grid columns */}
          <div className="flex-1 flex divide-x divide-[var(--border-calendar)] relative bg-white">
            {/* Horizontal grid lines */}
            <div className="absolute inset-0 pointer-events-none">
              {hours.map(hour => (
                <div key={hour} className="h-[64px] border-b border-[var(--border-calendar)] last:border-0" />
              ))}
            </div>

            {/* Selection overlay */}
            {selection && (
              <div 
                className="absolute bg-black/5 border-2 border-dashed border-black/20 rounded-lg pointer-events-none z-10"
                style={{
                  left: `${days.findIndex(d => isSameDay(d, selection.day)) * (100 / days.length)}%`,
                  width: `${100 / days.length}%`,
                  top: `${(selection.startHour - 6) * HOUR_HEIGHT}px`,
                  height: `${(selection.endHour - selection.startHour) * HOUR_HEIGHT}px`
                }}
              />
            )}

            {/* Current time line */}
            {isCurrentTimeVisible && (
              <div 
                className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                style={{ top: `${currentTimeTop}px` }}
              >
                <div className="w-2 h-2 rounded-full bg-[#F5A0B0] -ml-1 shadow-sm" />
                <div className="flex-1 border-t-2 border-[#F5A0B0]" />
              </div>
            )}

            {days.map(day => {
              const dayEvents = events.filter(e => !e.allDay && isSameDay(e.start, day));
              const layout = computeLayout(dayEvents);
              return (
                <div 
                  key={day.toISOString()} 
                  className="flex-1 relative h-full"
                  ref={el => { colRefs.current[day.toISOString()] = el; }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingEvent(false);
                    const eventId = e.dataTransfer.getData('eventId');
                    const movedEvent = events.find(ev => ev.id === eventId);
                    if (!movedEvent) return;
                    const col = colRefs.current[day.toISOString()];
                    if (!col) return;
                    const rect = col.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    const totalMinutes = Math.round((y / HOUR_HEIGHT) * 60);
                    const hour = Math.floor(totalMinutes / 60) + 6;
                    const minutes = totalMinutes % 60;
                    const clampedHour = Math.max(6, Math.min(21, hour));
                    const duration = differenceInMinutes(movedEvent.end, movedEvent.start);
                    const newStart = setMinutes(setHours(day, clampedHour), minutes);
                    const newEnd = new Date(newStart.getTime() + duration * 60000);
                    onEventDrop(eventId, newStart, newEnd);
                  }}
                >
                  {/* Clickable cells for creation */}
                  {hours.map(hour => (
                    <div
                      key={hour}
                      className="h-[64px] w-full"
                      onMouseDown={() => handleMouseDown(day, hour)}
                      onMouseEnter={() => handleMouseEnter(hour)}
                      onMouseUp={handleMouseUp}
                    />
                  ))}

                  {/* Events */}
                  {dayEvents.map(event => (
                    <TimeGridEventItem
                      key={event.id}
                      event={event}
                      layout={layout}
                      getEventStyle={getEventStyle}
                      colors={colors}
                      onEventClick={onEventClick}
                      onContextMenu={onContextMenu}
                      toggleComplete={toggleComplete}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
