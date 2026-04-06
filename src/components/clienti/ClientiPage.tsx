import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LayoutGrid, List, Search, Download, Plus, Undo2, Redo2, Filter, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { useClienti } from "@/src/hooks/useClienti";
import { useUndoRedo } from "@/src/hooks/useUndoRedo";
import { ClientiKanban } from "./ClientiKanban";
import { ClientiSheetView } from "./ClientiSheetView";
import { AddClienteDialog } from "./AddClienteDialog";
import { ClienteDetail } from "./ClienteDetail";
import { ImportFileDialog } from "../notizie/ImportFileDialog";
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
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);

  const CLIENTE_FIELDS = [
    { key: 'nome', label: 'Nome' },
    { key: 'cognome', label: 'Cognome' },
    { key: 'email', label: 'Email' },
    { key: 'telefono', label: 'Telefono' },
    { key: 'regione', label: 'Regione' },
    { key: 'portale', label: 'Portale' },
    { key: 'budget', label: 'Budget' },
    { key: 'note', label: 'Note' },
  ];

  const handleImportClienti = async (data: any[]) => {
    let successCount = 0;
    for (const item of data) {
      const cliente: Partial<Cliente> = {
        ...item,
        status: 'new',
      };
      if (cliente.budget_max) cliente.budget_max = parseFloat(cliente.budget_max.toString().replace(/[^0-9.]/g, '')) || 0;
      await addCliente(cliente as any);
      successCount++;
    }
    toast.success(`Importati con successo ${successCount} buyers`);
  };

  const selectedCliente = useMemo(() => {
    if (!selectedClienteId) return null;
    return filteredClienti.find(c => c.id === selectedClienteId) || null;
  }, [filteredClienti, selectedClienteId]);

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
    setSelectedClienteId(cliente.id);
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
      <div className="flex flex-col gap-4 pb-0 px-4 sm:px-0">
        <div className="flex flex-col">
          <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest mb-1 mt-6">
          ALTAIR / Buyers
          </p>
          <h1 className="text-[24px] sm:text-[28px] font-semibold tracking-tight text-[var(--text-primary)] mb-0">
            Luxury Buyers
          </h1>
        </div>

        {/* Controls Row */}
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          {/* View Toggle */}
          <div className="flex bg-[var(--bg-subtle)] p-1 rounded-full border border-[var(--border-light)] w-full sm:w-auto overflow-x-auto hide-scrollbar">
            <button
              onClick={() => toggleViewMode('kanban')}
              className={cn(
                "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-full font-outfit text-[13px] transition-all whitespace-nowrap",
                viewMode === 'kanban' ? "bg-[#1A1A18] text-white shadow-sm" : "text-[var(--text-secondary)] hover:bg-black/5"
              )}
            >
              <LayoutGrid size={14} />
              Kanban
            </button>
            <button
              onClick={() => toggleViewMode('sheet')}
              className={cn(
                "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-full font-outfit text-[13px] transition-all whitespace-nowrap",
                viewMode === 'sheet' ? "bg-[#1A1A18] text-white shadow-sm" : "text-[var(--text-secondary)] hover:bg-black/5"
              )}
            >
              <List size={14} />
              Foglio
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-full md:max-w-md order-3 sm:order-none w-full sm:w-auto">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Cerca nome, cognome, ref..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full bg-[var(--bg-subtle)] border-0 rounded-full py-2.5 pl-11 pr-4 text-[13px] font-outfit outline-none focus:ring-1 focus:ring-black/10 transition-all"
            />
          </div>

          {/* Actions Group */}
          <div className="flex items-center gap-2 ml-auto sm:ml-0 order-2 sm:order-none">
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
            <div className="hidden sm:flex items-center gap-1">
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
                className="hidden sm:flex items-center justify-center w-[38px] h-[38px] rounded-full bg-white border border-[var(--border-light)] text-[var(--text-secondary)] hover:bg-black/5 transition-colors"
                title="Esporta"
              >
                <Download size={18} />
              </button>
              <button
                onClick={() => setIsImportOpen(true)}
                className="hidden sm:flex items-center justify-center w-[38px] h-[38px] rounded-full bg-white border border-[var(--border-light)] text-[var(--text-secondary)] hover:bg-black/5 transition-colors"
                title="Importa"
              >
                <Upload size={18} />
              </button>
              <button
                onClick={() => setIsAddDialogOpen(true)}
                className="flex items-center gap-2 bg-[#1A1A18] text-white px-4 h-[38px] rounded-full font-outfit text-[13px] font-medium hover:bg-black/80 transition-colors whitespace-nowrap"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Nuovo Buyer</span>
                <span className="sm:hidden">Nuovo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden pt-6 pb-6 gap-6 relative px-4 sm:px-0">
        {/* Filter Sidebar (Collapsible) */}
        <AnimatePresence>
          {isFilterSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0, marginRight: 0 }}
              animate={{ width: 240, opacity: 1, marginRight: 24 }}
              exit={{ width: 0, opacity: 0, marginRight: 0 }}
              className="flex flex-col gap-6 overflow-hidden rounded-[55px] p-8 absolute sm:relative z-10 bg-white sm:bg-transparent shadow-xl sm:shadow-none h-full sm:h-auto"
            >
              <div className="flex items-center justify-between rounded-[35px] pr-8 pt-4 pb-4">
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
              
              {/* Close button for mobile */}
              <button 
                onClick={() => setIsFilterSidebarOpen(false)}
                className="sm:hidden mt-auto bg-black text-white rounded-full py-2 font-outfit text-[13px]"
              >
                Chiudi Filtri
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content View */}
        <div className="flex-1 min-w-0 bg-[#f5f4f0] rounded-xl overflow-hidden">
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
      <ImportFileDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Importa Buyers"
        fields={CLIENTE_FIELDS}
        onImport={handleImportClienti}
      />
    </div>
  );
};
