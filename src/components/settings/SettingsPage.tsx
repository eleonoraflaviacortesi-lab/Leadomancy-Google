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
  CheckCircle2,
  GripVertical,
  Plus,
  Target
} from "lucide-react";
import { useAuth } from "@/src/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { clearHeaderCache, updateRow, findRowIndex, SHEETS } from "@/src/lib/googleSheets";
import { UserRole } from "@/src/types";
import { useKanbanColumns } from "@/src/hooks/useKanbanColumns";
import { useClientKanbanColumns } from "@/src/hooks/useClientKanbanColumns";
import { useBannerSettings } from "@/src/hooks/useBannerSettings";
import { useSedeTargets } from "@/src/hooks/useSedeTargets";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";

const KANBAN_COLOR_PALETTE = [
  '#C0C8D8', '#C8B8F5', '#B8E0C8', '#F5E642', '#6DC88A', '#F5C842', '#F5A0B0', '#1A1A18',
  '#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#6b7280',
  '#1e40af', '#166534', '#6b21a8', '#9a3412', '#991b1b', '#3730a3', '#86198f', '#374151',
  '#60a5fa', '#4ade80', '#c084fc', '#fbbf24', '#f87171', '#818cf8', '#f472b6', '#9ca3af',
  '#93c5fd', '#86efac', '#d8b4fe', '#fcd34d', '#fca5a5', '#a5b4fc', '#f9a8d4', '#d1d5db'
];

const RoleSelector = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const roles: { value: UserRole; label: string; desc: string }[] = [
    { value: 'agente', label: 'Agente', desc: 'Vede solo le proprie notizie e buyers' },
    { value: 'coordinatore', label: 'Coordinatore', desc: 'Vede tutte le notizie della sede supervisionata' },
    { value: 'admin', label: 'Admin', desc: 'Accesso completo a tutte le sedi' },
  ];

  const handleRoleChange = async (newRole: UserRole) => {
    if (!user || saving) return;
    setSaving(true);
    try {
      const rowIndex = await findRowIndex(SHEETS.users, user.user_id || user.id);
      if (rowIndex) {
        await updateRow(SHEETS.users, rowIndex, { role: newRole });
        await queryClient.invalidateQueries({ queryKey: ['user-profile'] });
        toast.success('Ruolo aggiornato — ricarica la pagina');
      }
    } catch {
      toast.error('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {roles.map(r => (
        <button
          key={r.value}
          onClick={() => handleRoleChange(r.value)}
          disabled={saving}
          className={cn(
            "flex items-start gap-4 p-4 rounded-xl border text-left transition-all",
            user?.role === r.value
              ? "bg-[#1A1A18] border-transparent text-white"
              : "bg-white border-[var(--border-light)] hover:border-[var(--border-medium)]"
          )}
        >
          <div className={cn(
            "w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5",
            user?.role === r.value ? "border-white bg-white" : "border-[var(--border-medium)]"
          )}>
            {user?.role === r.value && (
              <div className="w-full h-full rounded-full bg-[#1A1A18] scale-50" />
            )}
          </div>
          <div>
            <p className={cn("font-outfit font-bold text-[13px]", user?.role === r.value ? "text-white" : "text-[var(--text-primary)]")}>
              {r.label}
            </p>
            <p className={cn("font-outfit text-[11px] mt-0.5", user?.role === r.value ? "text-white/60" : "text-[var(--text-muted)]")}>
              {r.desc}
            </p>
          </div>
        </button>
      ))}
      <p className="text-[10px] font-outfit text-[var(--text-muted)] text-center">
        Dopo il cambio ruolo, ricarica la pagina per applicare le modifiche.
      </p>
    </div>
  );
};

const KanbanColumnManager = ({ useHook }: { useHook: any }) => {
  const { columns, addColumn, updateColumn, deleteColumn, reorderColumns } = useHook();
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const items = columns.map((c: any) => c.id);
    const draggedIdx = items.indexOf(draggedId);
    const targetIdx = items.indexOf(targetId);

    const newOrder = [...items];
    newOrder.splice(draggedIdx, 1);
    newOrder.splice(targetIdx, 0, draggedId);

    reorderColumns(newOrder);
    setDraggedId(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        {columns.map((col: any) => (
          <div 
            key={col.id}
            draggable
            onDragStart={(e) => handleDragStart(e, col.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            className={cn(
              "flex items-center gap-3 p-3 bg-white border border-[var(--border-light)] rounded-xl shadow-sm transition-all",
              draggedId === col.id ? "opacity-50" : "opacity-100"
            )}
          >
            <div className="cursor-grab active:cursor-grabbing text-[var(--text-muted)]">
              <GripVertical size={16} />
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setOpenColorPicker(openColorPicker === col.id ? null : col.id)}
                className="w-5 h-5 rounded-full border border-black/5 shadow-inner"
                style={{ backgroundColor: col.color }}
              />
              {openColorPicker === col.id && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenColorPicker(null)} />
                  <div className="absolute left-0 top-full mt-2 p-2 bg-white border border-[var(--border-light)] rounded-xl shadow-xl grid grid-cols-8 gap-1 w-[200px] z-50">
                    {KANBAN_COLOR_PALETTE.map(color => (
                      <button
                        key={color}
                        onClick={() => {
                          updateColumn({ id: col.id, color });
                          setOpenColorPicker(null);
                        }}
                        className="w-5 h-5 rounded-full border border-black/5 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex-1">
              {editingId === col.id ? (
                <input
                  autoFocus
                  className="w-full bg-transparent font-outfit font-bold text-[14px] outline-none"
                  defaultValue={col.label}
                  onBlur={(e) => {
                    updateColumn({ id: col.id, label: e.target.value });
                    setEditingId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateColumn({ id: col.id, label: (e.target as HTMLInputElement).value });
                      setEditingId(null);
                    }
                  }}
                />
              ) : (
                <span 
                  className="font-outfit font-bold text-[14px] text-[var(--text-primary)] cursor-text"
                  onClick={() => col.key !== 'taken' && setEditingId(col.id)}
                >
                  {col.label}
                </span>
              )}
            </div>

            {col.key !== 'taken' && (
              <button 
                onClick={() => deleteColumn(col.id)}
                className="p-2 text-[var(--rose-fg)] hover:bg-[var(--rose-bg)] rounded-full transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <input 
          type="text"
          placeholder="Nuova colonna..."
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          className="flex-1 bg-white border border-[var(--border-light)] rounded-full px-4 py-2 text-[13px] font-outfit outline-none focus:ring-1 focus:ring-black/10"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newLabel.trim()) {
              addColumn({ label: newLabel, color: '#C0C8D8' });
              setNewLabel("");
            }
          }}
        />
        <button 
          onClick={() => {
            if (newLabel.trim()) {
              addColumn({ label: newLabel, color: '#C0C8D8' });
              setNewLabel("");
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full font-outfit font-bold text-[12px] uppercase hover:bg-black/80 transition-all"
        >
          <Plus size={16} />
          Aggiungi
        </button>
      </div>
    </div>
  );
};

const SedeTargetsEditor = () => {
  const { targets, isLoading, updateTargets } = useSedeTargets();
  const [localTargets, setLocalTargets] = useState({
    contatti_target: 0,
    notizie_target: 0,
    incarichi_target: 0,
    acquisizioni_target: 0,
    appuntamenti_target: 0,
    vendite_target: 0,
    fatturato_target: 0,
    trattative_chiuse_target: 0,
  });
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (targets) {
      setLocalTargets({
        contatti_target: Number(targets.contatti_target) || 0,
        notizie_target: Number(targets.notizie_target) || 0,
        incarichi_target: Number(targets.incarichi_target) || 0,
        acquisizioni_target: Number(targets.acquisizioni_target) || 0,
        appuntamenti_target: Number(targets.appuntamenti_target) || 0,
        vendite_target: Number(targets.vendite_target) || 0,
        fatturato_target: Number(targets.fatturato_target) || 0,
        trattative_chiuse_target: Number(targets.trattative_chiuse_target) || 0,
      });
      setIsDirty(false);
    }
  }, [targets]);

  const fields = [
    { key: 'contatti_target', label: 'Contatti', icon: '👥' },
    { key: 'notizie_target', label: 'Notizie', icon: '🏠' },
    { key: 'incarichi_target', label: 'Incarichi', icon: '📋' },
    { key: 'acquisizioni_target', label: 'Acquisizioni', icon: '🤝' },
    { key: 'appuntamenti_target', label: 'Appuntamenti', icon: '📅' },
    { key: 'vendite_target', label: 'Vendite', icon: '✅' },
    { key: 'fatturato_target', label: 'Fatturato Annuale (€)', icon: '💰', isCurrency: true, isAnnual: true },
    { key: 'trattative_chiuse_target', label: 'Trattative Chiuse', icon: '🏆' },
  ];

  const handleChange = (key: string, value: number) => {
    setLocalTargets(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    updateTargets(localTargets);
    setIsDirty(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-black/10 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  const now = new Date();
  const monthLabel = now.toLocaleString('it-IT', { month: 'long', year: 'numeric' });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="font-outfit text-[12px] text-[var(--text-muted)] capitalize">{monthLabel}</p>
        {isDirty && (
          <button
            onClick={handleSave}
            className="h-8 px-4 bg-[#1A1A18] text-white rounded-full font-outfit font-bold text-[11px] uppercase tracking-wider hover:opacity-90 transition-all"
          >
            Salva
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-2">
        {fields.map(field => (
          <div
            key={field.key}
            className="flex items-center gap-4 p-3 bg-white border border-[var(--border-light)] rounded-xl"
          >
            <span className="text-[18px] w-8 text-center flex-shrink-0">{field.icon}</span>
            <span className="font-outfit font-medium text-[13px] text-[var(--text-primary)] flex-1">
              {field.label}
            </span>
            <div className="flex items-center gap-2">
              {(field as any).isAnnual && (
                <span className="font-outfit text-[10px] text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-subtle)] px-2 py-0.5 rounded-full">
                  annuale
                </span>
              )}
              {field.isCurrency && (
                <span className="font-outfit text-[12px] text-[var(--text-muted)]">€</span>
              )}
              <input
                type="number"
                value={(localTargets as any)[field.key]}
                onChange={e => handleChange(field.key, Number(e.target.value))}
                className="w-28 h-8 bg-[var(--bg-subtle)] border border-[var(--border-light)] rounded-lg px-3 text-[13px] font-outfit font-bold text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-black/10 text-right"
                min={0}
              />
            </div>
          </div>
        ))}
      </div>
      {isDirty && (
        <button
          onClick={handleSave}
          className="w-full h-10 bg-[#1A1A18] text-white rounded-full font-outfit font-bold text-[12px] uppercase tracking-wider hover:opacity-90 transition-all"
        >
          Salva Obiettivi
        </button>
      )}
    </div>
  );
};

const BannerTickerSettings = () => {
  const { settings, updateSettings, isLoading } = useBannerSettings();
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    if (!isLoading) setLocalSettings(settings);
  }, [settings, isLoading]);

  if (isLoading) return null;

  const handleChange = (field: keyof typeof settings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white border border-[var(--border-light)] rounded-[14px] shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Testo 1</label>
          <input 
            type="text"
            value={localSettings.text1}
            onChange={(e) => handleChange('text1', e.target.value)}
            className="bg-[var(--bg-subtle)] border-0 rounded-lg px-3 py-2 text-[13px] font-outfit outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Testo 2</label>
          <input 
            type="text"
            value={localSettings.text2}
            onChange={(e) => handleChange('text2', e.target.value)}
            className="bg-[var(--bg-subtle)] border-0 rounded-lg px-3 py-2 text-[13px] font-outfit outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Testo 3</label>
          <input 
            type="text"
            value={localSettings.text3}
            onChange={(e) => handleChange('text3', e.target.value)}
            className="bg-[var(--bg-subtle)] border-0 rounded-lg px-3 py-2 text-[13px] font-outfit outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Testo 4</label>
          <input 
            type="text"
            value={localSettings.text4}
            onChange={(e) => handleChange('text4', e.target.value)}
            className="bg-[var(--bg-subtle)] border-0 rounded-lg px-3 py-2 text-[13px] font-outfit outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Colore Sfondo</label>
          <div className="flex items-center gap-2">
            <input 
              type="color"
              value={localSettings.bgColor}
              onChange={(e) => handleChange('bgColor', e.target.value)}
              className="w-8 h-8 rounded border-0 p-0 overflow-hidden cursor-pointer"
            />
            <span className="text-[12px] font-mono uppercase">{localSettings.bgColor}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Colore Testo</label>
          <div className="flex items-center gap-2">
            <input 
              type="color"
              value={localSettings.textColor}
              onChange={(e) => handleChange('textColor', e.target.value)}
              className="w-8 h-8 rounded border-0 p-0 overflow-hidden cursor-pointer"
            />
            <span className="text-[12px] font-mono uppercase">{localSettings.textColor}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Velocità (secondi per loop)</label>
          <input 
            type="number"
            value={localSettings.speed}
            onChange={(e) => handleChange('speed', parseInt(e.target.value))}
            className="bg-[var(--bg-subtle)] border-0 rounded-lg px-3 py-2 text-[13px] font-outfit outline-none"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Anteprima</label>
        <div 
          className="h-10 rounded-lg flex items-center px-4 gap-8 overflow-hidden font-outfit font-bold text-[12px] uppercase tracking-wider"
          style={{ backgroundColor: localSettings.bgColor, color: localSettings.textColor }}
        >
          <span>{localSettings.text1.replace('{remaining}', '150.000').replace('{target}', '500.000').replace('{fatturatoCredito}', '350.000')}</span>
          <span>{localSettings.text2}</span>
          <span>{localSettings.text3}</span>
          <span>{localSettings.text4}</span>
        </div>
      </div>

      <button 
        onClick={() => {
          updateSettings(localSettings);
          toast.success("Impostazioni banner salvate");
        }}
        className="mt-2 w-full py-3 bg-black text-white rounded-full font-outfit font-bold text-[12px] uppercase hover:bg-black/80 transition-all"
      >
        Salva impostazioni banner
      </button>
    </div>
  );
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
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-[var(--border-light)] rounded-[14px] shadow-sm">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--text-primary)] shrink-0">
        <Icon size={20} />
      </div>
      <div className="flex flex-col">
        <span className="font-outfit font-bold text-[14px] text-[var(--text-primary)]">{label}</span>
        {description && <span className="text-[11px] text-[var(--text-muted)] font-medium">{description}</span>}
      </div>
    </div>
    <div className="flex justify-end sm:block">
      {action}
    </div>
  </div>
);

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

  return (
    <div className="flex flex-col gap-4 pb-6 w-full px-4 sm:px-0">
      {/* Header Section */}
      <div className="flex flex-col">
        <p className="text-[10px] sm:text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest mb-1 mt-4 sm:mt-6">
          ALTAIR / Impostazioni
        </p>
        <h1 className="text-[24px] sm:text-[28px] font-semibold tracking-tight text-[var(--text-primary)] mb-0">
          Impostazioni
        </h1>
      </div>

      <div className="flex flex-col gap-6">
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
        </Section>

        {/* RUOLO ACCOUNT */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center">
              <Shield size={18} className="text-[var(--text-primary)]" />
            </div>
            <div>
              <h2 className="font-outfit font-bold text-[15px] text-[var(--text-primary)]">Ruolo Account</h2>
              <p className="font-outfit text-[11px] text-[var(--text-muted)]">Determina cosa puoi vedere nell'app</p>
            </div>
          </div>
          <RoleSelector />
        </div>

        {/* COLONNE KANBAN — NOTIZIE */}
        <Section title="COLONNE KANBAN — NOTIZIE">
          <KanbanColumnManager useHook={useKanbanColumns} />
        </Section>

        {/* COLONNE KANBAN — BUYERS */}
        <Section title="COLONNE KANBAN — BUYERS">
          <KanbanColumnManager useHook={useClientKanbanColumns} />
        </Section>

        {/* BANNER TICKER */}
        <Section title="BANNER TICKER">
          <BannerTickerSettings />
        </Section>

        {/* Obiettivi Sede */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center">
              <Target size={18} className="text-[var(--text-primary)]" />
            </div>
            <div>
              <h2 className="font-outfit font-bold text-[15px] text-[var(--text-primary)]">
                Obiettivi Sede
              </h2>
              <p className="font-outfit text-[11px] text-[var(--text-muted)]">
                Target mensili per la tua sede
              </p>
            </div>
          </div>
          <SedeTargetsEditor />
        </div>

        <div className="flex flex-col items-center gap-2 py-6">
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-2">
          <svg viewBox="0 0 24 24" fill="white" style={{ width: 16, height: 16 }}>
            <path d="M12 1 L13.5 8.5 L20.5 6 L16 12 L22 14.5 L15 15.5 L17 22.5 L12 18 L7 22.5 L9 15.5 L2 14.5 L8 12 L3.5 6 L10.5 8.5 Z" />
          </svg>
          </div>
          <span className="font-outfit font-bold text-[14px] uppercase tracking-widest">LEADOMANCY</span>
          <span className="text-[11px] font-outfit font-medium text-[var(--text-muted)]">Version 1.0.0 — Build 2026.03.25</span>
        </div>
      </div>
    </div>
  );
};
