import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, Calendar, Clock } from "lucide-react";
import { Notizia, NotiziaStatus } from "@/src/types";
import { useNotizie } from "@/src/hooks/useNotizie";
import { NOTIZIA_STATUS_LABELS, NOTIZIA_STATUSES, TIPO_OPTIONS } from "./notizieConfig";
import { cn } from "@/src/lib/utils";

interface AddNotiziaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialStatus?: NotiziaStatus;
}

const EMOJIS = ['📋', '🏠', '🏡', '🏰', '🏛️', '🌳', '⭐', '💎', '🔑', '📍'];

export const AddNotiziaDialog: React.FC<AddNotiziaDialogProps> = ({ isOpen, onClose, initialStatus }) => {
  const { addNotizia } = useNotizie();
  const [formData, setFormData] = useState<Partial<Notizia>>({
    name: '',
    emoji: '🏠',
    zona: '',
    telefono: '',
    type: 'Villa',
    prezzo_richiesto: 0,
    valore: 0,
    is_online: false,
    status: initialStatus || 'new',
    notes: '',
    created_at: new Date().toISOString().split('T')[0],
    reminder_date: '',
    reminder_time: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    addNotizia(formData);
    onClose();
    // Reset form
    setFormData({
      name: '',
      emoji: '🏠',
      zona: '',
      telefono: '',
      type: 'Villa',
      prezzo_richiesto: 0,
      valore: 0,
      is_online: false,
      status: initialStatus || 'new',
      notes: '',
      created_at: new Date().toISOString().split('T')[0],
      reminder_date: '',
      reminder_time: '',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/25"
          />

          {/* Card */}
          <motion.div
            initial={{ scale: 0.97, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div className="flex flex-col gap-1">
                <span className="font-outfit text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Nuovo Inserimento
                </span>
                <h2 className="font-outfit font-bold text-[20px] sm:text-[22px] tracking-[-0.5px] text-[var(--text-primary)]">
                  Aggiungi Notizia
                </h2>
              </div>
              <button 
                onClick={onClose} 
                className="w-9 h-9 flex items-center justify-center bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] rounded-full transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5 sm:gap-6">
              {/* Nome */}
              <div className="flex flex-col gap-2">
                <label className="font-outfit font-bold text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Nome Notizia</label>
                <input
                  required
                  type="text"
                  placeholder="Es: Villa Unifamiliare con Giardino"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-11 bg-[var(--bg-subtle)] border-none rounded-[12px] px-4 text-[14px] font-outfit font-normal text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:ring-1 focus:ring-black/5 transition-all"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData({ ...formData, emoji })}
                      className={cn(
                        "w-9 h-9 flex items-center justify-center rounded-[10px] transition-all text-lg",
                        formData.emoji === emoji ? "bg-[#1A1A18] text-white scale-105 shadow-md" : "bg-[var(--bg-subtle)] hover:bg-[var(--border-light)]"
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zona + Telefono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-outfit font-bold text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Zona</label>
                  <input
                    type="text"
                    value={formData.zona}
                    onChange={(e) => setFormData({ ...formData, zona: e.target.value })}
                    className="w-full h-11 bg-[var(--bg-subtle)] border-none rounded-[12px] px-4 text-[14px] font-outfit outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-outfit font-bold text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Telefono</label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full h-11 bg-[var(--bg-subtle)] border-none rounded-[12px] px-4 text-[14px] font-outfit outline-none"
                  />
                </div>
              </div>

              {/* Tipologia + Stato */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-outfit font-bold text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Tipologia</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full h-11 bg-[var(--bg-subtle)] border-none rounded-[12px] px-4 text-[14px] font-outfit outline-none appearance-none cursor-pointer"
                  >
                    {TIPO_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-outfit font-bold text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Stato</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as NotiziaStatus })}
                    className="w-full h-11 bg-[var(--bg-subtle)] border-none rounded-[12px] px-4 text-[14px] font-outfit outline-none appearance-none cursor-pointer"
                  >
                    {NOTIZIA_STATUSES.map(status => (
                      <option key={status} value={status}>{NOTIZIA_STATUS_LABELS[status]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prezzi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-outfit font-bold text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Prezzo Richiesto</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-outfit text-[var(--text-muted)]">€</span>
                    <input
                      type="number"
                      value={formData.prezzo_richiesto || ''}
                      onChange={(e) => setFormData({ ...formData, prezzo_richiesto: Number(e.target.value) })}
                      className="w-full h-11 bg-[var(--bg-subtle)] border-none rounded-[12px] pl-8 pr-4 text-[14px] font-outfit outline-none"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-outfit font-bold text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Valore Stimato</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-outfit text-[var(--text-muted)]">€</span>
                    <input
                      type="number"
                      value={formData.valore || ''}
                      onChange={(e) => setFormData({ ...formData, valore: Number(e.target.value) })}
                      className="w-full h-11 bg-[var(--bg-subtle)] border-none rounded-[12px] pl-8 pr-4 text-[14px] font-outfit outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Online sui portali */}
              <div className="flex flex-col gap-2">
                <label className="font-outfit font-bold text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Online sui portali</label>
                <div className="flex bg-[var(--bg-subtle)] p-1 rounded-full border border-[var(--border-light)]">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_online: true })}
                    className={cn(
                      "flex-1 h-9 rounded-full font-outfit font-semibold text-[12px] transition-all",
                      formData.is_online ? "bg-[#1A1A18] text-white shadow-sm" : "text-[var(--text-secondary)] hover:bg-black/5"
                    )}
                  >
                    Sì
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_online: false })}
                    className={cn(
                      "flex-1 h-9 rounded-full font-outfit font-semibold text-[12px] transition-all",
                      !formData.is_online ? "bg-[#1A1A18] text-white shadow-sm" : "text-[var(--text-secondary)] hover:bg-black/5"
                    )}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Note */}
              <div className="flex flex-col gap-2">
                <label className="font-outfit font-bold text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Note</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Aggiungi dettagli importanti..."
                  className="w-full bg-[var(--bg-subtle)] border-none rounded-[12px] p-4 text-[14px] font-outfit outline-none h-24 resize-none placeholder:text-[var(--text-muted)]"
                />
              </div>

              {/* Reminder */}
              <div className="flex flex-col gap-2">
                <label className="font-outfit font-bold text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Reminder</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="date"
                      value={formData.reminder_date}
                      onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                      className="w-full h-11 bg-[var(--bg-subtle)] border-none rounded-[12px] pl-10 pr-4 text-[13px] font-outfit outline-none"
                    />
                  </div>
                  <div className="relative">
                    <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="time"
                      value={formData.reminder_time}
                      onChange={(e) => setFormData({ ...formData, reminder_time: e.target.value })}
                      className="w-full h-11 bg-[var(--bg-subtle)] border-none rounded-[12px] pl-10 pr-4 text-[13px] font-outfit outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Data inserimento */}
              <div className="flex flex-col gap-2">
                <label className="font-outfit font-bold text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Data Inserimento</label>
                <input
                  type="date"
                  value={formData.created_at}
                  onChange={(e) => setFormData({ ...formData, created_at: e.target.value })}
                  className="w-full h-11 bg-[var(--bg-subtle)] border-none rounded-[12px] px-4 text-[13px] font-outfit outline-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="mt-4 h-12 bg-[#1A1A18] text-white rounded-full font-outfit font-bold text-[12px] uppercase tracking-[0.15em] hover:opacity-90 transition-all shadow-lg shadow-black/5"
              >
                AGGIUNGI NOTIZIA
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
