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
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-sm bg-white border border-[var(--border-light)] rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-5 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-outfit font-semibold text-[12px] uppercase tracking-wider text-[var(--text-secondary)]">
                NUOVA NOTIZIA
              </h2>
              <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Nome + Emoji */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-outfit font-medium text-[var(--text-muted)] uppercase">Nome</label>
                <input
                  required
                  type="text"
                  placeholder="Nome della notizia..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-[var(--bg-subtle)] border-0 rounded-[8px] p-2 px-3 text-[13px] font-outfit focus:ring-1 focus:ring-black outline-none"
                />
                <div className="flex flex-wrap gap-1 mt-1">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData({ ...formData, emoji })}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-md transition-all",
                        formData.emoji === emoji ? "bg-black text-white scale-110" : "bg-[var(--bg-subtle)] hover:bg-black/5"
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zona + Telefono */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-outfit font-medium text-[var(--text-muted)] uppercase">Zona</label>
                  <input
                    type="text"
                    value={formData.zona}
                    onChange={(e) => setFormData({ ...formData, zona: e.target.value })}
                    className="bg-[var(--bg-subtle)] border-0 rounded-[8px] p-2 px-3 text-[13px] font-outfit outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-outfit font-medium text-[var(--text-muted)] uppercase">Telefono</label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="bg-[var(--bg-subtle)] border-0 rounded-[8px] p-2 px-3 text-[13px] font-outfit outline-none"
                  />
                </div>
              </div>

              {/* Tipologia */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-outfit font-medium text-[var(--text-muted)] uppercase">Tipologia</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="bg-[var(--bg-subtle)] border-0 rounded-[8px] p-2 px-3 text-[13px] font-outfit outline-none appearance-none"
                >
                  {TIPO_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Prezzi */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-outfit font-medium text-[var(--text-muted)] uppercase">Prezzo Richiesto</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[var(--text-muted)]">€</span>
                    <input
                      type="number"
                      value={formData.prezzo_richiesto || ''}
                      onChange={(e) => setFormData({ ...formData, prezzo_richiesto: Number(e.target.value) })}
                      className="w-full bg-[var(--bg-subtle)] border-0 rounded-[8px] p-2 pl-7 text-[13px] font-outfit outline-none"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-outfit font-medium text-[var(--text-muted)] uppercase">Valore Stimato</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[var(--text-muted)]">€</span>
                    <input
                      type="number"
                      value={formData.valore || ''}
                      onChange={(e) => setFormData({ ...formData, valore: Number(e.target.value) })}
                      className="w-full bg-[var(--bg-subtle)] border-0 rounded-[8px] p-2 pl-7 text-[13px] font-outfit outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Online sui portali */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-outfit font-medium text-[var(--text-muted)] uppercase">Online sui portali</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_online: true })}
                    className={cn(
                      "flex-1 h-9 rounded-full font-outfit text-[13px] transition-all",
                      formData.is_online ? "bg-[#1A1A18] text-white" : "bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
                    )}
                  >
                    Sì
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_online: false })}
                    className={cn(
                      "flex-1 h-9 rounded-full font-outfit text-[13px] transition-all",
                      !formData.is_online ? "bg-[#1A1A18] text-white" : "bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
                    )}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Stato */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-outfit font-medium text-[var(--text-muted)] uppercase">Stato</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as NotiziaStatus })}
                  className="bg-[var(--bg-subtle)] border-0 rounded-[8px] p-2 px-3 text-[13px] font-outfit outline-none appearance-none"
                >
                  {NOTIZIA_STATUSES.map(status => (
                    <option key={status} value={status}>{NOTIZIA_STATUS_LABELS[status]}</option>
                  ))}
                </select>
              </div>

              {/* Note */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-outfit font-medium text-[var(--text-muted)] uppercase">Note</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-[var(--bg-subtle)] border-0 rounded-[8px] p-2 px-3 text-[13px] font-outfit outline-none h-20 resize-none"
                />
              </div>

              {/* Reminder */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-outfit font-medium text-[var(--text-muted)] uppercase">Reminder</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="date"
                      value={formData.reminder_date}
                      onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                      className="w-full bg-[var(--bg-subtle)] border-0 rounded-[8px] p-2 pl-9 text-[13px] font-outfit outline-none"
                    />
                  </div>
                  <div className="relative">
                    <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="time"
                      value={formData.reminder_time}
                      onChange={(e) => setFormData({ ...formData, reminder_time: e.target.value })}
                      className="w-full bg-[var(--bg-subtle)] border-0 rounded-[8px] p-2 pl-9 text-[13px] font-outfit outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Data inserimento */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-outfit font-medium text-[var(--text-muted)] uppercase">Data Inserimento</label>
                <input
                  type="date"
                  value={formData.created_at}
                  onChange={(e) => setFormData({ ...formData, created_at: e.target.value })}
                  className="bg-[var(--bg-subtle)] border-0 rounded-[8px] p-2 px-3 text-[13px] font-outfit outline-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="mt-2 h-10 bg-[#1A1A18] text-white rounded-full font-outfit font-medium text-[14px] hover:bg-black transition-all"
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
