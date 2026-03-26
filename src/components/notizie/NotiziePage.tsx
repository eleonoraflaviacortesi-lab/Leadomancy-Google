import React, { useState, useMemo } from "react";
import { LayoutGrid, List, Search, Download, Plus, Undo2, Redo2 } from "lucide-react";
import { toast } from "sonner";
import { useNotizie } from "@/src/hooks/useNotizie";
import { useUndoRedo } from "@/src/hooks/useUndoRedo";
import { KanbanBoard } from "./KanbanBoard";
import { NotizieSheetView } from "./NotizieSheetView";
import { AddNotiziaDialog } from "./AddNotiziaDialog";
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
  const [initialStatus, setInitialStatus] = useState<NotiziaStatus | undefined>();
  const [selectedNotizia, setSelectedNotizia] = useState<Notizia | null>(null);

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
    setSelectedNotizia(notizia);
    toast.info("Dettaglio notizia in arrivo...");
  };

  const handleQuickAdd = (status: NotiziaStatus) => {
    setInitialStatus(status);
    setIsAddDialogOpen(true);
  };

  const handleExport = () => {
    toast.success("Esportazione avviata...");
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1600px] mx-auto w-full">
      {/* Breadcrumb & Title */}
      <div className="flex flex-col gap-1">
        <span className="font-outfit text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
          Leadomancy / Notizie
        </span>
        <h1 className="font-outfit font-semibold text-[28px] tracking-tight text-[var(--text-primary)]">
          Notizie
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
            placeholder="Cerca nome, zona..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-subtle)] border-0 rounded-full py-2.5 pl-11 pr-4 text-[13px] font-outfit outline-none focus:ring-1 focus:ring-black/10 transition-all"
          />
        </div>

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
            Aggiungi Notizia
          </button>
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
    </div>
  );
};
