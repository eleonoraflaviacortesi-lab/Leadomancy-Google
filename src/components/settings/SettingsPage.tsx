import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Moon, 
  Sun, 
  Globe, 
  LogOut, 
  Trash2, 
  Info, 
  Shield, 
  User,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "@/src/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { clearHeaderCache } from "@/src/lib/googleSheets";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";

export const SettingsPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('leadomancy_theme') === 'dark');
  const [language, setLanguage] = useState('IT');

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('leadomancy_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('leadomancy_theme', 'light');
    }
  }, [isDarkMode]);

  const handleClearCache = () => {
    queryClient.clear();
    clearHeaderCache();
    toast.success("Cache svuotata con successo");
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-4">
      <h3 className="font-outfit font-bold text-[12px] uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border-light)] pb-2">
        {title}
      </h3>
      <div className="flex flex-col gap-3">
        {children}
      </div>
    </div>
  );

  const SettingRow = ({ icon: Icon, label, description, action }: any) => (
    <div className="flex items-center justify-between p-4 bg-white border border-[var(--border-light)] rounded-[14px] shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--text-primary)]">
          <Icon size={20} />
        </div>
        <div className="flex flex-col">
          <span className="font-outfit font-bold text-[14px] text-[var(--text-primary)]">{label}</span>
          {description && <span className="text-[11px] text-[var(--text-muted)] font-medium">{description}</span>}
        </div>
      </div>
      {action}
    </div>
  );

  return (
    <div className="flex flex-col gap-8 p-6 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <span className="font-outfit text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
          Leadomancy / Sistema
        </span>
        <h1 className="font-outfit font-semibold text-[28px] tracking-tight text-[var(--text-primary)]">
          Impostazioni
        </h1>
      </div>

      <div className="flex flex-col gap-10">
        {/* PREFERENZE */}
        <Section title="PREFERENZE">
          <SettingRow 
            icon={isDarkMode ? Moon : Sun}
            label="Tema dell'interfaccia"
            description={isDarkMode ? "Modalità Scura attiva" : "Modalità Chiara attiva"}
            action={
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={cn(
                  "w-12 h-6 rounded-full p-1 transition-all flex items-center",
                  isDarkMode ? "bg-black justify-end" : "bg-[var(--border-medium)] justify-start"
                )}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </button>
            }
          />
          <SettingRow 
            icon={Globe}
            label="Lingua dell'applicazione"
            description="Seleziona la lingua per l'interfaccia"
            action={
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-[var(--bg-subtle)] border-0 rounded-full px-4 py-2 text-[12px] font-bold font-outfit outline-none"
              >
                <option value="IT">Italiano (IT)</option>
                <option value="EN">English (EN)</option>
              </select>
            }
          />
        </Section>

        {/* ACCOUNT */}
        <Section title="ACCOUNT">
          <SettingRow 
            icon={User}
            label="Profilo Google"
            description={user?.email}
            action={
              <div className="flex items-center gap-2 text-[var(--sage-fg)] font-outfit font-bold text-[11px] uppercase">
                <CheckCircle2 size={14} />
                Connesso
              </div>
            }
          />
          <SettingRow 
            icon={LogOut}
            label="Disconnetti account"
            description="Esci dalla sessione corrente"
            action={
              <button 
                onClick={signOut}
                className="px-5 py-2 rounded-full font-outfit text-[12px] font-bold uppercase text-[var(--rose-fg)] hover:bg-[var(--rose-bg)] transition-all"
              >
                Esci
              </button>
            }
          />
        </Section>

        {/* APP */}
        <Section title="APP">
          <SettingRow 
            icon={Trash2}
            label="Svuota cache"
            description="Ricarica tutti i dati dai fogli Google"
            action={
              <button 
                onClick={handleClearCache}
                className="px-5 py-2 rounded-full font-outfit text-[12px] font-bold uppercase text-[var(--text-primary)] bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] transition-all"
              >
                Svuota
              </button>
            }
          />
          <div className="flex flex-col items-center gap-2 py-6">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-2">
              <span className="text-white font-bold text-[22px]">L</span>
            </div>
            <span className="font-outfit font-bold text-[14px] uppercase tracking-widest">LEADOMANCY</span>
            <span className="text-[11px] font-outfit font-medium text-[var(--text-muted)]">Version 1.0.0 — Build 2026.03.25</span>
          </div>
        </Section>
      </div>
    </div>
  );
};
