import { useState, useEffect } from 'react';

export interface KanbanColumn {
  id: string;
  key: string;
  label: string;
  color: string;
  display_order: number;
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: 'new', key: 'new', label: 'Nuovi', color: '#C0C8D8', display_order: 0 },
  { id: 'contacted', key: 'contacted', label: 'Contattati', color: '#C8B8F5', display_order: 1 },
  { id: 'qualified', key: 'qualified', label: 'Qualificati', color: '#A090E8', display_order: 2 },
  { id: 'proposal', key: 'proposal', label: 'Proposta', color: '#F5C4A0', display_order: 3 },
  { id: 'negotiation', key: 'negotiation', label: 'Trattativa', color: '#F5C842', display_order: 4 },
  { id: 'closed_won', key: 'closed_won', label: 'Chiusi ✓', color: '#B8E0C8', display_order: 5 },
  { id: 'closed_lost', key: 'closed_lost', label: 'Persi', color: '#F5A0B0', display_order: 6 },
];

export function useClientKanbanColumns() {
  const [columns, setColumns] = useState<KanbanColumn[]>(() => {
    const saved = localStorage.getItem('leadomancy-client-kanban-columns');
    return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem('leadomancy-client-kanban-columns', JSON.stringify(columns));
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
        return {
          ...col,
          label: label ?? col.label,
          color: color ?? col.color,
        };
      }
      return col;
    }));
  };

  const deleteColumn = (id: string) => {
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
