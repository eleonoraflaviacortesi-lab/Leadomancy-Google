import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search, Check, Calendar as CalendarIcon, Clock, MapPin, User } from "lucide-react";
import { useAppointments } from "@/src/hooks/useAppointments";
import { useClienti } from "@/src/hooks/useClienti";
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
}

const AppointmentInput = ({ label, icon: Icon, ...props }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-outfit font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
      {Icon && <Icon size={12} />}
      {label}
    </label>
    <input
      {...props}
      className="w-full bg-[var(--bg-subtle)] border-0 rounded-[10px] p-2.5 px-4 text-[13px] font-outfit outline-none focus:ring-1 focus:ring-black/10 transition-all"
    />
  </div>
);

export const AddAppointmentDialog: React.FC<AddAppointmentDialogProps> = ({ 
  isOpen, 
  onClose, 
  initialDate,
  initialStartTime,
  initialEndTime,
  calendars = []
}) => {
  const { addAppointment } = useAppointments();
  const { clienti } = useClienti();

  const [formData, setFormData] = useState<Partial<Appointment>>({
    title: '',
    description: '',
    date: initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    time: initialStartTime || '10:00',
    start_time: '', 
    end_time: '',   
    location: '',
    cliente_id: '',
    completed: false,
    type: 'visit'
  });

  const [startTime, setStartTime] = useState(initialStartTime || '10:00');
  const [endTime, setEndTime] = useState(initialEndTime || '11:00');
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('primary');
  const [clientSearch, setClientSearch] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

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

  const selectedClient = useMemo(() => 
    clienti.find(c => c.id === formData.cliente_id),
  [clienti, formData.cliente_id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date) return;

    // Combine date and time for start_time and end_time
    const start = new Date(`${formData.date}T${startTime}:00`);
    const end = new Date(`${formData.date}T${endTime}:00`);

    addAppointment({
      ...formData,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      time: startTime, // Legacy field
      calendar_id: selectedCalendarId
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
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--border-light)]">
              <h2 className="font-outfit font-bold text-[16px] uppercase tracking-[0.1em] text-[var(--text-primary)]">
                Nuovo Appuntamento
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">
              <AppointmentInput
                label="Titolo"
                required
                placeholder="Es: Visita Villa Olmo"
                value={formData.title}
                onChange={(e: any) => setFormData({ ...formData, title: e.target.value })}
              />

              {calendars.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-outfit font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarIcon size={12} />
                    Calendario
                  </label>
                  <select
                    value={selectedCalendarId}
                    onChange={(e) => setSelectedCalendarId(e.target.value)}
                    className="w-full bg-[var(--bg-subtle)] border-0 rounded-[10px] p-2.5 px-4 text-[13px] font-outfit outline-none focus:ring-1 focus:ring-black/10 transition-all appearance-none"
                  >
                    <option value="primary">Calendario Principale (Leadomancy)</option>
                    {calendars.filter(c => !c.primary).map(c => (
                      <option key={c.id} value={c.id}>{c.summary}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-outfit font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Descrizione
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Dettagli dell'appuntamento..."
                  className="w-full bg-[var(--bg-subtle)] border-0 rounded-[10px] p-3 px-4 text-[13px] font-outfit outline-none focus:ring-1 focus:ring-black/10 transition-all h-24 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <AppointmentInput
                  label="Data"
                  type="date"
                  icon={CalendarIcon}
                  value={formData.date}
                  onChange={(e: any) => setFormData({ ...formData, date: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <AppointmentInput
                    label="Inizio"
                    type="time"
                    icon={Clock}
                    value={startTime}
                    onChange={(e: any) => setStartTime(e.target.value)}
                  />
                  <AppointmentInput
                    label="Fine"
                    type="time"
                    value={endTime}
                    onChange={(e: any) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <AppointmentInput
                label="Luogo"
                icon={MapPin}
                placeholder="Indirizzo o link meeting"
                value={formData.location}
                onChange={(e: any) => setFormData({ ...formData, location: e.target.value })}
              />

              {/* Cliente Collegato */}
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-[11px] font-outfit font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                  <User size={12} />
                  Cliente Collegato
                </label>
                <div className="relative">
                  <div 
                    className={cn(
                      "w-full bg-[var(--bg-subtle)] rounded-[10px] p-2.5 px-4 text-[13px] font-outfit flex items-center justify-between cursor-pointer",
                      isClientDropdownOpen && "ring-1 ring-black/10"
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
                        className="absolute top-full left-0 right-0 mt-2 bg-white border border-[var(--border-light)] rounded-[12px] shadow-xl z-50 overflow-hidden"
                      >
                        <div className="p-2 border-b border-[var(--border-light)]">
                          <input
                            autoFocus
                            type="text"
                            placeholder="Cerca cliente..."
                            className="w-full bg-[var(--bg-subtle)] border-0 rounded-[6px] p-1.5 px-3 text-[12px] font-outfit outline-none"
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
                                className="p-2.5 px-4 text-[13px] font-outfit hover:bg-[var(--bg-subtle)] cursor-pointer flex items-center justify-between"
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
                            <div className="p-4 text-center text-[12px] text-[var(--text-muted)] font-outfit">
                              Nessun cliente trovato
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Completato Toggle */}
              <div className="flex items-center justify-between mt-2">
                <span className="text-[13px] font-outfit font-medium text-[var(--text-primary)]">
                  Segna come completato
                </span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, completed: !formData.completed })}
                  className={cn(
                    "w-10 h-5 rounded-full transition-colors relative",
                    formData.completed ? "bg-black" : "bg-[var(--bg-subtle)] border border-[var(--border-light)]"
                  )}
                >
                  <motion.div
                    animate={{ x: formData.completed ? 22 : 2 }}
                    className={cn(
                      "absolute top-0.5 w-3.5 h-3.5 rounded-full",
                      formData.completed ? "bg-white" : "bg-[var(--text-muted)]"
                    )}
                  />
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="mt-4 w-full bg-[#1A1A18] text-white py-3.5 rounded-full font-outfit font-bold text-[14px] uppercase tracking-[0.15em] hover:bg-black transition-all shadow-lg active:scale-[0.98]"
              >
                Salva Appuntamento
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
