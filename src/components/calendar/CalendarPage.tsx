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
import { Appointment, Cliente, Notizia } from "@/src/types";
import { AddAppointmentDialog } from "./AddAppointmentDialog";
import { CalendarSidebar } from "./CalendarSidebar";
import { EventDetailsDialog } from "./EventDetailsDialog";
import { cn, formatCurrency } from "@/src/lib/utils";
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
    const saved = localStorage.getItem('leadomancy-calendar-view');
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
    return localStorage.getItem('leadomancy-calendar-error-dismissed') === 'true';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('leadomancy-calendar-sidebar-collapsed');
    if (saved !== null) return JSON.parse(saved);
    return window.innerWidth < 1280; // Only collapse by default on smaller screens
  });

  const { appointments, updateAppointment, toggleComplete } = useAppointments();
  const { 
    calendars, 
    visibleCalendarIds, 
    events: googleEvents, 
    isLoading: isGoogleLoading,
    hasAttemptedFetch,
    toggleCalendar,
    toggleAll,
    error: googleError
  } = useGoogleCalendar();
  const { clienti } = useClienti();
  const { notizie } = useNotizie();
  const { isAuthenticated } = useAuth();

  const calendarRef = useRef<HTMLDivElement>(null);

  // Sidebar persistence
  useEffect(() => {
    localStorage.setItem('leadomancy-calendar-sidebar-collapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

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
    localStorage.setItem('leadomancy-calendar-error-dismissed', 'true');
  };

  // View Mode persistence
  useEffect(() => {
    localStorage.setItem('leadomancy-calendar-view', viewMode);
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
      const calendar = calendars.find(c => c.id === app.calendar_id);
      events.push({
        id: app.id,
        title: app.title,
        start: parseISO(app.start_time),
        end: parseISO(app.end_time),
        type: isTask ? 'task' : 'appointment',
        allDay: isTask,
        originalData: {
          ...app,
          calendarColor: calendar?.backgroundColor || '#1A1A18',
          calendarSummary: calendar?.summary || 'Leadomancy'
        }
      });
    });

    // Google Calendar Events (deduplicated)
    googleEvents.forEach(gEvent => {
      if (!googleEventIdsInLocal.has(gEvent.id)) {
        const start = gEvent.start.dateTime ? parseISO(gEvent.start.dateTime) : parseISO(gEvent.start.date);
        const end = gEvent.end.dateTime ? parseISO(gEvent.end.dateTime) : parseISO(gEvent.end.date);
        
        events.push({
          id: gEvent.id,
          title: gEvent.summary || '(Nessun titolo)',
          start,
          end,
          type: 'google_calendar',
          allDay: !gEvent.start.dateTime,
          originalData: gEvent
        });
      }
    });

    // Cliente Reminders
    clienti.forEach(c => {
      if (c.reminder_date) {
        const date = parseISO(c.reminder_date);
        events.push({
          id: `c-${c.id}`,
          title: `Reminder: ${c.nome} ${c.cognome}`,
          start: startOfDay(date),
          end: endOfDay(date),
          type: 'cliente_reminder',
          allDay: true,
          originalData: c
        });
      }
    });

    // Notizia Reminders
    notizie.forEach(n => {
      if (n.reminder_date) {
        const date = parseISO(n.reminder_date);
        events.push({
          id: `n-${n.id}`,
          title: `Reminder: ${n.nome || n.name}`,
          start: startOfDay(date),
          end: endOfDay(date),
          type: 'notizia_reminder',
          allDay: true,
          originalData: n
        });
      }
    });

    return events;
  }, [appointments, googleEvents, clienti, notizie]);

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
    if (!event || event.type !== 'appointment') {
      if (event?.type === 'google_calendar') {
        toast.error("Gli eventi di Google Calendar possono essere modificati solo su Google");
      }
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
    <div className="flex flex-col h-full bg-[var(--bg-page)] overflow-hidden rounded-t-2xl">
      {/* Header */}
      <div className="flex flex-col gap-6 pt-6 pb-6 border-b border-[var(--border-light)]">
        {calendarError && !isErrorDismissed && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center justify-between gap-3 mb-2"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle size={16} />
                <span className="text-[12px] font-outfit font-medium">{calendarError}</span>
              </div>
              <a 
                href="https://console.cloud.google.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[11px] font-outfit font-bold text-red-700 uppercase tracking-tight flex items-center gap-1 hover:underline"
              >
                Vai alla console <ExternalLink size={12} />
              </a>
            </div>
            <button 
              onClick={handleDismissError}
              className="p-1 hover:bg-red-100 rounded-full text-red-400 transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-outfit text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
              Leadomancy / Attività
            </span>
            <h1 className="font-outfit font-semibold text-[24px] tracking-tight text-[var(--text-primary)] capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: it })}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {isGoogleLoading && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100 animate-pulse">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                <span className="text-[10px] font-outfit font-bold uppercase tracking-wider">Sincronizzazione...</span>
              </div>
            )}
            <div className="flex items-center bg-[var(--bg-subtle)] rounded-full p-1 border border-[var(--border-light)]">
              <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className={cn(
                  "p-1.5 rounded-full transition-all flex items-center gap-2 px-3",
                  !isSidebarCollapsed ? "bg-[#1A1A18] text-white shadow-sm" : "hover:bg-black/5 text-[var(--text-secondary)]"
                )}
                title={isSidebarCollapsed ? "Mostra Calendari" : "Nascondi Calendari"}
              >
                <CalendarIcon size={16} />
                <span className="text-[12px] font-outfit font-bold uppercase tracking-tight">Calendari</span>
              </button>
              <div className="w-px h-4 bg-[var(--border-light)] mx-1" />
              <button onClick={handlePrev} className="p-1.5 hover:bg-black/5 rounded-full transition-colors">
                <ChevronLeft size={18} />
              </button>
              <button onClick={handleToday} className="px-3 py-1 text-[12px] font-outfit font-medium hover:bg-black/5 rounded-full transition-colors">
                Oggi
              </button>
              <button onClick={handleNext} className="p-1.5 hover:bg-black/5 rounded-full transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="flex bg-[var(--bg-subtle)] p-1 rounded-full border border-[var(--border-light)]">
              {(['day', '3days', 'week', 'month'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "px-3 py-1 rounded-full font-outfit text-[12px] transition-all uppercase",
                    viewMode === mode ? "bg-[#1A1A18] text-white shadow-sm" : "text-[var(--text-secondary)] hover:bg-black/5"
                  )}
                >
                  {mode === 'day' ? 'G' : mode === '3days' ? '3G' : mode === 'week' ? 'S' : 'M'}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setDefaultType('task');
                setIsAddDialogOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2 bg-[var(--bg-subtle)] text-[var(--text-primary)] rounded-full font-outfit font-medium text-[13px] hover:bg-black/5 transition-all shadow-sm border border-[var(--border-light)]"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Task</span>
            </button>

            <button
              onClick={() => {
                setDefaultType('visit');
                setIsAddDialogOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2 bg-[#1A1A18] text-white rounded-full font-outfit font-medium text-[13px] hover:bg-black transition-all shadow-sm"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Appuntamento</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <CalendarSidebar 
          calendars={calendars}
          visibleCalendarIds={visibleCalendarIds}
          onToggle={toggleCalendar}
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
                  onDayClick={(date) => {
                    setCurrentDate(date);
                    setViewMode('day');
                  }}
                  onEventClick={handleEventClick}
                  toggleComplete={toggleComplete}
                />
              ) : (
                <TimeGridView 
                  currentDate={currentDate} 
                  events={allEvents} 
                  viewMode={viewMode}
                  onEventClick={handleEventClick}
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
    </div>
  );
};

// --- Month View Component ---
const MonthView: React.FC<{ 
  currentDate: Date; 
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  toggleComplete: (args: { id: string; completed: boolean }) => void;
}> = ({ currentDate, events, onDayClick, onEventClick, toggleComplete }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getEventsForDay = (day: Date) => events.filter(e => isSameDay(e.start, day));

  return (
    <div className="grid grid-cols-7 h-full border-b border-[var(--border-light)] bg-white">
      {/* Weekday headers */}
      {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
        <div key={day} className="h-10 flex items-center justify-center border-b border-[var(--border-light)]">
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
              "min-h-[100px] border-r border-b border-[var(--border-light)] p-2 flex flex-col gap-1 transition-colors hover:bg-black/[0.02] cursor-pointer",
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
                <div
                  key={event.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(event);
                  }}
                  className={cn(
                    "h-5 px-1.5 rounded-[4px] text-[11px] font-outfit font-medium truncate flex items-center",
                    event.type === 'appointment' && "text-white",
                    event.type === 'google_calendar' && "text-white",
                    event.type === 'cliente_reminder' && "bg-[#EDE8FD] text-[#3B2B8A]",
                    event.type === 'notizia_reminder' && "bg-[#FEF5D0] text-[#5C3800]",
                    event.type === 'task' && "bg-[#EEF1F8] text-[#2B3A5C]"
                  )}
                  style={{ backgroundColor: event.originalData.calendarColor }}
                >
                  {event.type === 'task' && (event.originalData?.completed ? '✓ ' : '○ ')}
                  {!event.allDay && format(event.start, 'HH:mm')} {event.title}
                </div>
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
const TimeGridView: React.FC<{
  currentDate: Date;
  events: CalendarEvent[];
  viewMode: ViewMode;
  onEventClick: (event: CalendarEvent) => void;
  onTimeRangeSelect: (date: Date, start: string, end: string) => void;
  onEventDrop: (eventId: string, start: Date, end: Date) => void;
  toggleComplete: (args: { id: string; completed: boolean }) => void;
}> = ({ currentDate, events, viewMode, onEventClick, onTimeRangeSelect, onEventDrop, toggleComplete }) => {
  const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 06:00 to 22:00
  const HOUR_HEIGHT = 64;

  const [selection, setSelection] = useState<{ day: Date; startHour: number; endHour: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, day: Date, hour: number) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('eventId');
    const event = events.find(ev => ev.id === eventId);
    
    if (event) {
      const duration = differenceInMinutes(event.end, event.start);
      const newStart = setMinutes(setHours(day, hour), 0);
      const newEnd = new Date(newStart.getTime() + duration * 60000);
      onEventDrop(eventId, newStart, newEnd);
    }
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
      <div className="flex border-b border-[var(--border-light)] bg-[var(--bg-subtle)]">
        <div className="w-16 border-r border-[var(--border-light)] flex items-center justify-center">
          <Bell size={14} className="text-[var(--text-muted)]" />
        </div>
        <div className="flex-1 flex divide-x divide-[var(--border-light)]">
          {days.map(day => {
            const dayReminders = events.filter(e => (e.allDay || e.type === 'task') && isSameDay(e.start, day));
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
      <div className="flex border-b border-[var(--border-light)]">
        <div className="w-16 border-r border-[var(--border-light)]" />
        <div className="flex-1 flex divide-x divide-[var(--border-light)]">
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
          <div className="w-16 border-r border-[var(--border-light)] bg-white sticky left-0 z-10">
            {hours.map(hour => (
              <div key={hour} className="h-[64px] flex items-start justify-center pt-1">
                <span className="text-[11px] font-outfit font-medium text-[var(--text-muted)]">
                  {hour.toString().padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Grid columns */}
          <div className="flex-1 flex divide-x divide-[var(--border-light)] relative bg-white">
            {/* Horizontal grid lines */}
            <div className="absolute inset-0 pointer-events-none">
              {hours.map(hour => (
                <div key={hour} className="h-[64px] border-b border-[var(--border-light)] last:border-0" />
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
              const dayEvents = events.filter(e => !e.allDay && e.type !== 'task' && isSameDay(e.start, day));
              return (
                <div key={day.toISOString()} className="flex-1 relative h-full">
                  {/* Clickable cells for creation */}
                  {hours.map(hour => (
                    <div
                      key={hour}
                      className="h-[64px] w-full"
                      onMouseDown={() => handleMouseDown(day, hour)}
                      onMouseEnter={() => handleMouseEnter(hour)}
                      onMouseUp={handleMouseUp}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, day, hour)}
                    />
                  ))}

                  {/* Events */}
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      draggable={event.type === 'appointment'}
                      onDragStart={(e) => handleDragStart(e, event.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      className={cn(
                        "absolute left-1 right-1 rounded-[6px] p-1 px-2 shadow-sm border-l-[3px] overflow-hidden transition-transform active:scale-[0.98] cursor-pointer z-10",
                        event.type === 'appointment' && "text-white border-white/20",
                        event.type === 'google_calendar' && "text-white border-white/20",
                        event.type === 'task' && "bg-[#EEF1F8] text-[#2B3A5C] border-[#2B3A5C]/20"
                      )}
                      style={{ 
                        ...getEventStyle(event),
                        backgroundColor: event.originalData.calendarColor
                      }}
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
