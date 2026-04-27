import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar as CalendarIcon, Clock, MapPin, Trash2, ExternalLink,
  CheckCircle2, Circle, ChevronLeft, Edit2, Save, Link2, Loader2, Palette } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useAppointments } from "@/src/hooks/useAppointments";
import { useClienti } from "@/src/hooks/useClienti";
import { useNotizie } from "@/src/hooks/useNotizie";
import { useDetail } from "@/src/context/DetailContext";
import { useFavoriteColors } from "@/src/hooks/useFavoriteColors";
import { GoogleCalendar } from "@/src/hooks/useGoogleCalendar";
import { updateCalendarEvent } from "@/src/lib/googleCalendar";
import { format, isValid } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";
import { Appointment } from "@/src/types";

import { ColorPicker } from "@/src/components/ui/ColorPicker";

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
  onToggleComplete?: (args: { id: string; completed: boolean }) => void;
}

const safeFormat = (date: Date | null | undefined, fmt: string, opts?: any) => {
  if (!date || !isValid(date)) return '—';
  try { return format(date, fmt, opts); } catch { return '—'; }
};

// Rich, visible colors — not washed out pastels
const COLORS = [
  '#FCD34D', '#6EE7B7', '#93C5FD', '#C4B5FD',
  '#F9A8D4', '#FCA5A5', '#86EFAC', '#67E8F9',
  '#FDE68A', '#A5B4FC', '#F0ABFC', '#FB923C',
];

export const EventDetailsDialog: React.FC<EventDetailsDialogProps> = ({
  event, isOpen, onClose, calendars, onToggleComplete
}) => {
  const { deleteAppointment, updateAppointment, toggleComplete } = useAppointments();
  const { clienti } = useClienti();
  const { notizie } = useNotizie();
  const { openDetail } = useDetail();
  const { favorites, addColor } = useFavoriteColors();

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
  const [showColorPicker, setShowColorPicker] = useState(false);

  const [localCardColor, setLocalCardColor] = useState<string | null>(event?.originalData?.card_color ?? null);
  const colorInputRef = useRef<HTMLInputElement>(null);

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
      setLocalCardColor(event.originalData?.card_color ?? null);
      setIsEditing(false);
      setShowColorPicker(false);
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
      const start = new Date(`${editDate}T${editStartTime || '10:00'}:00`);
      // For tasks: use end time if provided, otherwise 1 hour after start
      const end = isTask
        ? new Date(`${editDate}T${editEndTime || editStartTime || '10:00'}:00`)
        : new Date(`${editDate}T${editEndTime || '11:00'}:00`);
      // Make sure end is after start
      const safeEnd = end <= start ? new Date(start.getTime() + 30 * 60000) : end;

      if (isGoogle) {
        await updateCalendarEvent(event.id, {
          title: editTitle,
          start_time: start.toISOString(),
          end_time: safeEnd.toISOString(),
          description: editDescription,
          location: editLocation,
        } as Appointment);
      } else {
        await updateAppointment({
          id: event.id,
          title: editTitle,
          start_time: start.toISOString(),
          end_time: safeEnd.toISOString(),
          description: editDescription,
          location: editLocation,
          cliente_id: editClienteId || null,
          notizia_id: editNotiziaId || null,
        });
      }
      toast.success('Salvato ✓');
      setIsEditing(false);
      // Do NOT close — let user see the updated event
    } catch {
      toast.error('Errore nel salvataggio');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(isTask ? 'Eliminare questa task?' : 'Eliminare questo appuntamento?')) {
      await deleteAppointment(event.id);
      toast.success('Eliminato');
      onClose();
    }
  };

  const handleToggleComplete = () => {
    if (onToggleComplete) {
      onToggleComplete({ id: event.id, completed: !event.originalData?.completed });
    } else {
      toggleComplete({ id: event.id, completed: !event.originalData?.completed });
    }
    toast.success(event.originalData?.completed ? 'Riaperto' : 'Completato ✓');
  };

  const handleColorChange = (color: string | null) => {
    setLocalCardColor(color);
    updateAppointment({ id: event.id, card_color: color, silent: true } as any);
    setShowColorPicker(false);
  };

  const dotColor = isTask
    ? (event.originalData?.card_color || '#6DC88A')
    : isGoogle ? (event.originalData?.calendarColor || '#1a73e8')
    : (event.originalData?.card_color || '#1A1A18');

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
            <div className="flex items-center justify-between p-6 border-b border-[var(--border-light)] shrink-0">
              <div className="flex items-center gap-2.5">
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0 }} />
                <span className="font-outfit font-bold text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  {isTask ? 'Task' : isGoogle ? 'Google Calendar' : isReminder ? 'Promemoria' : 'Appuntamento'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Color picker button — for all local events */}
                {isLocal && !isEditing && (
                  <div className="relative">
                    <button
                      onClick={() => setShowColorPicker(v => !v)}
                      className="w-9 h-9 flex items-center justify-center bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] rounded-full transition-colors"
                      title="Cambia colore"
                    >
                      <Palette size={16} className="text-[var(--text-secondary)]" />
                    </button>
                    {showColorPicker && (
                      <>
                        <div className="fixed inset-0 z-[110]" onClick={() => setShowColorPicker(false)} />
                        <div className="absolute right-0 top-11 z-[111] bg-white border border-[var(--border-light)] rounded-2xl shadow-xl p-3 w-[200px]">
                          <p className="font-outfit font-bold text-[9px] uppercase tracking-wider text-[var(--text-muted)] mb-2">Colore evento</p>
                          <div className="grid grid-cols-6 gap-1.5 mb-2">
                            {COLORS.map(c => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => handleColorChange(c)}
                                className={cn(
                                  "w-7 h-7 rounded-full border-2 transition-all hover:scale-110",
                                  event.originalData?.card_color === c ? "border-black scale-110" : "border-transparent"
                                )}
                                style={{ background: c }}
                              />
                            ))}
                          </div>

                          {favorites.length > 0 && (
                            <>
                              <p className="font-outfit font-bold text-[9px] uppercase tracking-wider text-[var(--text-muted)] mb-2 mt-3">Colori salvati</p>
                              <div className="grid grid-cols-6 gap-1.5 mb-2">
                                {favorites.map(c => (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => handleColorChange(c)}
                                    className={cn(
                                      "w-7 h-7 rounded-full border-2 transition-all hover:scale-110",
                                      event.originalData?.card_color === c ? "border-black scale-110" : "border-transparent"
                                    )}
                                    style={{ background: c }}
                                  />
                                ))}
                              </div>
                            </>
                          )}

                          <button
                            onClick={() => handleColorChange(null)}
                            className="w-full text-[10px] font-outfit text-[var(--text-muted)] hover:text-[var(--text-primary)] text-center py-1 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors"
                          >
                            ✕ Rimuovi colore
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
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
                    className="h-10 px-6 bg-[var(--text-primary)] text-white rounded-full font-outfit font-bold text-[12px] uppercase tracking-[0.15em] hover:opacity-90 transition-all flex items-center gap-2"
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Salva
                  </button>
                )}
                {isEditing && (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="w-9 h-9 flex items-center justify-center bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] rounded-full transition-colors"
                  >
                    <X size={18} className="text-[var(--text-secondary)]" />
                  </button>
                )}
                {!isEditing && (
                  <button
                    onClick={onClose}
                    className="w-9 h-9 flex items-center justify-center bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-0 overflow-y-auto p-6">

              {/* Title */}
              {isEditing ? (
                <div className="mb-6">
                  <label className="font-outfit font-bold text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] mb-2 block">
                    Titolo
                  </label>
                  <input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    autoFocus
                    className="w-full h-12 bg-[var(--bg-subtle)] border-none rounded-[12px] px-4 text-[18px] font-outfit font-bold text-[var(--text-primary)] outline-none"
                  />
                </div>
              ) : (
                <h3 className={cn(
                  "font-outfit font-bold text-[22px] tracking-[-0.5px] mb-6 leading-tight",
                  event.originalData?.completed ? "text-[var(--text-muted)] line-through" : "text-[var(--text-primary)]"
                )}>
                  {event.title || '(Nessun titolo)'}
                </h3>
              )}

              <div className="flex flex-col gap-5">
                {/* Date */}
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center shrink-0">
                    <CalendarIcon size={16} className="text-[var(--text-muted)]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-outfit font-bold text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)] mb-1">Data</p>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editDate}
                        onChange={e => setEditDate(e.target.value)}
                        className="w-full h-10 bg-[var(--bg-subtle)] border border-[var(--border-light)] rounded-[12px] px-4 text-[13px] font-outfit font-bold text-[var(--text-primary)] outline-none"
                      />
                    ) : (
                      <p className="font-outfit font-bold text-[14px] text-[var(--text-primary)]">
                        {safeFormat(event.start, 'EEEE d MMMM yyyy', { locale: it })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Time — show for ALL local events including tasks */}
                {isLocal && (
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center shrink-0">
                      <Clock size={16} className="text-[var(--text-muted)]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-outfit font-bold text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)] mb-1">Orario</p>
                      {isEditing ? (
                        <div className="flex gap-3 items-center">
                          <input
                            type="time"
                            value={editStartTime}
                            onChange={e => setEditStartTime(e.target.value)}
                            className="h-10 bg-[var(--bg-subtle)] border border-[var(--border-light)] rounded-[12px] px-3 text-[13px] font-outfit font-bold text-[var(--text-primary)] outline-none flex-1"
                          />
                          <span className="text-[var(--text-muted)] font-bold">—</span>
                          <input
                            type="time"
                            value={editEndTime}
                            onChange={e => setEditEndTime(e.target.value)}
                            className="h-10 bg-[var(--bg-subtle)] border border-[var(--border-light)] rounded-[12px] px-3 text-[13px] font-outfit font-bold text-[var(--text-primary)] outline-none flex-1"
                          />
                        </div>
                      ) : (
                        <p className="font-outfit font-bold text-[14px] text-[var(--text-primary)]">
                          {safeFormat(event.start, 'HH:mm')} — {safeFormat(event.end, 'HH:mm')}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Time for Google events (read-only) */}
                {isGoogle && (
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center shrink-0">
                      <Clock size={16} className="text-[var(--text-muted)]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-outfit font-bold text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)] mb-1">Orario</p>
                      <p className="font-outfit font-bold text-[14px] text-[var(--text-primary)]">
                        {safeFormat(event.start, 'HH:mm')} — {safeFormat(event.end, 'HH:mm')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Location */}
                {!isReminder && (editLocation || isEditing) && (
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center shrink-0">
                      <MapPin size={16} className="text-[var(--text-muted)]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-outfit font-bold text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)] mb-1">Luogo</p>
                      {isEditing ? (
                        <input
                          value={editLocation}
                          onChange={e => setEditLocation(e.target.value)}
                          placeholder="Indirizzo o link..."
                          className="w-full h-10 bg-[var(--bg-subtle)] border border-[var(--border-light)] rounded-[12px] px-3 text-[13px] font-outfit font-bold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                        />
                      ) : (
                        <p className="font-outfit font-bold text-[14px] text-[var(--text-primary)]">{editLocation}</p>
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
                        className="w-full min-h-[80px] bg-[var(--bg-subtle)] border-none rounded-[14px] p-3 font-outfit text-[13px] text-[var(--text-secondary)] resize-none outline-none placeholder:text-[var(--text-muted)]"
                      />
                    ) : (
                      <div className="bg-[var(--bg-subtle)] rounded-[14px] p-3">
                        <p className="font-outfit text-[13px] text-[var(--text-secondary)] leading-relaxed">
                          {editDescription}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Google Calendar description */}
                {isGoogle && event.originalData?.description && (
                  <div className="flex flex-col gap-2">
                    <p className="font-outfit font-bold text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Note</p>
                    <div className="bg-[var(--bg-subtle)] rounded-[14px] p-3">
                      <p className="font-outfit text-[13px] text-[var(--text-secondary)] leading-relaxed">
                        {event.originalData.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Linked Cliente */}
                {isLocal && (linkedCliente || isEditing) && (
                  <div className="flex flex-col gap-2">
                    <p className="font-outfit font-bold text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] flex items-center gap-2">
                      <Link2 size={11} /> Buyer Collegato
                    </p>
                    {isEditing ? (
                      <div className="relative">
                        <select
                          value={editClienteId}
                          onChange={e => setEditClienteId(e.target.value)}
                          className="w-full h-10 bg-[var(--bg-subtle)] border-none rounded-[12px] px-3 text-[13px] font-outfit outline-none appearance-none cursor-pointer"
                        >
                          <option value="">Nessuno</option>
                          {clienti.map(c => <option key={c.id} value={c.id}>{c.nome} {c.cognome}</option>)}
                        </select>
                        <ChevronLeft size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] -rotate-90 pointer-events-none" />
                      </div>
                    ) : linkedCliente ? (
                      <div 
                        className="bg-[var(--bg-subtle)] rounded-[12px] p-3 flex items-center gap-3 cursor-pointer hover:bg-[var(--border-light)] transition-colors"
                        onClick={() => {
                          onClose();
                          openDetail('cliente', linkedCliente.id);
                        }}
                      >
                        <span className="text-[14px]">👤</span>
                        <span className="font-outfit font-bold text-[13px] text-[var(--text-primary)]">
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
                          className="w-full h-10 bg-[var(--bg-subtle)] border-none rounded-[12px] px-3 text-[13px] font-outfit outline-none appearance-none cursor-pointer"
                        >
                          <option value="">Nessuna</option>
                          {notizie.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                        </select>
                        <ChevronLeft size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] -rotate-90 pointer-events-none" />
                      </div>
                    ) : linkedNotizia ? (
                      <div 
                        className="bg-[var(--bg-subtle)] rounded-[12px] p-3 flex items-center gap-3 cursor-pointer hover:bg-[var(--border-light)] transition-colors"
                        onClick={() => {
                          onClose();
                          openDetail('notizia', linkedNotizia.id);
                        }}
                      >
                        <span className="text-[14px]">🏠</span>
                        <span className="font-outfit font-bold text-[13px] text-[var(--text-primary)]">
                          {linkedNotizia.name}
                        </span>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Color Picker for Local Events */}
                {isLocal && (
                  <div className="flex flex-col gap-3 pt-4 border-t border-[var(--border-light)]">
                    <span className="text-[10px] font-outfit font-bold text-[var(--text-muted)] uppercase tracking-widest">
                      Colore Scheda
                    </span>
                    <div className="flex items-center gap-3">
                      <ColorPicker 
                        color={localCardColor || '#F5F5F0'} 
                        onChange={handleColorChange}
                        className="flex-1"
                      />
                      {localCardColor && (
                        <button
                          type="button"
                          onClick={() => handleColorChange(null)}
                          className="text-[11px] font-bold text-[var(--rose-fg)] hover:underline"
                        >
                          Rimuovi
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-[var(--border-light)] flex gap-3">
              {isLocal && (
                <button
                  onClick={handleToggleComplete}
                  className={cn(
                    "flex-1 h-12 flex items-center justify-center gap-2 rounded-full font-outfit font-bold text-[12px] uppercase tracking-[0.12em] transition-all",
                    event.originalData?.completed
                      ? "bg-[#F0FFF4] text-[#2D8A4E] border border-[#6DC88A] hover:bg-[#E6FFED]"
                      : "bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-light)] hover:bg-[var(--border-light)]"
                  )}
                >
                  {event.originalData?.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  {event.originalData?.completed ? 'Riapri' : isTask ? 'Completa' : 'Completato'}
                </button>
              )}
              {isLocal && (
                <button
                  onClick={handleDelete}
                  className="w-12 h-12 rounded-full bg-[#FEF2F2] hover:bg-[#FEE2E2] flex items-center justify-center transition-colors shrink-0"
                >
                  <Trash2 size={18} className="text-[#EF4444]" />
                </button>
              )}
              {isGoogle && event.originalData?.htmlLink && (
                <a
                  href={event.originalData.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 h-12 flex items-center justify-center gap-2 bg-[var(--bg-subtle)] border border-[var(--border-light)] text-[var(--text-primary)] rounded-full font-outfit font-bold text-[11px] uppercase tracking-[0.1em] hover:bg-[var(--border-light)] transition-all no-underline"
                >
                  <ExternalLink size={14} />
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
