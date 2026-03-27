import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar as CalendarIcon, Clock, MapPin, Trash2, ExternalLink, 
  CheckCircle2, Circle, ChevronLeft, Edit2, Save, Link2 } from "lucide-react";
import { useAppointments } from "@/src/hooks/useAppointments";
import { useClienti } from "@/src/hooks/useClienti";
import { useNotizie } from "@/src/hooks/useNotizie";
import { GoogleCalendar } from "@/src/hooks/useGoogleCalendar";
import { format, isValid } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";

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
      setIsEditing(false);
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/30"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col"
            style={{ maxWidth: 480, maxHeight: '85vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-light)] shrink-0">
              <div className="flex items-center gap-2">
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0 }} />
                <span className="font-outfit font-bold text-[13px] uppercase tracking-wider text-[var(--text-muted)]">
                  {isTask ? 'Task' : isGoogle ? 'Google Calendar' : isReminder ? 'Promemoria' : 'Appuntamento'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {isLocal && !isEditing && (
                  <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                    <Edit2 size={16} className="text-[var(--text-muted)]" />
                  </button>
                )}
                {isLocal && isEditing && (
                  <button onClick={handleSave} disabled={isSaving}
                    className="px-3 py-1.5 bg-[#1A1A18] text-white rounded-full font-outfit font-bold text-[11px] uppercase tracking-wide mr-1">
                    {isSaving ? '...' : 'Salva'}
                  </button>
                )}
                <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-0 overflow-y-auto p-6">

              {/* Title */}
              {isEditing ? (
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  autoFocus
                  style={{
                    fontSize: 20, fontWeight: 700, fontFamily: 'Outfit',
                    border: 'none', borderBottom: '2px solid #1A1A18',
                    outline: 'none', width: '100%', marginBottom: 20,
                    background: 'transparent', color: 'var(--text-primary)'
                  }}
                />
              ) : (
                <h3 style={{
                  fontSize: 20, fontWeight: 700, fontFamily: 'Outfit',
                  color: event.originalData?.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                  textDecoration: event.originalData?.completed ? 'line-through' : 'none',
                  marginBottom: 20, lineHeight: 1.3,
                }}>
                  {event.title || '(Nessun titolo)'}
                </h3>
              )}

              {/* Date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CalendarIcon size={15} style={{ color: 'var(--text-muted)' }} />
                </div>
                <div>
                  <p style={{ fontSize: 10, fontFamily: 'Outfit', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 2 }}>Data</p>
                  {isEditing ? (
                    <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                      style={{ fontSize: 13, fontFamily: 'Outfit', border: 'none', borderBottom: '1px solid #D1D0CB', outline: 'none', background: 'transparent' }} />
                  ) : (
                    <p style={{ fontSize: 13, fontFamily: 'Outfit', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {safeFormat(event.start, 'EEEE d MMMM yyyy', { locale: it })}
                    </p>
                  )}
                </div>
              </div>

              {/* Time (hidden for all-day/tasks) */}
              {!isTask && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Clock size={15} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 10, fontFamily: 'Outfit', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 2 }}>Orario</p>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input type="time" value={editStartTime} onChange={e => setEditStartTime(e.target.value)}
                          style={{ fontSize: 13, fontFamily: 'Outfit', border: 'none', borderBottom: '1px solid #D1D0CB', outline: 'none', background: 'transparent' }} />
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                        <input type="time" value={editEndTime} onChange={e => setEditEndTime(e.target.value)}
                          style={{ fontSize: 13, fontFamily: 'Outfit', border: 'none', borderBottom: '1px solid #D1D0CB', outline: 'none', background: 'transparent' }} />
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, fontFamily: 'Outfit', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {safeFormat(event.start, 'HH:mm')} — {safeFormat(event.end, 'HH:mm')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Location (not for task/reminder) */}
              {!isTask && !isReminder && (editLocation || isEditing) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin size={15} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 10, fontFamily: 'Outfit', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 2 }}>Luogo</p>
                    {isEditing ? (
                      <input value={editLocation} onChange={e => setEditLocation(e.target.value)}
                        placeholder="Indirizzo o link..."
                        style={{ fontSize: 13, fontFamily: 'Outfit', border: 'none', borderBottom: '1px solid #D1D0CB', outline: 'none', background: 'transparent', width: '100%' }} />
                    ) : (
                      <p style={{ fontSize: 13, fontFamily: 'Outfit', color: 'var(--text-primary)' }}>{editLocation}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {(editDescription || isEditing) && isLocal && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontFamily: 'Outfit', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>Note</p>
                  {isEditing ? (
                    <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)}
                      placeholder="Aggiungi note..."
                      style={{ width: '100%', minHeight: 72, background: 'var(--bg-subtle)', border: 'none', borderRadius: 10, padding: '8px 12px', fontFamily: 'Outfit', fontSize: 13, resize: 'none', outline: 'none' }} />
                  ) : (
                    <p style={{ fontSize: 13, fontFamily: 'Outfit', color: 'var(--text-secondary)', background: 'var(--bg-subtle)', borderRadius: 10, padding: '8px 12px', lineHeight: 1.5 }}>
                      {editDescription}
                    </p>
                  )}
                </div>
              )}

              {/* Linked Cliente */}
              {isLocal && (linkedCliente || isEditing) && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontFamily: 'Outfit', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>
                    <Link2 size={10} style={{ display: 'inline', marginRight: 4 }} />
                    Buyer Collegato
                  </p>
                  {isEditing ? (
                    <select value={editClienteId} onChange={e => setEditClienteId(e.target.value)}
                      style={{ width: '100%', background: 'var(--bg-subtle)', border: 'none', borderRadius: 8, padding: '8px 10px', fontFamily: 'Outfit', fontSize: 13, outline: 'none' }}>
                      <option value="">Nessuno</option>
                      {clienti.map(c => <option key={c.id} value={c.id}>{c.nome} {c.cognome}</option>)}
                    </select>
                  ) : linkedCliente ? (
                    <p style={{ fontSize: 13, fontFamily: 'Outfit', color: 'var(--text-primary)', background: 'var(--bg-subtle)', borderRadius: 8, padding: '6px 10px' }}>
                      👤 {linkedCliente.nome} {linkedCliente.cognome}
                    </p>
                  ) : null}
                </div>
              )}

              {/* Linked Notizia */}
              {isLocal && (linkedNotizia || isEditing) && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontFamily: 'Outfit', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>
                    Notizia Collegata
                  </p>
                  {isEditing ? (
                    <select value={editNotiziaId} onChange={e => setEditNotiziaId(e.target.value)}
                      style={{ width: '100%', background: 'var(--bg-subtle)', border: 'none', borderRadius: 8, padding: '8px 10px', fontFamily: 'Outfit', fontSize: 13, outline: 'none' }}>
                      <option value="">Nessuna</option>
                      {notizie.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                    </select>
                  ) : linkedNotizia ? (
                    <p style={{ fontSize: 13, fontFamily: 'Outfit', color: 'var(--text-primary)', background: 'var(--bg-subtle)', borderRadius: 8, padding: '6px 10px' }}>
                      🏠 {linkedNotizia.name}
                    </p>
                  ) : null}
                </div>
              )}

              {/* Google Calendar description */}
              {isGoogle && event.originalData?.description && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontFamily: 'Outfit', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>Note</p>
                  <p style={{ fontSize: 13, fontFamily: 'Outfit', color: 'var(--text-secondary)', background: 'var(--bg-subtle)', borderRadius: 10, padding: '8px 12px', lineHeight: 1.5 }}>
                    {event.originalData.description}
                  </p>
                </div>
              )}

              {/* Color picker for tasks */}
              {isTask && isEditing && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontFamily: 'Outfit', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>Colore</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {COLORS.map(c => (
                      <button key={c} type="button"
                        onClick={() => updateAppointment({ id: event.id, card_color: c })}
                        style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: event.originalData?.card_color === c ? '2px solid #1A1A18' : '1px solid rgba(0,0,0,0.1)', cursor: 'pointer' }}
                      />
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Actions */}
            <div style={{ padding: '12px 24px 20px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: 8 }}>
              {isLocal && (
                <button onClick={handleToggleComplete}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '10px 16px', borderRadius: 999, cursor: 'pointer',
                    background: event.originalData?.completed ? '#F0FFF4' : 'var(--bg-subtle)',
                    border: `1px solid ${event.originalData?.completed ? '#6DC88A' : 'var(--border-light)'}`,
                    color: event.originalData?.completed ? '#2D8A4E' : 'var(--text-primary)',
                    fontFamily: 'Outfit', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}
                >
                  {event.originalData?.completed ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                  {event.originalData?.completed ? 'Riapri' : isTask ? 'Completa task' : 'Segna completato'}
                </button>
              )}

              {isLocal && (
                <button onClick={handleDelete}
                  style={{ width: 44, height: 44, borderRadius: '50%', background: '#FEF2F2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Trash2 size={17} style={{ color: '#E57373' }} />
                </button>
              )}

              {isGoogle && event.originalData?.htmlLink && (
                <a href={event.originalData.htmlLink} target="_blank" rel="noopener noreferrer"
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '10px 16px', borderRadius: 999,
                    background: 'var(--bg-subtle)', border: '1px solid var(--border-light)',
                    color: 'var(--text-primary)', fontFamily: 'Outfit', fontWeight: 700,
                    fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em',
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={15} />
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
