import { useState, useEffect } from 'react';

export interface KanbanColumn {
  id: string;
  key: string;
  label: string;
  color: string;
  display_order: number;
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: 'new', key: 'new', label: 'Nuova', color: '#C0C8D8', display_order: 0 },
  { id: 'in_progress', key: 'in_progress', label: 'In Lavorazione', color: '#C8B8F5', display_order: 1 },
  { id: 'done', key: 'done', label: 'Fatta', color: '#B8E0C8', display_order: 2 },
  { id: 'on_shot', key: 'on_shot', label: 'On Shot', color: '#F5E642', display_order: 3 },
  { id: 'taken', key: 'taken', label: 'Acquisita', color: '#6DC88A', display_order: 4 },
  { id: 'credit', key: 'credit', label: 'A Credito', color: '#F5C842', display_order: 5 },
  { id: 'no', key: 'no', label: 'No', color: '#F5A0B0', display_order: 6 },
  { id: 'sold', key: 'sold', label: 'Venduta', color: '#1A1A18', display_order: 7 },
];

export function useKanbanColumns() {
  const [columns, setColumns] = useState<KanbanColumn[]>(() => {
    const saved = localStorage.getItem('leadomancy-kanban-columns');
    return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem('leadomancy-kanban-columns', JSON.stringify(columns));
  }, [columns]);

  const addColumn = ({ label, color }: { label: string; color: string }) => {
    const newKey = 'custom_' + Date.now();
    const newCol: KanbanColumn = {
      id: newKey,
      key: newKey,
      label,
      color,
      display_order: columns.length,
    };
    setColumns([...columns, newCol]);
  };

  const updateColumn = ({ id, label, color }: { id: string; label?: string; color?: string }) => {
    setColumns(prev => prev.map(col => {
      if (col.id === id) {
        // 'taken' is protected: cannot be renamed (only color can change)
        const isProtected = col.key === 'taken';
        return {
          ...col,
          label: isProtected ? col.label : (label ?? col.label),
          color: color ?? col.color,
        };
      }
      return col;
    }));
  };

  const deleteColumn = (id: string) => {
    const colToDelete = columns.find(c => c.id === id);
    if (colToDelete?.key === 'taken') {
      throw new Error("La colonna 'Acquisita' è protetta e non può essere eliminata.");
    }
    setColumns(prev => prev.filter(c => c.id !== id).map((c, i) => ({ ...c, display_order: i })));
  };

  const reorderColumns = (orderedIds: string[]) => {
    const newCols = orderedIds.map((id, index) => {
      const col = columns.find(c => c.id === id)!;
      return { ...col, display_order: index };
    });
    setColumns(newCols);
  };

  return {
    columns: [...columns].sort((a, b) => a.display_order - b.display_order),
    addColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
  };
}
