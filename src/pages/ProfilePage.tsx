import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Mail, 
  MapPin, 
  Shield, 
  Camera, 
  Check, 
  X,
  Save,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/src/hooks/useAuth";
import { useProfiles } from "@/src/hooks/useProfiles";
import { cn } from "@/src/lib/utils";

const EMOJI_GRID = [
  '👤','👨💼','👩💼','🧑💼','👨💻','👩💻','🧑💻',
  '🏠','🏢','🔑','💼','📈','📊','🗂️',
  '🌟','⭐','✨','🔥','💎','🎯','🚀',
  '🏆','🥇','🤝','🌍','🌺','🦋','🎨',
  '🏄','🧘','🎭','🎪','🌈','🦚','🐝'
];

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { updateProfile, isLoading: isProfilesLoading } = useProfiles();
  
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    sede: user?.sede || '',
    avatar_emoji: user?.avatar_emoji || '👤'
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        sede: user.sede || '',
        avatar_emoji: user.avatar_emoji || '👤'
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await new Promise<void>((resolve, reject) => {
        updateProfile(
          { userId: user.user_id || user.id, updates: formData },
          {
            onSuccess: () => {
              refreshUser(formData);
              toast.success('Profilo salvato');
              resolve();
            },
            onError: (err) => reject(err)
          }
        );
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Errore nel salvataggio del profilo');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--bg-page)] p-6 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white border border-[var(--border-light)] rounded-[24px] p-8 shadow-xl shadow-black/5 flex flex-col items-center gap-8"
      >
        {/* Avatar Section */}
        <div className="relative group">
          <div className="w-24 h-24 rounded-full bg-[var(--bg-subtle)] border-2 border-[var(--border-light)] flex items-center justify-center text-[48px] shadow-inner">
            {formData.avatar_emoji}
          </div>
          <button 
            onClick={() => setIsEditingAvatar(!isEditingAvatar)}
            className="absolute bottom-0 right-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          >
            <Camera size={14} />
          </button>

          <AnimatePresence>
            {isEditingAvatar && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-4 bg-white border border-[var(--border-light)] rounded-[16px] p-4 shadow-2xl z-50 w-64"
              >
                <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-light)' }}>
                  <p style={{ fontSize: 10, fontFamily: 'Outfit', fontWeight: 600, 
                    textTransform: 'uppercase', letterSpacing: '0.08em', 
                    color: 'var(--text-muted)', marginBottom: 6 }}>
                    Scrivi un emoji
                  </p>
                  <input
                    type="text"
                    placeholder="Es: 🌺 🦋 🎨 🏄"
                    maxLength={4}
                    style={{
                      width: '100%', background: 'var(--bg-subtle)', border: 'none',
                      borderRadius: 8, padding: '8px 10px', fontFamily: 'Outfit',
                      fontSize: 20, outline: 'none', textAlign: 'center',
                    }}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      if (val) {
                        setFormData({ ...formData, avatar_emoji: val });
                      }
                    }}
                  />
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {EMOJI_GRID.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setFormData({ ...formData, avatar_emoji: emoji });
                        setIsEditingAvatar(false);
                      }}
                      className={cn(
                        "w-10 h-10 flex items-center justify-center text-[20px] rounded-lg hover:bg-[var(--bg-subtle)] transition-colors",
                        formData.avatar_emoji === emoji && "bg-[var(--bg-subtle)] ring-1 ring-black/10"
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info Section */}
        <div className="w-full flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-outfit font-bold uppercase tracking-widest text-[var(--text-muted)] ml-1">
              Nome Completo
            </label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input 
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full bg-[var(--bg-subtle)] border-0 rounded-[14px] py-3.5 pl-11 pr-4 font-outfit text-[15px] font-medium outline-none focus:ring-1 focus:ring-black/10 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-outfit font-bold uppercase tracking-widest text-[var(--text-muted)] ml-1">
              Sede di Riferimento
            </label>
            <div className="relative">
              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input 
                type="text"
                value={formData.sede}
                onChange={(e) => setFormData({ ...formData, sede: e.target.value })}
                className="w-full bg-[var(--bg-subtle)] border-0 rounded-[14px] py-3.5 pl-11 pr-4 font-outfit text-[15px] font-medium outline-none focus:ring-1 focus:ring-black/10 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-outfit font-bold uppercase tracking-widest text-[var(--text-muted)] ml-1">
              Ruolo Aziendale
            </label>
            <div className="relative">
              <Shield size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <div className="w-full bg-[var(--bg-subtle)] border-0 rounded-[14px] py-3.5 pl-11 pr-4 font-outfit text-[15px] font-bold text-[var(--text-primary)] opacity-60 cursor-not-allowed">
                {user?.role?.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-outfit font-bold uppercase tracking-widest text-[var(--text-muted)] ml-1">
              Email Google
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <div className="w-full bg-[var(--bg-subtle)] border-0 rounded-[14px] py-3.5 pl-11 pr-4 font-outfit text-[15px] font-medium text-[var(--text-primary)] opacity-60 cursor-not-allowed">
                {user?.email}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-black text-white h-14 rounded-full font-outfit font-bold text-[14px] uppercase tracking-[0.2em] shadow-xl shadow-black/10 hover:bg-black/80 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          Salva Modifiche
        </button>
      </motion.div>
    </div>
  );
}
