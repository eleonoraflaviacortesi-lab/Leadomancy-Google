import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar as CalendarIcon, Clock, MapPin, User, Trash2, ExternalLink, CheckCircle2, Circle, Plus, Check } from "lucide-react";
import { Appointment } from "@/src/types";
import { GoogleCalendar, GoogleCalendarEvent } from "@/src/hooks/useGoogleCalendar";
import { useAppointments } from "@/src/hooks/useAppointments";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/src/lib/utils";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

// ... (rest of the file)

interface EventDetailsDialogProps {
  event: {
    id: string;
    title: string;
    start: Date;
    end: Date;
    type: 'appointment' | 'cliente_reminder' | 'notizia_reminder' | 'task' | 'google_calendar';
    originalData: any;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  calendars: GoogleCalendar[];
}

export const EventDetailsDialog: React.FC<EventDetailsDialogProps> = ({ event, isOpen, onClose, calendars }) => {
  const { deleteAppointment, updateAppointment } = useAppointments();
  const [isDeleting, setIsDeleting] = useState(false);
  const [tasks, setTasks] = useState(event?.originalData.tasks || []);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  if (!event) return null;

  const isAppointment = event.type === 'appointment';
  const isGoogle = event.type === 'google_calendar';
  
  const handleDelete = async () => {
    if (!isAppointment) return;
    setIsDeleting(true);
    try {
      await deleteAppointment(event.id);
      toast.success("Appuntamento eliminato");
      onClose();
    } catch (error) {
      toast.error("Errore durante l'eliminazione");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleCompleted = async () => {
    if (!isAppointment) return;
    try {
      await updateAppointment({ id: event.id, completed: !event.originalData.completed });
      toast.success(event.originalData.completed ? "Segnato come da fare" : "Segnato come completato");
    } catch (error) {
      toast.error("Errore durante l'aggiornamento");
    }
  };

  const handleCalendarChange = async (calendarId: string) => {
    if (!isAppointment) return;
    try {
      await updateAppointment({ id: event.id, calendar_id: calendarId });
      toast.success("Calendario aggiornato");
    } catch (error) {
      toast.error("Errore durante l'aggiornamento del calendario");
    }
  };

  const addTask = async () => {
    if (!newTaskTitle.trim() || !isAppointment) return;
    const newTask = { id: uuidv4(), title: newTaskTitle, completed: false };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    setNewTaskTitle('');
    try {
      await updateAppointment({ id: event.id, tasks: updatedTasks });
      toast.success("Task aggiunto");
    } catch (error) {
      toast.error("Errore durante l'aggiunta del task");
    }
  };

  const toggleTask = async (taskId: string) => {
    if (!isAppointment) return;
    const updatedTasks = tasks.map((t: any) => t.id === taskId ? { ...t, completed: !t.completed } : t);
    setTasks(updatedTasks);
    try {
      await updateAppointment({ id: event.id, tasks: updatedTasks });
    } catch (error) {
      toast.error("Errore durante l'aggiornamento del task");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--border-light)]">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  event.type === 'appointment' ? "bg-[#1A1A18]" : 
                  event.type === 'google_calendar' ? "bg-[var(--accent)]" : "bg-blue-500"
                )} 
                style={isGoogle ? { backgroundColor: event.originalData.calendarColor } : {}}
                />
                <h2 className="font-outfit font-bold text-[14px] uppercase tracking-wider text-[var(--text-primary)]">
                  Dettagli Evento
                </h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 flex flex-col gap-6">
              <div>
                <h3 className="font-outfit font-bold text-[20px] tracking-tight text-[var(--text-primary)] leading-tight">
                  {event.title}
                </h3>
                {isGoogle && (
                  <p className="text-[12px] font-outfit text-[var(--text-muted)] mt-1 flex items-center gap-1.5">
                    <CalendarIcon size={12} />
                    {event.originalData.calendarSummary || 'Google Calendar'}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center shrink-0">
                    <CalendarIcon size={16} className="text-[var(--text-muted)]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-outfit font-bold uppercase tracking-wider text-[var(--text-muted)]">Data</span>
                    <span className="text-[14px] font-outfit font-medium text-[var(--text-primary)]">
                      {format(event.start, 'EEEE d MMMM yyyy', { locale: it })}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center shrink-0">
                    <Clock size={16} className="text-[var(--text-muted)]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-outfit font-bold uppercase tracking-wider text-[var(--text-muted)]">Orario</span>
                    <span className="text-[14px] font-outfit font-medium text-[var(--text-primary)]">
                      {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                    </span>
                  </div>
                </div>

                {isAppointment && calendars.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center shrink-0">
                      <CalendarIcon size={16} className="text-[var(--text-muted)]" />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-[11px] font-outfit font-bold uppercase tracking-wider text-[var(--text-muted)]">Calendario</span>
                      <select
                        value={event.originalData.calendar_id || 'primary'}
                        onChange={(e) => handleCalendarChange(e.target.value)}
                        className="text-[14px] font-outfit font-medium text-[var(--text-primary)] bg-transparent border-none p-0 outline-none cursor-pointer hover:text-black transition-colors"
                      >
                        <option value="primary">Calendario Principale</option>
                        {calendars.filter(c => !c.primary).map(c => (
                          <option key={c.id} value={c.id}>{c.summary}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {event.originalData.location && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center shrink-0">
                      <MapPin size={16} className="text-[var(--text-muted)]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-outfit font-bold uppercase tracking-wider text-[var(--text-muted)]">Luogo</span>
                      <span className="text-[14px] font-outfit font-medium text-[var(--text-primary)]">
                        {event.originalData.location}
                      </span>
                    </div>
                  </div>
                )}

                {isAppointment && event.originalData.description && (
                  <div className="flex flex-col gap-1.5 mt-2">
                    <span className="text-[11px] font-outfit font-bold uppercase tracking-wider text-[var(--text-muted)]">Note</span>
                    <p className="text-[13px] font-outfit text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-subtle)] p-3 rounded-xl">
                      {event.originalData.description}
                    </p>
                  </div>
                )}

                {isAppointment && (
                  <div className="flex flex-col gap-3 mt-4">
                    <span className="text-[11px] font-outfit font-bold uppercase tracking-wider text-[var(--text-muted)]">Tasks</span>
                    <div className="flex flex-col gap-2">
                      {tasks.map((task: any) => (
                        <div key={task.id} className="flex items-center gap-2 bg-[var(--bg-subtle)] p-2 rounded-lg">
                          <button onClick={() => toggleTask(task.id)} className={cn("w-5 h-5 rounded-full flex items-center justify-center", task.completed ? "bg-green-500 text-white" : "border border-[var(--border-light)]")}>
                            {task.completed && <Check size={12} />}
                          </button>
                          <span className={cn("text-[13px] font-outfit", task.completed && "line-through text-[var(--text-muted)]")}>{task.title}</span>
                        </div>
                      ))}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="Nuovo task..."
                          className="flex-1 bg-[var(--bg-subtle)] border-0 rounded-lg p-2 text-[13px] font-outfit outline-none"
                        />
                        <button onClick={addTask} className="p-2 bg-black text-white rounded-lg">
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-4 pt-6 border-t border-[var(--border-light)]">
                {isAppointment && (
                  <>
                    <button
                      onClick={toggleCompleted}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-outfit font-bold text-[12px] uppercase tracking-wider transition-all",
                        event.originalData.completed 
                          ? "bg-green-50 text-green-700 border border-green-100" 
                          : "bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-light)] hover:bg-black/5"
                      )}
                    >
                      {event.originalData.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                      {event.originalData.completed ? "Completato" : "Segna completato"}
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-all shrink-0"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
                
                {isGoogle && event.originalData.htmlLink && (
                  <a
                    href={event.originalData.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-light)] rounded-full font-outfit font-bold text-[12px] uppercase tracking-wider hover:bg-black/5 transition-all"
                  >
                    <ExternalLink size={16} />
                    Vedi su Google Calendar
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
