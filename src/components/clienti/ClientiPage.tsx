import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LayoutGrid, List, Search, Download, Plus, Undo2, Redo2, Filter, X } from "lucide-react";
import { toast } from "sonner";
import { useClienti } from "@/src/hooks/useClienti";
import { useUndoRedo } from "@/src/hooks/useUndoRedo";
import { ClientiKanban } from "./ClientiKanban";
import { ClientiSheetView } from "./ClientiSheetView";
import { AddClienteDialog } from "./AddClienteDialog";
import { ClienteDetail } from "./ClienteDetail";
import { Cliente, ClienteStatus, ClienteFilters } from "@/src/types";
import { CLIENTE_STATUS_CONFIG, REGIONI_OPTIONS } from "./clienteFormOptions";
import { cn } from "@/src/lib/utils";

export const ClientiPage: React.FC = () => {
  const [filters, setFilters] = useState<ClienteFilters>({});
  const { filteredClienti, isLoading, updateCliente, deleteCliente, addCliente } = useClienti({ filters });
  const { undo, redo, canUndo, canRedo } = useUndoRedo();
  
  const [viewMode, setViewMode] = useState<'kanban' | 'sheet'>(() => {
    return (localStorage.getItem('leadomancy-clienti-view') as 'kanban' | 'sheet') || 'kanban';
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [initialStatus, setInitialStatus] = useState<ClienteStatus | undefined>();
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsAddDialogOpen(true);
    window.addEventListener('leadomancy:open-add-cliente', handler);
    return () => window.removeEventListener('leadomancy:open-add-cliente', handler);
  }, []);

  const toggleViewMode = (mode: 'kanban' | 'sheet') => {
    setViewMode(mode);
    localStorage.setItem('leadomancy-clienti-view', mode);
  };

  const handleClienteClick = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsDetailOpen(true);
  };

  const handleQuickAdd = (status: ClienteStatus) => {
    setInitialStatus(status);
    setIsAddDialogOpen(true);
  };

  const handleExport = () => {
    toast.success("Esportazione buyers avviata...");
  };

  const handleDuplicate = async (cliente: Cliente) => {
    const { id, created_at, updated_at, ...rest } = cliente;
    addCliente({
      ...rest,
      nome: `${rest.nome} (Copia)`,
      status: 'new'
    });
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header Section */}
      <div className="flex flex-col gap-4 pb-0">
        <div className="flex flex-col">
          <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            Leadomancy / Buyers
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.5px', color: 'var(--text-primary)', marginBottom: 0 }}>
            Luxury Buyers
          </h1>
        </div>

        {/* Controls Row */}
        <div className="flex flex-wrap items-center gap-4">
          {/* View Toggle */}
          <div className="flex bg-[var(--bg-subtle)] p-1 rounded-full border border-[var(--border-light)]">
            <button
              onClick={() => toggleViewMode('kanban')}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-full font-outfit text-[13px] transition-all",
                viewMode === 'kanban' ? "bg-[#1A1A18] text-white shadow-sm" : "text-[var(--text-secondary)] hover:bg-black/5"
              )}
            >
              <LayoutGrid size={14} />
              Kanban
            </button>
            <button
              onClick={() => toggleViewMode('sheet')}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-full font-outfit text-[13px] transition-all",
                viewMode === 'sheet' ? "bg-[#1A1A18] text-white shadow-sm" : "text-[var(--text-secondary)] hover:bg-black/5"
              )}
            >
              <List size={14} />
              Foglio
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Cerca nome, cognome, ref..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full bg-[var(--bg-subtle)] border-0 rounded-full py-2.5 pl-11 pr-4 text-[13px] font-outfit outline-none focus:ring-1 focus:ring-black/10 transition-all"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setIsFilterSidebarOpen(!isFilterSidebarOpen)}
            className={cn(
              "p-2.5 rounded-full border border-[var(--border-light)] transition-all",
              isFilterSidebarOpen ? "bg-[#1A1A18] text-white" : "bg-white text-[var(--text-primary)] hover:bg-black/5"
            )}
          >
            <Filter size={18} />
          </button>

          {/* Undo/Redo */}
          <div className="flex items-center gap-1">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={cn(
                "p-2 rounded-full transition-colors",
                canUndo ? "text-[var(--text-primary)] hover:bg-black/5" : "text-[var(--text-muted)] opacity-50 cursor-not-allowed"
              )}
            >
              <Undo2 size={18} />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={cn(
                "p-2 rounded-full transition-colors",
                canRedo ? "text-[var(--text-primary)] hover:bg-black/5" : "text-[var(--text-muted)] opacity-50 cursor-not-allowed"
              )}
            >
              <Redo2 size={18} />
            </button>
          </div>

          {/* Export & Add */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-full font-outfit text-[13px] text-[var(--text-primary)] hover:bg-black/5 transition-colors"
            >
              <Download size={16} />
              Esporta
            </button>
            <button
              onClick={() => {
                setInitialStatus('new');
                setIsAddDialogOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2 bg-[#1A1A18] text-white rounded-full font-outfit font-medium text-[13px] hover:bg-black transition-all shadow-sm"
            >
              <Plus size={16} />
              Aggiungi Buyer
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden pt-6 pb-6 gap-6">
        {/* Filter Sidebar (Collapsible) */}
        <AnimatePresence>
          {isFilterSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0, marginRight: 0 }}
              animate={{ width: 240, opacity: 1, marginRight: 24 }}
              exit={{ width: 0, opacity: 0, marginRight: 0 }}
              className="flex flex-col gap-6 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="font-outfit font-bold text-[12px] uppercase tracking-widest">Filtri</span>
                <button onClick={() => setFilters({})} className="text-[11px] font-outfit text-indigo-600 hover:underline">Reset</button>
              </div>

              {/* Status Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-outfit font-medium text-[var(--text-muted)] uppercase">Stato</label>
                <select
                  value={filters.status || ''}
                  onChange={e => setFilters({ ...filters, status: (e.target.value as ClienteStatus) || undefined })}
                  className="bg-[var(--bg-subtle)] border-0 rounded-lg p-2 text-[13px] font-outfit outline-none"
                >
                  <option value="">Tutti gli stati</option>
                  {Object.keys(CLIENTE_STATUS_CONFIG).map(k => (
                    <option key={k} value={k}>{CLIENTE_STATUS_CONFIG[k].label}</option>
                  ))}
                </select>
              </div>

              {/* Region Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-outfit font-medium text-[var(--text-muted)] uppercase">Regione</label>
                <select
                  value={filters.regione || ''}
                  onChange={e => setFilters({ ...filters, regione: e.target.value || undefined })}
                  className="bg-[var(--bg-subtle)] border-0 rounded-lg p-2 text-[13px] font-outfit outline-none"
                >
                  <option value="">Tutte le regioni</option>
                  {REGIONI_OPTIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Portal Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-outfit font-medium text-[var(--text-muted)] uppercase">Portale</label>
                <input
                  type="text"
                  placeholder="Es: JamesEdition"
                  value={filters.portale || ''}
                  onChange={e => setFilters({ ...filters, portale: e.target.value || undefined })}
                  className="bg-[var(--bg-subtle)] border-0 rounded-lg p-2 text-[13px] font-outfit outline-none"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content View */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-black/10 border-t-black rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {viewMode === 'kanban' ? (
                <ClientiKanban onClienteClick={handleClienteClick} onQuickAdd={handleQuickAdd} />
              ) : (
                <ClientiSheetView 
                  clienti={filteredClienti} 
                  agents={[]} // Add agents if available
                  onCardClick={handleClienteClick}
                  onUpdate={async (id, updates) => updateCliente({ id, ...updates })}
                  onDelete={async (id) => deleteCliente(id)}
                  onDuplicate={handleDuplicate}
                  searchQuery={filters.search || ""}
                  onAddNew={() => setIsAddDialogOpen(true)}
                  isLoading={isLoading}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Dialogs & Panels */}
      <AddClienteDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        initialStatus={initialStatus}
      />

      <ClienteDetail
        cliente={selectedCliente}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onUpdate={(id, updates) => updateCliente({ id, ...updates })}
        onDelete={(id) => {
          deleteCliente(id);
          setIsDetailOpen(false);
        }}
      />
    </div>
  );
};
