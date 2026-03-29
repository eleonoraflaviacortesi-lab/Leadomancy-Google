import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar as CalendarIcon, Clock, MapPin, Trash2, ExternalLink, 
  CheckCircle2, Circle, ChevronLeft, Edit2, Save, Link2, Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useAppointments } from "@/src/hooks/useAppointments";
import { useClienti } from "@/src/hooks/useClienti";
import { useNotizie } from "@/src/hooks/useNotizie";
import { GoogleCalendar, useGoogleCalendar } from "@/src/hooks/useGoogleCalendar";
import { updateCalendarEvent } from "@/src/lib/googleCalendar";
import { format, isValid } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";
import { Appointment } from "@/src/types";

interface EventDetailsDialogProps {
  event: {
    id: string;
    title: string;
    start: Date;
    end: Date;
    type: 'appointment' | 'cliente_reminder' | 'notizia_reminder' | 'task' | 'google_calendar';
    originalData: any;
    allDay?: boolean;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  calendars: GoogleCalendar[];
}

const safeFormat = (date: Date | null | undefined, fmt: string, opts?: any) => {
  if (!date || !isValid(date)) return '—';
  try { return format(date, fmt, opts); } catch { return '—'; }
};

const COLORS = ['#FFF8E7','#F0FFF4','#F0F8FF','#F5F0FF','#FFF0F8','#FFEBCC','#E3F2FD','#FCE4EC'];

export const EventDetailsDialog: React.FC<EventDetailsDialogProps> = ({ 
  event, isOpen, onClose, calendars 
}) => {
  const { deleteAppointment, updateAppointment, toggleComplete } = useAppointments();
  const { clienti } = useClienti();
  const { notizie } = useNotizie();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editClienteId, setEditClienteId] = useState('');
  const [editNotiziaId, setEditNotiziaId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (event) {
      setEditTitle(event.title || '');
      setEditDate(isValid(event.start) ? format(event.start, 'yyyy-MM-dd') : '');
      setEditStartTime(isValid(event.start) ? format(event.start, 'HH:mm') : '10:00');
      setEditEndTime(isValid(event.end) ? format(event.end, 'HH:mm') : '11:00');
      setEditDescription(event.originalData?.description || '');
      setEditLocation(event.originalData?.location || '');
      setEditClienteId(event.originalData?.cliente_id || '');
      setEditNotiziaId(event.originalData?.notizia_id || '');
      if (isEditing) setIsEditing(false);
    }
  }, [event?.id]);

  if (!event) return null;

  const isLocal = event.type === 'appointment' || event.type === 'task';
  const isTask = event.type === 'task';
  const isGoogle = event.type === 'google_calendar';
  const isReminder = event.type === 'cliente_reminder' || event.type === 'notizia_reminder';

  const linkedCliente = clienti.find(c => c.id === (editClienteId || event.originalData?.cliente_id));
  const linkedNotizia = notizie.find(n => n.id === (editNotiziaId || event.originalData?.notizia_id));

  const handleSave = async () => {
    if (!editDate) return;
    setIsSaving(true);
    try {
      const start = new Date(`${editDate}T${editStartTime || '00:00'}:00`);
      const end = isTask 
        ? new Date(`${editDate}T${editStartTime || '00:00'}:00`)
        : new Date(`${editDate}T${editEndTime || '00:00'}:00`);
      
      if (isGoogle) {
          await updateCalendarEvent(event.id, {
              title: editTitle,
              start_time: start.toISOString(),
              end_time: end.toISOString(),
              description: editDescription,
              location: editLocation,
          } as Appointment);
      } else {
          await updateAppointment({
            id: event.id,
            title: editTitle,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            description: editDescription,
            location: editLocation,
            cliente_id: editClienteId || null,
            notizia_id: editNotiziaId || null,
          });
      }
      toast.success('Salvato');
      setIsEditing(false);
      onClose();
    } catch {
      toast.error('Errore nel salvataggio');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(isTask ? 'Eliminare questa task?' : 'Eliminare questo appuntamento?')) return;
    await deleteAppointment(event.id);
    toast.success('Eliminato');
    onClose();
  };

  const handleToggleComplete = () => {
    toggleComplete({ id: event.id, completed: !event.originalData?.completed });
    toast.success(event.originalData?.completed ? 'Riaperto' : 'Completato ✓');
    onClose();
  };

  // Type color dot
  const dotColor = isTask ? '#6DC88A' 
    : isGoogle ? (event.originalData?.calendarColor || '#1a73e8')
    : '#1A1A18';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/25"
          />
          <motion.div
            initial={{ scale: 0.97, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[480px] bg-white rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-[var(--border-light)] shrink-0">
              <div className="flex items-center gap-2.5">
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0 }} />
                <span className="font-outfit font-bold text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  {isTask ? 'Task' : isGoogle ? 'Google Calendar' : isReminder ? 'Promemoria' : 'Appuntamento'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {(isLocal || isGoogle) && !isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="w-9 h-9 flex items-center justify-center bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] rounded-full transition-colors"
                  >
                    <Edit2 size={16} className="text-[var(--text-secondary)]" />
                  </button>
                )}
                {(isLocal || isGoogle) && isEditing && (
                  <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="h-10 px-6 bg-[var(--text-primary)] text-white rounded-full font-outfit font-bold text-[12px] uppercase tracking-[0.15em] hover:opacity-90 transition-all shadow-lg shadow-[var(--text-primary)]/10 flex items-center gap-2"
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Salva
                  </button>
                )}
                <button 
                  onClick={onClose} 
                  className="w-9 h-9 flex items-center justify-center bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-0 overflow-y-auto p-8">

              {/* Title */}
              {isEditing ? (
                <div className="mb-8">
                  <label className="font-outfit font-bold text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] mb-2 block">
                    Titolo
                  </label>
                  <input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    autoFocus
                    className="w-full h-12 bg-[var(--bg-subtle)] border-none rounded-[12px] px-4 text-[18px] font-outfit font-bold text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-black/5 transition-all"
                  />
                </div>
              ) : (
                <h3 className={cn(
                  "font-outfit font-bold text-[24px] tracking-[-0.5px] mb-8 leading-tight",
                  event.originalData?.completed ? "text-[var(--text-muted)] line-through" : "text-[var(--text-primary)]"
                )}>
                  {event.title || '(Nessun titolo)'}
                </h3>
              )}

              <div className="flex flex-col gap-6">
                {/* Date */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center shrink-0">
                    <CalendarIcon size={18} className="text-[var(--text-muted)]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-outfit font-bold text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)] mb-1 px-1">Data</p>
                    {isEditing ? (
                      <input 
                        type="date" 
                        value={editDate} 
                        onChange={e => setEditDate(e.target.value)}
                        className="w-full h-11 bg-[var(--bg-subtle)] border border-[var(--border-light)] rounded-[14px] px-4 text-[14px] font-outfit font-bold text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--text-primary)]/10 transition-all shadow-sm" 
                      />
                    ) : (
                      <p className="font-outfit font-bold text-[15px] text-[var(--text-primary)] px-1">
                        {safeFormat(event.start, 'EEEE d MMMM yyyy', { locale: it })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Time (hidden for all-day/tasks) */}
                {!isTask && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center shrink-0">
                      <Clock size={18} className="text-[var(--text-muted)]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-outfit font-bold text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)] mb-1 px-1">Orario</p>
                      {isEditing ? (
                        <div className="flex gap-3 items-center">
                          <input 
                            type="time" 
                            value={editStartTime} 
                            onChange={e => setEditStartTime(e.target.value)}
                            className="h-11 bg-[var(--bg-subtle)] border border-[var(--border-light)] rounded-[14px] px-4 text-[14px] font-outfit font-bold text-[var(--text-primary)] outline-none flex-1 shadow-sm" 
                          />
                          <span className="text-[var(--text-muted)] font-bold">—</span>
                          <input 
                            type="time" 
                            value={editEndTime} 
                            onChange={e => setEditEndTime(e.target.value)}
                            className="h-11 bg-[var(--bg-subtle)] border border-[var(--border-light)] rounded-[14px] px-4 text-[14px] font-outfit font-bold text-[var(--text-primary)] outline-none flex-1 shadow-sm" 
                          />
                        </div>
                      ) : (
                        <p className="font-outfit font-bold text-[15px] text-[var(--text-primary)] px-1">
                          {safeFormat(event.start, 'HH:mm')} — {safeFormat(event.end, 'HH:mm')}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Location (not for task/reminder) */}
                {!isTask && !isReminder && (editLocation || isEditing) && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center shrink-0">
                      <MapPin size={18} className="text-[var(--text-muted)]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-outfit font-bold text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)] mb-1 px-1">Luogo</p>
                      {isEditing ? (
                        <input 
                          value={editLocation} 
                          onChange={e => setEditLocation(e.target.value)}
                          placeholder="Indirizzo o link..."
                          className="w-full h-11 bg-[var(--bg-subtle)] border border-[var(--border-light)] rounded-[14px] px-4 text-[14px] font-outfit font-bold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] shadow-sm" 
                        />
                      ) : (
                        <p className="font-outfit font-bold text-[15px] text-[var(--text-primary)] px-1">{editLocation}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                {(editDescription || isEditing) && isLocal && (
                  <div className="flex flex-col gap-2">
                    <p className="font-outfit font-bold text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Note</p>
                    {isEditing ? (
                      <textarea 
                        value={editDescription} 
                        onChange={e => setEditDescription(e.target.value)}
                        placeholder="Aggiungi note..."
                        className="w-full min-h-[100px] bg-[var(--bg-subtle)] border-none rounded-[16px] p-4 font-outfit text-[14px] font-normal text-[var(--text-secondary)] resize-none outline-none placeholder:text-[var(--text-muted)]" 
                      />
                    ) : (
                      <div className="bg-[var(--bg-subtle)] rounded-[16px] p-4">
                        <p className="font-outfit text-[14px] font-normal text-[var(--text-secondary)] leading-relaxed">
                          {editDescription}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Linked Cliente */}
                {isLocal && (linkedCliente || isEditing) && (
                  <div className="flex flex-col gap-2">
                    <p className="font-outfit font-bold text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] flex items-center gap-2">
                      <Link2 size={12} />
                      Buyer Collegato
                    </p>
                    {isEditing ? (
                      <div className="relative">
                        <select 
                          value={editClienteId} 
                          onChange={e => setEditClienteId(e.target.value)}
                          className="w-full h-11 bg-[var(--bg-subtle)] border-none rounded-[12px] px-4 text-[14px] font-outfit outline-none appearance-none cursor-pointer"
                        >
                          <option value="">Nessuno</option>
                          {clienti.map(c => <option key={c.id} value={c.id}>{c.nome} {c.cognome}</option>)}
                        </select>
                        <ChevronLeft size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] -rotate-90 pointer-events-none" />
                      </div>
                    ) : linkedCliente ? (
                      <div className="bg-[var(--bg-subtle)] rounded-[12px] p-3 px-4 flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[12px]">👤</div>
                        <span className="font-outfit font-bold text-[14px] text-[var(--text-primary)]">
                          {linkedCliente.nome} {linkedCliente.cognome}
                        </span>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Linked Notizia */}
                {isLocal && (linkedNotizia || isEditing) && (
                  <div className="flex flex-col gap-2">
                    <p className="font-outfit font-bold text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                      Notizia Collegata
                    </p>
                    {isEditing ? (
                      <div className="relative">
                        <select 
                          value={editNotiziaId} 
                          onChange={e => setEditNotiziaId(e.target.value)}
                          className="w-full h-11 bg-[var(--bg-subtle)] border-none rounded-[12px] px-4 text-[14px] font-outfit outline-none appearance-none cursor-pointer"
                        >
                          <option value="">Nessuna</option>
                          {notizie.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                        </select>
                        <ChevronLeft size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] -rotate-90 pointer-events-none" />
                      </div>
                    ) : linkedNotizia ? (
                      <div className="bg-[var(--bg-subtle)] rounded-[12px] p-3 px-4 flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[12px]">🏠</div>
                        <span className="font-outfit font-bold text-[14px] text-[var(--text-primary)]">
                          {linkedNotizia.name}
                        </span>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Google Calendar description */}
                {isGoogle && event.originalData?.description && (
                  <div className="flex flex-col gap-2">
                    <p className="font-outfit font-bold text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Note</p>
                    <div className="bg-[var(--bg-subtle)] rounded-[16px] p-4">
                      <p className="font-outfit text-[14px] font-normal text-[var(--text-secondary)] leading-relaxed">
                        {event.originalData.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Color picker for tasks */}
                {isTask && isEditing && (
                  <div className="flex flex-col gap-3">
                    <p className="font-outfit font-bold text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Colore</p>
                    <div className="flex gap-3 flex-wrap">
                      {COLORS.map(c => (
                        <button 
                          key={c} 
                          type="button"
                          onClick={() => updateAppointment({ id: event.id, card_color: c })}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all",
                            event.originalData?.card_color === c ? "border-black scale-110" : "border-transparent"
                          )}
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-8 border-t border-[var(--border-light)] flex gap-4">
              {isLocal && (
                <button 
                  onClick={handleToggleComplete}
                  className={cn(
                    "flex-1 h-14 flex items-center justify-center gap-3 rounded-full font-outfit font-bold text-[13px] uppercase tracking-[0.15em] transition-all shadow-sm",
                    event.originalData?.completed 
                      ? "bg-[#F0FFF4] text-[#2D8A4E] border border-[#6DC88A] hover:bg-[#E6FFED]" 
                      : "bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-light)] hover:bg-[var(--border-light)]"
                  )}
                >
                  {event.originalData?.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  {event.originalData?.completed ? 'Riapri' : isTask ? 'Completa task' : 'Segna completato'}
                </button>
              )}

              {isLocal && (
                <button 
                  onClick={handleDelete}
                  className="w-14 h-14 rounded-full bg-[#FEF2F2] hover:bg-[#FEE2E2] flex items-center justify-center transition-colors shrink-0 shadow-sm group"
                >
                  <Trash2 size={20} className="text-[#EF4444] group-hover:scale-110 transition-transform" />
                </button>
              )}

              {isGoogle && event.originalData?.htmlLink && (
                <a 
                  href={event.originalData.htmlLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 h-12 flex items-center justify-center gap-3 bg-[var(--bg-subtle)] border border-[var(--border-light)] text-[var(--text-primary)] rounded-full font-outfit font-bold text-[12px] uppercase tracking-[0.1em] hover:bg-[var(--border-light)] transition-all no-underline"
                >
                  <ExternalLink size={16} />
                  Vedi su Google Calendar
                </a>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
