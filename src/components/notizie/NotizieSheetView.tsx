import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  MoreVertical, 
  GripVertical, 
  Plus, 
  Eye, 
  Trash2, 
  Copy, 
  Clipboard, 
  RotateCcw, 
  Bold, 
  Italic, 
  Strikethrough, 
  Type, 
  Palette,
  Check,
  X,
  Phone,
  ExternalLink,
  MessageCircle,
  Star
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNotizie } from "@/src/hooks/useNotizie";
import { Notizia } from "@/src/types";
import { cn } from "@/src/lib/utils";
import { TIPO_OPTIONS } from "./notizieConfig";
import { useColumnTypeOverrides, ColumnType } from "@/src/hooks/useColumnTypeOverrides";
import { useKanbanColumns } from "@/src/hooks/useKanbanColumns";

interface NotizieSheetViewProps {
  notizie: Notizia[];
  onNotiziaClick: (notizia: Notizia) => void;
  onUpdate: (id: string, updates: Partial<Notizia>) => void;
  onDelete?: (id: string) => void;
  searchQuery: string;
  onAddNew?: () => void;
  isLoading?: boolean;
}

const COLUMNS = [
  { key: 'name', label: 'Nome', width: 180, minWidth: 120, editable: true, type: 'text' },
  { key: 'zona', label: 'Zona', width: 140, minWidth: 90, editable: true, type: 'text' },
  { key: 'phone', label: 'Telefono', width: 140, minWidth: 90, editable: true, type: 'text' },
  { key: 'type', label: 'Tipo', width: 120, minWidth: 80, editable: true, type: 'text' },
  { key: 'status', label: 'Status', width: 130, minWidth: 100, editable: true, type: 'status' },
  { key: 'prezzo_richiesto', label: 'Prezzo Rich.', width: 120, minWidth: 80, editable: true, type: 'number' },
  { key: 'valore', label: 'Valore', width: 120, minWidth: 80, editable: true, type: 'number' },
  { key: 'is_online', label: 'Online', width: 70, minWidth: 60, editable: false, type: 'boolean' },
  { key: 'created_at', label: 'Creata', width: 100, minWidth: 80, editable: false, type: 'text' },
  { key: 'notes', label: 'Note', width: 250, minWidth: 120, editable: true, type: 'text' },
];

const EMOJIS = ["📋", "🏠", "🏡", "🏰", "🏛", "🌳", "🌊", "⭐", "🔥", "💎", "🎯", "📞"];

const COLOR_PALETTE = [
  null, '#f0eeec', '#e0ddda', '#c8c4c0', '#a8a4a0', '#808080', '#585858', '#303030',
  '#fef9e7', '#fef3c7', '#fde68a', '#f5c842', '#e8a317', '#c47f17', '#8b5e14', '#6b3f0d',
  '#e8f8e8', '#b5f0c0', '#6ddba0', '#38c77e', '#1a9a6c', '#0f7a5a', '#0a5e44', '#053d2e',
  '#dce8fc', '#b0ccf8', '#6fa2f0', '#3b7de8', '#2060d8', '#1648b8', '#0e3490', '#091e5c',
  '#f8e0ec', '#f0b0cc', '#e87aaa', '#d8488a', '#c02a70', '#981e5a', '#701644', '#480e2e'
];

const CellInput = React.memo(({ 
  initialValue, 
  onSave, 
  onCancel, 
  type = "text",
  className = ""
}: { 
  initialValue: any; 
  onSave: (val: any) => void; 
  onCancel: () => void;
  type?: string;
  className?: string;
}) => {
  const [value, setValue] = useState(initialValue);
  
  return (
    <input
      autoFocus
      type={type}
      className={cn("w-full bg-transparent outline-none font-outfit text-[13px]", className)}
      value={value ?? ""}
      onChange={(e) => setValue(type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
      onBlur={() => onSave(value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSave(value);
        if (e.key === 'Escape') onCancel();
      }}
    />
  );
});

interface FormatSettings {
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  color?: string;
  backgroundColor?: string;
}

export const NotizieSheetView: React.FC<NotizieSheetViewProps> = ({
  notizie,
  onNotiziaClick,
  onUpdate,
  onDelete,
  searchQuery,
  onAddNew,
  isLoading
}) => {
  // --- State ---
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('notizie-sheet-col-widths-v2');
    return saved ? JSON.parse(saved) : COLUMNS.reduce((acc, col) => ({ ...acc, [col.key]: col.width }), {});
  });

  const [colOrder, setColOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('notizie-sheet-col-order-v2');
    return saved ? JSON.parse(saved) : COLUMNS.map(c => c.key);
  });

  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [colFilters, setColFilters] = useState<Record<string, Set<string>>>({});
  const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState("");

  const [editingCell, setEditingCell] = useState<{ id: string; key: string } | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedColKey, setSelectedColKey] = useState<string | null>(null);

  const [rowFormats, setRowFormats] = useState<Record<string, FormatSettings>>(() => {
    const saved = localStorage.getItem('notizie-sheet-row-formats-v2');
    return saved ? JSON.parse(saved) : {};
  });

  const [colFormats, setColFormats] = useState<Record<string, FormatSettings>>(() => {
    const saved = localStorage.getItem('notizie-sheet-col-formats-v2');
    return saved ? JSON.parse(saved) : {};
  });

  const [favoriteColors, setFavoriteColors] = useState<string[]>(() => {
    const saved = localStorage.getItem('notizie-sheet-fav-colors');
    return saved ? JSON.parse(saved) : [];
  });

  const [rowContextMenu, setRowContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const [cellContextMenu, setCellContextMenu] = useState<{ x: number; y: number; id: string; key: string; value: any } | null>(null);
  const [headerContextMenu, setHeaderContextMenu] = useState<{ x: number; y: number; key: string } | null>(null);
  
  const [copiedValue, setCopiedValue] = useState<any>(null);
  const [draggedRowId, setDraggedRowId] = useState<string | null>(null);
  const [dragOverRowId, setDragOverRowId] = useState<string | null>(null);
  const [draggedColKey, setDraggedColKey] = useState<string | null>(null);
  const [dragOverColKey, setDragOverColKey] = useState<string | null>(null);

  const { overrides, updateOverride } = useColumnTypeOverrides('notizie');
  const { columns: kanbanCols } = useKanbanColumns();

  const statusLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    kanbanCols.forEach(c => labels[c.key] = c.label);
    return labels;
  }, [kanbanCols]);

  const statusColors = useMemo(() => {
    const colors: Record<string, string> = {};
    kanbanCols.forEach(c => colors[c.key] = c.color);
    return colors;
  }, [kanbanCols]);

  // --- Refs ---
  const resizingRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('notizie-sheet-col-widths-v2', JSON.stringify(colWidths));
  }, [colWidths]);

  useEffect(() => {
    localStorage.setItem('notizie-sheet-col-order-v2', JSON.stringify(colOrder));
  }, [colOrder]);

  useEffect(() => {
    localStorage.setItem('notizie-sheet-row-formats-v2', JSON.stringify(rowFormats));
  }, [rowFormats]);

  useEffect(() => {
    localStorage.setItem('notizie-sheet-col-formats-v2', JSON.stringify(colFormats));
  }, [colFormats]);

  useEffect(() => {
    localStorage.setItem('notizie-sheet-fav-colors', JSON.stringify(favoriteColors));
  }, [favoriteColors]);

  // --- Helpers ---
  const getLuminance = (hex: string) => {
    if (!hex || hex === 'transparent') return 1;
    const rgb = hex.replace(/^#/, '').match(/.{2}/g)?.map(x => parseInt(x, 16));
    if (!rgb) return 1;
    return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  };

  const getContrastColor = (hex: string | undefined) => {
    if (!hex || hex === 'transparent') return 'inherit';
    return getLuminance(hex) < 0.5 ? '#FFFFFF' : '#1A1A18';
  };

  // --- Column Resize ---
  const handleResizeStart = (e: React.MouseEvent, key: string) => {
    e.preventDefault();
    resizingRef.current = {
      key,
      startX: e.clientX,
      startWidth: colWidths[key] || 100
    };
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizingRef.current) return;
    const { key, startX, startWidth } = resizingRef.current;
    const deltaX = e.clientX - startX;
    const minWidth = COLUMNS.find(c => c.key === key)?.minWidth || 50;
    setColWidths(prev => ({
      ...prev,
      [key]: Math.max(minWidth, startWidth + deltaX)
    }));
  }, []);

  const handleResizeEnd = useCallback(() => {
    resizingRef.current = null;
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  }, [handleResizeMove]);

  // --- Column Reorder ---
  const handleColDragStart = (e: React.DragEvent, key: string) => {
    setDraggedColKey(key);
    e.dataTransfer.setData('text/plain', key);
  };

  const handleColDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    if (!draggedColKey || draggedColKey === targetKey) {
      setDraggedColKey(null);
      setDragOverColKey(null);
      return;
    }

    const newOrder = [...colOrder];
    const draggedIdx = newOrder.indexOf(draggedColKey);
    const targetIdx = newOrder.indexOf(targetKey);
    
    newOrder.splice(draggedIdx, 1);
    newOrder.splice(targetIdx, 0, draggedColKey);
    
    setColOrder(newOrder);
    setDraggedColKey(null);
    setDragOverColKey(null);
  };

  // --- Row Reorder ---
  const handleRowDragStart = (id: string) => {
    setDraggedRowId(id);
  };

  const handleRowDrop = (targetId: string) => {
    if (!draggedRowId || draggedRowId === targetId) {
      setDraggedRowId(null);
      setDragOverRowId(null);
      return;
    }

    const draggedIdx = sortedData.findIndex(n => n.id === draggedRowId);
    const targetIdx = sortedData.findIndex(n => n.id === targetId);

    const newData = [...sortedData];
    const [movedItem] = newData.splice(draggedIdx, 1);
    newData.splice(targetIdx, 0, movedItem);

    // Update display_order for all affected rows
    newData.forEach((item, index) => {
      if (item.display_order !== index + 1) {
        onUpdate(item.id, { display_order: index + 1 });
      }
    });

    setDraggedRowId(null);
    setDragOverRowId(null);
  };

  // --- Filtering & Sorting ---
  const filteredData = useMemo(() => {
    let data = [...notizie];

    // Global search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(n => 
        n.name.toLowerCase().includes(q) || 
        n.zona.toLowerCase().includes(q) || 
        n.notes.toLowerCase().includes(q) ||
        n.telefono?.includes(q)
      );
    }

    // Column filters
    Object.entries(colFilters).forEach(([key, allowedValues]) => {
      if (allowedValues.size > 0) {
        data = data.filter(n => allowedValues.has(String((n as any)[key] || "")));
      }
    });

    return data;
  }, [notizie, searchQuery, colFilters]);

  const sortedData = useMemo(() => {
    if (!sortCol) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = (a as any)[sortCol];
      const valB = (b as any)[sortCol];

      if (valA === valB) return 0;
      
      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else {
        comparison = String(valA || "").localeCompare(String(valB || ""));
      }

      return sortDir === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortCol, sortDir]);

  const toggleSort = (key: string) => {
    if (sortCol === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(key);
      setSortDir('asc');
    }
  };

  // --- Filter Popover Helpers ---
  const getUniqueValues = (key: string) => {
    const values = Array.from(new Set(notizie.map(n => String((n as any)[key] || ""))));
    return values.sort();
  };

  const toggleFilterValue = (key: string, value: string) => {
    setColFilters(prev => {
      const next = { ...prev };
      const set = new Set(next[key] || []);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      
      if (set.size === 0) delete next[key];
      else next[key] = set;
      
      return next;
    });
  };

  // --- Formatting ---
  const updateFormat = (type: 'row' | 'col', updates: Partial<FormatSettings>) => {
    if (type === 'row' && selectedRowId) {
      setRowFormats(prev => ({
        ...prev,
        [selectedRowId]: { ...(prev[selectedRowId] || {}), ...updates }
      }));
    } else if (type === 'col' && selectedColKey) {
      setColFormats(prev => ({
        ...prev,
        [selectedColKey]: { ...(prev[selectedColKey] || {}), ...updates }
      }));
    }
  };

  // --- Render Cell ---
  const renderCell = (notizia: Notizia, col: typeof COLUMNS[0]) => {
    const value = (notizia as any)[col.key];
    const isEditing = editingCell?.id === notizia.id && editingCell?.key === col.key;
    const override = overrides[col.key];
    const cellType = override?.type || col.type;

    const cellStyle: React.CSSProperties = {
      width: colWidths[col.key],
      minWidth: col.minWidth,
      ...getCellFormatting(notizia.id, col.key)
    };

    if (isEditing) {
      if (cellType === 'status') {
        return (
          <div className="relative w-full h-full flex items-center px-2" style={cellStyle}>
            <select
              autoFocus
              className="w-full bg-transparent outline-none font-outfit text-[13px]"
              value={value}
              onChange={(e) => {
                onUpdate(notizia.id, { status: e.target.value as any });
                setEditingCell(null);
              }}
              onBlur={() => setEditingCell(null)}
            >
              {kanbanCols.map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
        );
      }

      if (cellType === 'number') {
        return (
          <div className="relative w-full h-full flex items-center px-2" style={cellStyle}>
            <CellInput
              type="number"
              initialValue={value}
              onSave={(val) => {
                onUpdate(notizia.id, { [col.key]: val });
                setEditingCell(null);
              }}
              onCancel={() => setEditingCell(null)}
            />
          </div>
        );
      }

      return (
        <div className="relative w-full h-full flex items-center px-2" style={cellStyle}>
          <CellInput
            initialValue={value}
            onSave={(val) => {
              onUpdate(notizia.id, { [col.key]: val });
              setEditingCell(null);
            }}
            onCancel={() => setEditingCell(null)}
          />
        </div>
      );
    }

    // Default Renderers
    let content: React.ReactNode = value;

    if (cellType === 'status') {
      const color = statusColors[value] || '#E5E7EB';
      content = (
        <div 
          className="px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1.5"
          style={{ backgroundColor: color + '20', color: color }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
          {statusLabels[value] || value}
        </div>
      );
    } else if (cellType === 'boolean') {
      content = (
        <div className={cn(
          "w-4 h-4 rounded-sm border flex items-center justify-center",
          value ? "bg-primary border-primary text-white" : "border-gray-300"
        )}>
          {value && <Check size={12} />}
        </div>
      );
    } else if (col.key === 'phone') {
      content = (
        <div className="flex items-center justify-between w-full group/phone">
          <span className="truncate">{value}</span>
          {value && (
            <a 
              href={`https://wa.me/${value.replace(/\D/g, '')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="opacity-0 group-hover/phone:opacity-100 transition-opacity text-green-600 p-1 hover:bg-green-50 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <MessageCircle size={14} />
            </a>
          )}
        </div>
      );
    } else if (cellType === 'url') {
      content = (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 hover:underline flex items-center gap-1 truncate"
          onClick={(e) => e.stopPropagation()}
        >
          {value} <ExternalLink size={10} />
        </a>
      );
    } else if (cellType === 'number') {
      content = value?.toLocaleString('it-IT', { 
        style: col.key.includes('prezzo') || col.key === 'valore' ? 'currency' : 'decimal', 
        currency: 'EUR',
        maximumFractionDigits: 0
      });
    }

    return (
      <div 
        className="px-2 h-full flex items-center truncate cursor-text"
        style={cellStyle}
        onClick={() => col.editable && setEditingCell({ id: notizia.id, key: col.key })}
        onContextMenu={(e) => {
          e.preventDefault();
          setCellContextMenu({ x: e.clientX, y: e.clientY, id: notizia.id, key: col.key, value });
        }}
      >
        {content}
      </div>
    );
  };

  const getCellFormatting = (rowId: string, colKey: string): React.CSSProperties => {
    const rowF = rowFormats[rowId] || {};
    const colF = colFormats[colKey] || {};
    
    return {
      fontWeight: rowF.bold || colF.bold ? 'bold' : 'normal',
      fontStyle: rowF.italic || colF.italic ? 'italic' : 'normal',
      textDecoration: rowF.strikethrough || colF.strikethrough ? 'line-through' : 'none',
      color: rowF.color || colF.color || 'inherit',
      backgroundColor: rowF.backgroundColor || colF.backgroundColor || 'transparent',
    };
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-[var(--text-muted)] font-outfit">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p>Caricamento notizie...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border border-[var(--border-light)] rounded-xl overflow-hidden shadow-sm">
      {/* Format Toolbar */}
      <AnimatePresence>
        {(selectedRowId || selectedColKey) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-end gap-1 p-1.5 border-b bg-[var(--bg-subtle)]"
          >
            <div className="flex items-center gap-1 px-2 py-1 border-r mr-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                {selectedRowId ? "Riga" : "Colonna"}
              </span>
            </div>
            <ToolbarButton 
              icon={<Bold size={16} />} 
              onClick={() => updateFormat(selectedRowId ? 'row' : 'col', { bold: !((selectedRowId ? rowFormats[selectedRowId!] : colFormats[selectedColKey!])?.bold) })} 
            />
            <ToolbarButton 
              icon={<Italic size={16} />} 
              onClick={() => updateFormat(selectedRowId ? 'row' : 'col', { italic: !((selectedRowId ? rowFormats[selectedRowId!] : colFormats[selectedColKey!])?.italic) })} 
            />
            <ToolbarButton 
              icon={<Strikethrough size={16} />} 
              onClick={() => updateFormat(selectedRowId ? 'row' : 'col', { strikethrough: !((selectedRowId ? rowFormats[selectedRowId!] : colFormats[selectedColKey!])?.strikethrough) })} 
            />
            <div className="w-px h-4 bg-gray-300 mx-1" />
            <ColorPickerButton 
              icon={<Type size={16} />} 
              onSelect={(color) => updateFormat(selectedRowId ? 'row' : 'col', { color })} 
            />
            <ColorPickerButton 
              icon={<Palette size={16} />} 
              onSelect={(backgroundColor) => updateFormat(selectedRowId ? 'row' : 'col', { backgroundColor })} 
            />
            <button 
              onClick={() => { setSelectedRowId(null); setSelectedColKey(null); }}
              className="ml-2 p-1 hover:bg-black/5 rounded"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-auto relative" ref={tableRef}>
        <table className="border-collapse table-fixed min-w-full">
          <thead>
            <tr className="sticky top-0 z-20 bg-[var(--bg-surface)] shadow-[0_1px_0_rgba(0,0,0,0.05)]">
              {/* Row Number Header */}
              <th className="sticky left-0 z-30 bg-[var(--bg-subtle)] w-[52px] min-w-[52px] border-r border-b h-10" />
              
              {colOrder.map((key) => {
                const col = COLUMNS.find(c => c.key === key)!;
                const isSorted = sortCol === key;
                const isFiltered = colFilters[key]?.size > 0;

                return (
                  <th
                    key={key}
                    draggable
                    onDragStart={(e) => handleColDragStart(e, key)}
                    onDragOver={(e) => { e.preventDefault(); setDragOverColKey(key); }}
                    onDragLeave={() => setDragOverColKey(null)}
                    onDrop={(e) => handleColDrop(e, key)}
                    className={cn(
                      "relative border-r border-b h-10 px-2 text-left font-outfit text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] select-none group",
                      dragOverColKey === key && "bg-primary/30 border-l-2 border-l-primary",
                      selectedColKey === key && "bg-primary/5"
                    )}
                    style={{ width: colWidths[key] }}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div 
                        className="flex items-center gap-1 cursor-pointer truncate flex-1"
                        onClick={() => toggleSort(key)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setHeaderContextMenu({ x: e.clientX, y: e.clientY, key });
                        }}
                      >
                        {col.label}
                        {isSorted && (
                          sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                        )}
                      </div>
                      <button
                        onClick={() => setActiveFilterCol(activeFilterCol === key ? null : key)}
                        className={cn(
                          "p-1 rounded hover:bg-black/5 transition-colors",
                          isFiltered ? "text-primary" : "text-gray-400 opacity-0 group-hover:opacity-100"
                        )}
                      >
                        <Filter size={12} />
                      </button>
                    </div>

                    {/* Resize Handle */}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors z-10"
                      onMouseDown={(e) => handleResizeStart(e, key)}
                    />

                    {/* Filter Popover */}
                    <AnimatePresence>
                      {activeFilterCol === key && (
                        <FilterPopover 
                          columnKey={key}
                          values={getUniqueValues(key)}
                          selected={colFilters[key] || new Set()}
                          onToggle={(val) => toggleFilterValue(key, val)}
                          onClose={() => setActiveFilterCol(null)}
                          onClear={() => setColFilters(prev => { const n = {...prev}; delete n[key]; return n; })}
                          search={filterSearch}
                          onSearchChange={setFilterSearch}
                        />
                      )}
                    </AnimatePresence>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((notizia, index) => {
              const bg = notizia.card_color || 'transparent';
              const contrastText = getContrastColor(notizia.card_color);

              return (
                <tr 
                  key={notizia.id}
                  className={cn(
                    "group h-9 border-b hover:bg-black/[0.02] transition-colors relative",
                    dragOverRowId === notizia.id && "border-t-2 border-t-primary",
                    selectedRowId === notizia.id && "bg-primary/5"
                  )}
                  style={{ 
                    backgroundColor: bg !== 'transparent' ? bg : undefined,
                    color: bg !== 'transparent' ? contrastText : undefined
                  }}
                  onDragOver={(e) => { e.preventDefault(); setDragOverRowId(notizia.id); }}
                  onDragLeave={() => setDragOverRowId(null)}
                  onDrop={() => handleRowDrop(notizia.id)}
                >
                  {/* Row Number Cell */}
                  <td 
                    className="sticky left-0 z-10 bg-[var(--bg-subtle)] border-r text-center font-outfit text-[10px] text-[var(--text-muted)] select-none flex items-center justify-center gap-1 px-1 h-9"
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setRowContextMenu({ x: e.clientX, y: e.clientY, id: notizia.id });
                    }}
                  >
                    <div 
                      draggable 
                      onDragStart={() => handleRowDragStart(notizia.id)}
                      className="cursor-grab active:cursor-grabbing opacity-30 hover:opacity-70 transition-opacity"
                    >
                      <GripVertical size={14} />
                    </div>
                    <span className="w-4">{index + 1}</span>
                    <button 
                      onClick={() => onNotiziaClick(notizia)}
                      className="p-1 hover:bg-black/5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Eye size={14} />
                    </button>
                  </td>

                  {colOrder.map((key) => (
                    <td 
                      key={key} 
                      className={cn(
                        "border-r p-0 h-9 overflow-hidden",
                        selectedColKey === key && "bg-primary/5"
                      )}
                      onClick={(e) => {
                        if (e.shiftKey) {
                          setSelectedColKey(key);
                          setSelectedRowId(null);
                        } else {
                          setSelectedRowId(notizia.id);
                          setSelectedColKey(null);
                        }
                      }}
                    >
                      {renderCell(notizia, COLUMNS.find(c => c.key === key)!)}
                    </td>
                  ))}
                </tr>
              );
            })}
            
            {/* Add Row Button */}
            <tr className="h-9 border-b group cursor-pointer hover:bg-black/5" onClick={onAddNew}>
              <td className="sticky left-0 z-10 bg-[var(--bg-subtle)] border-r flex items-center justify-center h-9">
                <Plus size={14} className="text-primary" />
              </td>
              <td colSpan={colOrder.length} className="px-3 text-[12px] text-primary font-medium">
                Aggiungi nuova notizia...
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Context Menus */}
      <AnimatePresence>
        {rowContextMenu && (
          <RowContextMenu 
            {...rowContextMenu} 
            onClose={() => setRowContextMenu(null)}
            onUpdate={(updates) => onUpdate(rowContextMenu.id, updates)}
            onDelete={onDelete ? () => onDelete(rowContextMenu.id) : undefined}
            currentStatus={notizie.find(n => n.id === rowContextMenu.id)?.status}
            favoriteColors={favoriteColors}
            onAddFavoriteColor={(c) => setFavoriteColors(prev => Array.from(new Set([...prev, c])))}
            onRemoveFavoriteColor={(c) => setFavoriteColors(prev => prev.filter(x => x !== c))}
            kanbanCols={kanbanCols}
          />
        )}
        {cellContextMenu && (
          <CellContextMenu 
            {...cellContextMenu} 
            onClose={() => setCellContextMenu(null)}
            onCopy={() => {
              navigator.clipboard.writeText(String(cellContextMenu.value || ""));
              setCopiedValue(cellContextMenu.value);
              setCellContextMenu(null);
            }}
            onPaste={() => {
              if (copiedValue !== null) {
                onUpdate(cellContextMenu.id, { [cellContextMenu.key]: copiedValue });
              }
              setCellContextMenu(null);
            }}
            onReset={() => {
              onUpdate(cellContextMenu.id, { [cellContextMenu.key]: "" });
              setCellContextMenu(null);
            }}
          />
        )}
        {headerContextMenu && (
          <HeaderContextMenu 
            {...headerContextMenu}
            onClose={() => setHeaderContextMenu(null)}
            onTypeChange={(type) => updateOverride(headerContextMenu.key, { type })}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Sub-components ---

const ToolbarButton: React.FC<{ icon: React.ReactNode; onClick: () => void; active?: boolean }> = ({ icon, onClick, active }) => (
  <button 
    onClick={onClick}
    className={cn(
      "p-1.5 rounded transition-colors",
      active ? "bg-primary text-white" : "hover:bg-black/5 text-[var(--text-primary)]"
    )}
  >
    {icon}
  </button>
);

const ColorPickerButton: React.FC<{ icon: React.ReactNode; onSelect: (color: string) => void }> = ({ icon, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="p-1.5 hover:bg-black/5 rounded">
        {icon}
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 p-2 bg-white border rounded-lg shadow-xl z-50 grid grid-cols-8 gap-1 w-[200px]">
          {COLOR_PALETTE.map((color, i) => (
            <button
              key={i}
              onClick={() => { onSelect(color || 'transparent'); setIsOpen(false); }}
              className="w-5 h-5 rounded-sm border border-gray-200"
              style={{ backgroundColor: color || 'transparent' }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FilterPopover: React.FC<{
  columnKey: string;
  values: string[];
  selected: Set<string>;
  onToggle: (val: string) => void;
  onClose: () => void;
  onClear: () => void;
  search: string;
  onSearchChange: (val: string) => void;
}> = ({ values, selected, onToggle, onClose, onClear, search, onSearchChange }) => {
  const filteredValues = values.filter(v => v.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute top-full left-0 mt-1 w-56 bg-white border rounded-lg shadow-xl z-50 flex flex-col overflow-hidden"
    >
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input 
            autoFocus
            className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border rounded-md text-[12px] outline-none focus:ring-1 focus:ring-primary"
            placeholder="Cerca valori..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      <div className="max-h-60 overflow-y-auto p-1">
        <div className="flex items-center gap-2 p-1 border-b mb-1">
          <button onClick={() => values.forEach(v => !selected.has(v) && onToggle(v))} className="text-[10px] text-primary font-medium hover:underline">Tutti</button>
          <button onClick={onClear} className="text-[10px] text-gray-500 font-medium hover:underline">Nessuno</button>
        </div>
        {filteredValues.map(val => (
          <label key={val} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer group">
            <input 
              type="checkbox" 
              checked={selected.has(val)} 
              onChange={() => onToggle(val)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-[12px] text-[var(--text-primary)] truncate">{val || "(Vuoto)"}</span>
          </label>
        ))}
      </div>
      <div className="p-2 border-t bg-gray-50 flex justify-between">
        <button onClick={onClear} className="text-[11px] text-red-500 hover:underline">Rimuovi filtro</button>
        <button onClick={onClose} className="text-[11px] font-semibold text-primary">Chiudi</button>
      </div>
    </motion.div>
  );
};

const RowContextMenu: React.FC<{
  x: number;
  y: number;
  id: string;
  onClose: () => void;
  onUpdate: (updates: Partial<Notizia>) => void;
  onDelete?: () => void;
  currentStatus?: string;
  favoriteColors: string[];
  onAddFavoriteColor: (c: string) => void;
  onRemoveFavoriteColor: (c: string) => void;
  kanbanCols: any[];
}> = ({ x, y, onClose, onUpdate, onDelete, currentStatus, favoriteColors, onAddFavoriteColor, onRemoveFavoriteColor, kanbanCols }) => {
  const [customEmoji, setCustomEmoji] = useState("");
  const colorInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div className="fixed inset-0 z-[100]" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed z-[101] w-72 bg-white border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto"
        style={{ left: Math.min(x, window.innerWidth - 300), top: Math.min(y, window.innerHeight - 500) }}
      >
        {/* Status Section */}
        <div className="p-3 border-b bg-gray-50/50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block">Stato</span>
          <div className="flex flex-wrap gap-1.5">
            {kanbanCols.map(s => (
              <button
                key={s.key}
                onClick={() => { onUpdate({ status: s.key }); onClose(); }}
                className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-medium transition-all",
                  currentStatus === s.key ? "ring-2 ring-primary ring-offset-1" : "hover:scale-105"
                )}
                style={{ backgroundColor: s.color + '20', color: s.color }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Emoji Section */}
        <div className="p-3 border-b">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block">Emoji</span>
          <div className="grid grid-cols-6 gap-1 mb-2">
            {EMOJIS.map(e => (
              <button key={e} onClick={() => { onUpdate({ emoji: e }); onClose(); }} className="text-lg hover:bg-gray-100 rounded p-1">{e}</button>
            ))}
          </div>
          <div className="flex gap-1">
            <input 
              className="flex-1 px-2 py-1 border rounded text-[12px] outline-none"
              placeholder="Custom emoji..."
              value={customEmoji}
              onChange={(e) => setCustomEmoji(e.target.value)}
            />
            <button 
              onClick={() => { if(customEmoji) { onUpdate({ emoji: customEmoji }); onClose(); } }}
              className="px-2 bg-primary text-white rounded text-[12px]"
            >
              +
            </button>
          </div>
        </div>

        {/* Color Palette */}
        <div className="p-3 border-b">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block">Colore Card</span>
          <div className="grid grid-cols-8 gap-1">
            {COLOR_PALETTE.map((color, i) => (
              <button
                key={i}
                onClick={() => { onUpdate({ card_color: color || undefined }); onClose(); }}
                className="w-5 h-5 rounded-sm border border-gray-200 hover:scale-110 transition-transform"
                style={{ backgroundColor: color || 'transparent' }}
              />
            ))}
          </div>
          <div className="flex items-center justify-between mt-2">
            <button onClick={() => { onUpdate({ card_color: undefined }); onClose(); }} className="text-[11px] text-gray-500 hover:underline">Rimuovi colore</button>
            <div className="flex items-center gap-1">
              <input 
                type="color" 
                ref={colorInputRef} 
                className="hidden" 
                onChange={(e) => { onUpdate({ card_color: e.target.value }); onClose(); }} 
              />
              <button 
                onClick={() => colorInputRef.current?.click()}
                className="text-[11px] text-primary font-medium hover:underline"
              >
                + Personalizzato
              </button>
            </div>
          </div>
        </div>

        {/* Favorite Colors */}
        {favoriteColors.length > 0 && (
          <div className="p-3 border-b bg-gray-50/30">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block">Colori Preferiti</span>
            <div className="flex flex-wrap gap-1">
              {favoriteColors.map(c => (
                <button
                  key={c}
                  onClick={() => { onUpdate({ card_color: c }); onClose(); }}
                  onContextMenu={(e) => { e.preventDefault(); onRemoveFavoriteColor(c); }}
                  className="w-5 h-5 rounded-full border border-gray-200"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Delete Section */}
        {onDelete && (
          <button 
            onClick={() => { if(confirm("Eliminare questa notizia?")) { onDelete(); onClose(); } }}
            className="p-3 flex items-center gap-2 text-red-500 hover:bg-red-50 transition-colors text-[12px] font-medium"
          >
            <Trash2 size={14} />
            Elimina notizia
          </button>
        )}
      </motion.div>
    </>
  );
};

const CellContextMenu: React.FC<{
  x: number;
  y: number;
  onClose: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onReset: () => void;
}> = ({ x, y, onClose, onCopy, onPaste, onReset }) => (
  <>
    <div className="fixed inset-0 z-[100]" onClick={onClose} />
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed z-[101] w-40 bg-white border rounded-lg shadow-xl overflow-hidden py-1"
      style={{ left: x, top: y }}
    >
      <ContextMenuItem icon={<Copy size={14} />} label="Copia" onClick={onCopy} />
      <ContextMenuItem icon={<Clipboard size={14} />} label="Incolla" onClick={onPaste} />
      <div className="h-px bg-gray-100 my-1" />
      <ContextMenuItem icon={<RotateCcw size={14} />} label="Reset" onClick={onReset} className="text-red-500" />
    </motion.div>
  </>
);

const HeaderContextMenu: React.FC<{
  x: number;
  y: number;
  onClose: () => void;
  onTypeChange: (type: ColumnType) => void;
}> = ({ x, y, onClose, onTypeChange }) => (
  <>
    <div className="fixed inset-0 z-[100]" onClick={onClose} />
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed z-[101] w-48 bg-white border rounded-lg shadow-xl overflow-hidden py-1"
      style={{ left: x, top: y }}
    >
      <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Tipo Colonna</span>
      <ContextMenuItem label="Testo" onClick={() => { onTypeChange('text'); onClose(); }} />
      <ContextMenuItem label="Numero" onClick={() => { onTypeChange('number'); onClose(); }} />
      <ContextMenuItem label="Status" onClick={() => { onTypeChange('status'); onClose(); }} />
      <ContextMenuItem label="Checkbox" onClick={() => { onTypeChange('checkbox'); onClose(); }} />
      <ContextMenuItem label="URL" onClick={() => { onTypeChange('url'); onClose(); }} />
      <ContextMenuItem label="Dropdown" onClick={() => { onTypeChange('dropdown'); onClose(); }} />
    </motion.div>
  </>
);

const ContextMenuItem: React.FC<{ icon?: React.ReactNode; label: string; onClick: () => void; className?: string }> = ({ icon, label, onClick, className }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full px-3 py-2 flex items-center gap-2 text-[12px] hover:bg-black/5 transition-colors text-left",
      className
    )}
  >
    {icon}
    {label}
  </button>
);
