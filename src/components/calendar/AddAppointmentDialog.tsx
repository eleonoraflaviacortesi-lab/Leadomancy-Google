import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search, Check, Calendar as CalendarIcon, Clock, MapPin, User, Building2, ChevronDown, Save } from "lucide-react";
import { useAppointments } from "@/src/hooks/useAppointments";
import { useClienti } from "@/src/hooks/useClienti";
import { useNotizie } from "@/src/hooks/useNotizie";
import { Appointment, Cliente } from "@/src/types";
import { GoogleCalendar } from "@/src/hooks/useGoogleCalendar";
import { format } from "date-fns";
import { cn } from "@/src/lib/utils";

interface AddAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
  initialStartTime?: string;
  initialEndTime?: string;
  calendars?: GoogleCalendar[];
  defaultType?: 'visit' | 'meeting' | 'call' | 'other' | 'task';
}

const AppointmentInput = ({ label, icon: Icon, ...props }: any) => (
  <div className="flex flex-col gap-2">
    <label className="font-outfit font-bold text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)] flex items-center gap-2 px-1">
      {Icon && <Icon size={12} />}
      {label}
    </label>
    <input
      {...props}
      className="w-full h-12 bg-[var(--bg-subtle)] border border-[var(--border-light)] rounded-[14px] px-4 text-[14px] font-outfit font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:ring-2 focus:ring-[var(--text-primary)]/10 transition-all hover:border-[var(--border-medium)] shadow-sm"
    />
  </div>
);

export const AddAppointmentDialog: React.FC<AddAppointmentDialogProps> = ({ 
  isOpen, 
  onClose, 
  initialDate,
  initialStartTime,
  initialEndTime,
  calendars = [],
  defaultType = 'visit'
}) => {
  const { addAppointment } = useAppointments();
  const { clienti } = useClienti();
  const { notizie } = useNotizie();

  const [formData, setFormData] = useState<Partial<Appointment>>({
    title: '',
    description: '',
    date: initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    time: initialStartTime || '10:00',
    start_time: '', 
    end_time: '',   
    location: '',
    cliente_id: '',
    notizia_id: '',
    completed: false,
    type: defaultType
  });

  const [startTime, setStartTime] = useState(initialStartTime || '10:00');
  const [endTime, setEndTime] = useState(initialEndTime || '11:00');
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('primary');
  const [clientSearch, setClientSearch] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [notiziaSearch, setNotiziaSearch] = useState('');
  const [isNotiziaDropdownOpen, setIsNotiziaDropdownOpen] = useState(false);

  // Update state when props change
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        date: initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      }));
      setStartTime(initialStartTime || '10:00');
      setEndTime(initialEndTime || '11:00');
    }
  }, [isOpen, initialDate, initialStartTime, initialEndTime]);

  const filteredClienti = useMemo(() => {
    if (!clientSearch) return clienti.slice(0, 10);
    const s = clientSearch.toLowerCase();
    return clienti.filter(c => 
      `${c.nome} ${c.cognome}`.toLowerCase().includes(s)
    ).slice(0, 10);
  }, [clienti, clientSearch]);

  const filteredNotizie = useMemo(() => {
    if (!notiziaSearch) return notizie.slice(0, 10);
    const s = notiziaSearch.toLowerCase();
    return notizie.filter(n => 
      n.name.toLowerCase().includes(s)
    ).slice(0, 10);
  }, [notizie, notiziaSearch]);

  const selectedClient = useMemo(() => 
    clienti.find(c => c.id === formData.cliente_id),
  [clienti, formData.cliente_id]);

  const selectedNotizia = useMemo(() => 
    notizie.find(n => n.id === formData.notizia_id),
  [notizie, formData.notizia_id]);

  const isTask = formData.type === 'task';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date) return;

    // Combine date and time for start_time and end_time
    let start, end;
    start = new Date(`${formData.date}T${startTime}:00`);
    if (isTask) {
      end = new Date(start.getTime() + 30 * 60000); // +30 mins
    } else {
      end = new Date(`${formData.date}T${endTime}:00`);
    }

    addAppointment({
      ...formData,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      time: startTime, // Legacy field
      calendar_id: isTask ? 'task' : selectedCalendarId
    });

    onClose();
    // Reset form
    setFormData({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      location: '',
      cliente_id: '',
      completed: false,
      type: 'visit'
    });
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
            className="absolute inset-0 bg-black/25"
          />

          <motion.div
            initial={{ scale: 0.97, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-[var(--border-light)]">
              <div className="flex flex-col gap-1">
                <span className="font-outfit text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Calendario
                </span>
                <h2 className="font-outfit font-bold text-[22px] tracking-[-0.5px] text-[var(--text-primary)]">
                  {isTask ? "Nuova Task" : "Nuovo Appuntamento"}
                </h2>
              </div>
              <button 
                onClick={onClose} 
                className="w-9 h-9 flex items-center justify-center bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
              {/* Type Selector */}
              <div className="flex p-1 bg-[var(--bg-subtle)] rounded-full w-fit">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'visit' })}
                  className={cn(
                    "h-8 px-5 rounded-full font-outfit text-[12px] font-bold uppercase tracking-[0.05em] transition-all",
                    !isTask ? "bg-white text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  )}
                >
                  Appuntamento
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'task' })}
                  className={cn(
                    "h-8 px-5 rounded-full font-outfit text-[12px] font-bold uppercase tracking-[0.05em] transition-all",
                    isTask ? "bg-white text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  )}
                >
                  Task / Promemoria
                </button>
              </div>

              <AppointmentInput
                label="Titolo"
                required
                placeholder="Es: Visita Villa Olmo"
                value={formData.title}
                onChange={(e: any) => setFormData({ ...formData, title: e.target.value })}
              />

              <div className="flex flex-col gap-2">
                <label className="font-outfit font-bold text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                  Descrizione
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Dettagli dell'appuntamento..."
                  className="w-full bg-[var(--bg-subtle)] border-none rounded-[12px] p-4 text-[14px] font-outfit outline-none h-28 resize-none placeholder:text-[var(--text-muted)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <AppointmentInput
                  label="Data"
                  type="date"
                  required
                  icon={CalendarIcon}
                  value={formData.date}
                  onChange={(e: any) => setFormData({ ...formData, date: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <AppointmentInput
                    label={isTask ? "Ora" : "Inizio"}
                    type="time"
                    icon={Clock}
                    value={startTime}
                    onChange={(e: any) => setStartTime(e.target.value)}
                  />
                  {!isTask && (
                    <AppointmentInput
                      label="Fine"
                      type="time"
                      value={endTime}
                      onChange={(e: any) => setEndTime(e.target.value)}
                    />
                  )}
                </div>
              </div>

              {!isTask && (
                <>
                  {calendars.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <label className="font-outfit font-bold text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] flex items-center gap-2">
                        <CalendarIcon size={12} />
                        Calendario
                      </label>
                      <div className="relative">
                        <select
                          value={selectedCalendarId}
                          onChange={(e) => setSelectedCalendarId(e.target.value)}
                          className="w-full h-11 bg-[var(--bg-subtle)] border-none rounded-[12px] px-4 text-[14px] font-outfit outline-none appearance-none cursor-pointer"
                        >
                          <option value="primary">Calendario Principale (ALTAIR)</option>
                          {calendars.filter(c => !c.primary).map(c => (
                            <option key={c.id} value={c.id}>{c.summary}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                      </div>
                    </div>
                  )}

                  <AppointmentInput
                    label="Luogo"
                    icon={MapPin}
                    placeholder="Indirizzo o link meeting"
                    value={formData.location}
                    onChange={(e: any) => setFormData({ ...formData, location: e.target.value })}
                  />
                </>
              )}

              {/* Cliente Collegato */}
              <div className="flex flex-col gap-2 relative">
                <label className="font-outfit font-bold text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] flex items-center gap-2">
                  <User size={12} />
                  Cliente Collegato
                </label>
                <div className="relative">
                  <div 
                    className={cn(
                      "w-full h-11 bg-[var(--bg-subtle)] rounded-[12px] px-4 text-[14px] font-outfit flex items-center justify-between cursor-pointer transition-all",
                      isClientDropdownOpen && "ring-1 ring-black/5"
                    )}
                    onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                  >
                    {selectedClient ? (
                      <span className="text-[var(--text-primary)] font-medium">
                        {selectedClient.nome} {selectedClient.cognome}
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)]">Seleziona un cliente...</span>
                    )}
                    <Search size={14} className="text-[var(--text-muted)]" />
                  </div>

                  <AnimatePresence>
                    {isClientDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white border border-[var(--border-light)] rounded-[16px] shadow-[0_10px_40px_rgba(0,0,0,0.12)] z-50 overflow-hidden"
                      >
                        <div className="p-3 border-b border-[var(--border-light)]">
                          <input
                            autoFocus
                            type="text"
                            placeholder="Cerca cliente..."
                            className="w-full h-9 bg-[var(--bg-subtle)] border-none rounded-[8px] px-3 text-[13px] font-outfit outline-none placeholder:text-[var(--text-muted)]"
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredClienti.length > 0 ? (
                            filteredClienti.map(c => (
                              <div
                                key={c.id}
                                className="p-3 px-4 text-[14px] font-outfit hover:bg-[var(--bg-subtle)] cursor-pointer flex items-center justify-between transition-colors"
                                onClick={() => {
                                  setFormData({ ...formData, cliente_id: c.id });
                                  setIsClientDropdownOpen(false);
                                  setClientSearch('');
                                }}
                              >
                                <span>{c.nome} {c.cognome}</span>
                                {formData.cliente_id === c.id && <Check size={14} className="text-black" />}
                              </div>
                            ))
                          ) : (
                            <div className="p-6 text-center text-[13px] text-[var(--text-muted)] font-outfit">
                              Nessun cliente trovato
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Notizia Collegata */}
              <div className="flex flex-col gap-2 relative">
                <label className="font-outfit font-bold text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] flex items-center gap-2">
                  <Building2 size={12} />
                  Notizia Collegata
                </label>
                <div className="relative">
                  <div 
                    className={cn(
                      "w-full h-11 bg-[var(--bg-subtle)] rounded-[12px] px-4 text-[14px] font-outfit flex items-center justify-between cursor-pointer transition-all",
                      isNotiziaDropdownOpen && "ring-1 ring-black/5"
                    )}
                    onClick={() => setIsNotiziaDropdownOpen(!isNotiziaDropdownOpen)}
                  >
                    {selectedNotizia ? (
                      <span className="text-[var(--text-primary)] font-medium">
                        {selectedNotizia.name}
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)]">Seleziona una notizia...</span>
                    )}
                    <Search size={14} className="text-[var(--text-muted)]" />
                  </div>

                  <AnimatePresence>
                    {isNotiziaDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white border border-[var(--border-light)] rounded-[16px] shadow-[0_10px_40px_rgba(0,0,0,0.12)] z-50 overflow-hidden"
                      >
                        <div className="p-3 border-b border-[var(--border-light)]">
                          <input
                            autoFocus
                            type="text"
                            placeholder="Cerca notizia..."
                            className="w-full h-9 bg-[var(--bg-subtle)] border-none rounded-[8px] px-3 text-[13px] font-outfit outline-none placeholder:text-[var(--text-muted)]"
                            value={notiziaSearch}
                            onChange={(e) => setNotiziaSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredNotizie.length > 0 ? (
                            filteredNotizie.map(n => (
                              <div
                                key={n.id}
                                className="p-3 px-4 text-[14px] font-outfit hover:bg-[var(--bg-subtle)] cursor-pointer flex items-center justify-between transition-colors"
                                onClick={() => {
                                  setFormData({ ...formData, notizia_id: n.id });
                                  setIsNotiziaDropdownOpen(false);
                                  setNotiziaSearch('');
                                }}
                              >
                                <span>{n.name}</span>
                                {formData.notizia_id === n.id && <Check size={14} className="text-black" />}
                              </div>
                            ))
                          ) : (
                            <div className="p-6 text-center text-[13px] text-[var(--text-muted)] font-outfit">
                              Nessuna notizia trovata
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Completato Toggle */}
              <div className="flex items-center justify-between mt-2 p-4 bg-[var(--bg-subtle)] rounded-[16px]">
                <span className="text-[13px] font-outfit font-bold uppercase tracking-[0.05em] text-[var(--text-primary)]">
                  Segna come completato
                </span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, completed: !formData.completed })}
                  className={cn(
                    "w-11 h-6 rounded-full transition-all relative",
                    formData.completed ? "bg-black" : "bg-[var(--border-medium)]"
                  )}
                >
                  <motion.div
                    animate={{ x: formData.completed ? 22 : 2 }}
                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                  />
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="mt-4 w-full h-14 bg-[var(--text-primary)] text-white rounded-full font-outfit font-bold text-[13px] uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-lg shadow-[var(--text-primary)]/10 active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <Save size={20} />
                {isTask ? "Aggiungi Task" : "Salva Appuntamento"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
