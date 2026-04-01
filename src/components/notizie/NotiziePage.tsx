import React, { useState, useMemo, useEffect } from "react";
import { LayoutGrid, List, Search, Download, Plus, Undo2, Redo2, BarChart3, TrendingDown, Upload } from "lucide-react";
import { toast } from "sonner";
import { useNotizie } from "@/src/hooks/useNotizie";
import { useUndoRedo } from "@/src/hooks/useUndoRedo";
import { KanbanBoard } from "./KanbanBoard";
import { NotizieSheetView } from "./NotizieSheetView";
import { AddNotiziaDialog } from "./AddNotiziaDialog";
import { NotiziaDetail } from "./NotiziaDetail";
import { NotizieStatsChart } from "./NotizieStatsChart";
import { FunnelChartModal } from "./FunnelChartModal";
import { ImportCSVDialog } from "./ImportCSVDialog";
import { Notizia, NotiziaStatus } from "@/src/types";
import { cn } from "@/src/lib/utils";

export const NotiziePage: React.FC = () => {
  const { notizie, isLoading, updateNotizia, deleteNotizia } = useNotizie();
  const { undo, redo, canUndo, canRedo } = useUndoRedo();
  
  const [viewMode, setViewMode] = useState<'kanban' | 'sheet'>(() => {
    return (localStorage.getItem('leadomancy-notizie-view') as 'kanban' | 'sheet') || 'kanban';
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isFunnelOpen, setIsFunnelOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [initialStatus, setInitialStatus] = useState<NotiziaStatus | undefined>();
  const [selectedNotiziaId, setSelectedNotiziaId] = useState<string | null>(null);

  const selectedNotizia = useMemo(() => {
    if (!selectedNotiziaId) return null;
    return notizie.find(n => n.id === selectedNotiziaId) || null;
  }, [notizie, selectedNotiziaId]);

  useEffect(() => {
    const handler = () => setIsAddDialogOpen(true);
    window.addEventListener('leadomancy:open-add-notizia', handler);
    return () => window.removeEventListener('leadomancy:open-add-notizia', handler);
  }, []);

  const toggleViewMode = (mode: 'kanban' | 'sheet') => {
    setViewMode(mode);
    localStorage.setItem('leadomancy-notizie-view', mode);
  };

  const filteredNotizie = useMemo(() => {
    if (!searchQuery) return notizie;
    const q = searchQuery.toLowerCase();
    return notizie.filter(n => 
      n.name?.toLowerCase().includes(q) || 
      n.zona?.toLowerCase().includes(q) || 
      n.notes?.toLowerCase().includes(q) ||
      n.type?.toLowerCase().includes(q)
    );
  }, [notizie, searchQuery]);

  const handleNotiziaClick = (notizia: Notizia) => {
    setSelectedNotiziaId(notizia.id);
    setDetailOpen(true);
  };

  const handleQuickAdd = (status: NotiziaStatus) => {
    setInitialStatus(status);
    setIsAddDialogOpen(true);
  };

  const handleExport = () => {
    toast.success("Esportazione avviata...");
  };

  return (
    <div className="flex flex-col gap-4 pb-6 w-full">
      {/* Breadcrumb & Title */}
      <div className="flex flex-col">
        <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, marginTop: 6 }}>
          Leadomancy / Notizie
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.5px', color: 'var(--text-primary)', marginBottom: 0 }}>
          Notizie
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
            placeholder="Cerca nome, zona..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-subtle)] border-0 rounded-full py-2.5 pl-11 pr-4 text-[13px] font-outfit outline-none focus:ring-1 focus:ring-black/10 transition-all"
          />
        </div>

        {/* Actions Group */}
        <div className="flex items-center gap-1 ml-auto sm:ml-0 order-2 sm:order-none">
          <button
            onClick={() => setIsStatsOpen(true)}
            className="p-2 rounded-full text-[var(--text-primary)] hover:bg-black/5 transition-colors"
            title="Statistiche"
          >
            <BarChart3 size={18} />
          </button>
          <button
            onClick={() => setIsFunnelOpen(true)}
            className="p-2 rounded-full text-[var(--text-primary)] hover:bg-black/5 transition-colors"
            title="Funnel"
          >
            <TrendingDown size={18} />
          </button>
          <button
            onClick={() => setIsImportOpen(true)}
            className="p-2 rounded-full text-[var(--text-primary)] hover:bg-black/5 transition-colors"
            title="Importa CSV"
          >
            <Upload size={18} />
          </button>
          <div className="w-px h-4 bg-[var(--border-light)] mx-1 hidden sm:block" />
          
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
          <div className="flex items-center gap-2 ml-1">
            <button
              onClick={handleExport}
              className="hidden sm:flex items-center justify-center w-[38px] h-[38px] rounded-full bg-white border border-[var(--border-light)] text-[var(--text-secondary)] hover:bg-black/5 transition-colors"
              title="Esporta"
            >
              <Download size={18} />
            </button>
            <button
              onClick={() => {
                setInitialStatus('new');
                setIsAddDialogOpen(true);
              }}
              className="flex items-center gap-2 bg-[#1A1A18] text-white px-4 h-[38px] rounded-full font-outfit text-[13px] font-medium hover:bg-black/80 transition-colors whitespace-nowrap"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Aggiungi Notizia</span>
              <span className="sm:hidden">Nuova</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-black/10 border-t-black rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {viewMode === 'kanban' ? (
              <KanbanBoard onNotiziaClick={handleNotiziaClick} onQuickAdd={handleQuickAdd} />
            ) : (
              <NotizieSheetView 
                notizie={filteredNotizie} 
                isLoading={isLoading}
                onNotiziaClick={handleNotiziaClick} 
                onUpdate={(id, updates) => updateNotizia({ id, ...updates })}
                onDelete={deleteNotizia}
                searchQuery={searchQuery}
                onAddNew={() => setIsAddDialogOpen(true)}
              />
            )}
          </>
        )}
      </div>

      {/* Add Dialog */}
      <AddNotiziaDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        initialStatus={initialStatus}
      />

      {/* Stats Modal */}
      <NotizieStatsChart
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        notizie={notizie}
      />

      {/* Detail Panel */}
      {selectedNotizia && (
        <NotiziaDetail
          notizia={selectedNotizia}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onUpdate={(id, updates) => updateNotizia({ id, ...updates })}
          onDelete={(id) => { deleteNotizia(id); setDetailOpen(false); }}
        />
      )}

      {/* Funnel Modal */}
      <FunnelChartModal
        isOpen={isFunnelOpen}
        onClose={() => setIsFunnelOpen(false)}
        notizie={notizie}
      />

      {/* Import Dialog */}
      <ImportCSVDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
      />
    </div>
  );
};
