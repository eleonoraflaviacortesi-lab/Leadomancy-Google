import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  MoreVertical, 
  GripVertical, 
  Plus, 
  Minus,
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
  Star,
  Copy as CopyIcon,
  Globe,
  Layout,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Cliente, ClienteStatus } from "@/src/types";
import { cn } from "@/src/lib/utils";
import { useColumnTypeOverrides, ColumnType } from "@/src/hooks/useColumnTypeOverrides";
import { useClientKanbanColumns } from "@/src/hooks/useClientKanbanColumns";

interface ClientiSheetViewProps {
  clienti: Cliente[];
  agents: Array<{ user_id: string; full_name: string; avatar_emoji: string }>;
  onCardClick: (cliente: Cliente) => void;
  onUpdate: (id: string, updates: Partial<Cliente>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onDuplicate?: (cliente: Cliente) => Promise<void>;
  searchQuery: string;
  onAddNew?: () => void;
  isLoading?: boolean;
}

const DEFAULT_COLUMNS: Array<{ key: string; label: string; width: number; minWidth: number; editable: boolean; type: string; isCustom?: boolean }> = [
  { key: 'paese', label: 'Country', width: 100, minWidth: 70, editable: true, type: 'text' },
  { key: 'lingua', label: 'Language', width: 90, minWidth: 70, editable: true, type: 'lingua' },
  { key: 'cognome', label: 'Surname', width: 130, minWidth: 80, editable: true, type: 'text' },
  { key: 'nome', label: 'Name', width: 140, minWidth: 100, editable: true, type: 'text' },
  { key: 'portale', label: 'Portale', width: 130, minWidth: 90, editable: true, type: 'portale' },
  { key: 'data_submission', label: 'Data', width: 110, minWidth: 80, editable: true, type: 'text' },
  { key: 'property_name', label: 'Property', width: 150, minWidth: 100, editable: true, type: 'text' },
  { key: 'ref_number', label: 'Ref.', width: 80, minWidth: 60, editable: true, type: 'text' },
  { key: 'last_contact_date', label: 'Data Contatto', width: 120, minWidth: 80, editable: true, type: 'text' },
  { key: 'contattato_da', label: 'Contattato da', width: 120, minWidth: 80, editable: true, type: 'text' },
  { key: 'tipo_contatto', label: 'Tipo Contatto', width: 120, minWidth: 90, editable: true, type: 'tipo_contatto' },
  { key: 'telefono', label: 'Contatto 1', width: 150, minWidth: 100, editable: true, type: 'text' },
  { key: 'email', label: 'Contatto 2', width: 200, minWidth: 120, editable: true, type: 'text' },
  { key: 'status', label: 'Status', width: 130, minWidth: 100, editable: true, type: 'status' },
  { key: 'note_extra', label: 'Note', width: 200, minWidth: 120, editable: true, type: 'text' },
];

const LINGUA_OPTIONS = ['ENG', 'ITA', 'FRA', 'DEU', 'ESP'];
const PORTALE_OPTIONS = ['James Edition', 'Idealista', 'Gate-away', 'Sito Cortesi', 'Immobiliare.it', 'Rightmove', 'TALLY', 'Altro'];
const TIPO_CONTATTO_OPTIONS = ['Mail', 'WhatsApp', 'Call', 'Idealista', 'Sito Cortesi'];

const DEFAULT_LINGUA_COLORS: Record<string, string> = {
  ENG: '#3b82f6', ITA: '#22c55e', FRA: '#a855f7', DEU: '#f59e0b', ESP: '#ef4444'
};
const DEFAULT_PORTALE_COLORS: Record<string, string> = {
  'James Edition': '#f59e0b', Idealista: '#22c55e', 'Gate-away': '#60a5fa', 'Sito Cortesi': '#a855f7', 
  'Immobiliare.it': '#ef4444', Rightmove: '#6366f1', TALLY: '#ec4899', Altro: '#6b7280'
};
const DEFAULT_TIPO_CONTATTO_COLORS: Record<string, string> = {
  Mail: '#ef4444', WhatsApp: '#22c55e', Call: '#f59e0b'
};

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
  const savedRef = useRef(false);
  
  return (
    <input
      autoFocus
      type={type}
      className={cn("w-full bg-transparent outline-none font-outfit text-[13px]", className)}
      value={value ?? ""}
      onChange={(e) => setValue(type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
      onBlur={() => {
        if (!savedRef.current) {
          savedRef.current = true;
          onSave(value);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          if (!savedRef.current) {
            savedRef.current = true;
            onSave(value);
          }
        }
        if (e.key === 'Escape') {
          savedRef.current = true;
          onCancel();
        }
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

export const ClientiSheetView: React.FC<ClientiSheetViewProps> = ({
  clienti,
  agents,
  onCardClick,
  onUpdate,
  onDelete,
  onDuplicate,
  searchQuery,
  onAddNew,
  isLoading
}) => {
  // --- State ---
  const [customCols, setCustomCols] = useState<Array<{ key: string; label: string }>>(() => {
    const saved = localStorage.getItem('clienti-sheet-custom-cols');
    return saved ? JSON.parse(saved) : [];
  });

  const allColumns = useMemo(() => {
    const custom = customCols.map(c => ({
      key: c.key,
      label: c.label,
      width: 150,
      minWidth: 100,
      editable: true,
      type: 'text' as const,
      isCustom: true
    }));
    return [...DEFAULT_COLUMNS, ...custom];
  }, [customCols]);

  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('clienti-sheet-col-widths-v3');
    return saved ? JSON.parse(saved) : allColumns.reduce((acc, col) => ({ ...acc, [col.key]: col.width }), {});
  });

  const [colOrder, setColOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('clienti-sheet-col-order-v3');
    return saved ? JSON.parse(saved) : allColumns.map(c => c.key);
  });

  const [sortState, setSortState] = useState<{ col: string; dir: 'asc' | 'desc' }>(() => {
    const saved = localStorage.getItem('clienti-sheet-sort');
    return saved ? JSON.parse(saved) : { col: 'data_submission', dir: 'desc' };
  });

  const [colFilters, setColFilters] = useState<Record<string, Set<string>>>({});
  const [qualificatiOnly, setQualificatiOnly] = useState(false);
  const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState("");

  const [editingCell, setEditingCell] = useState<{ id: string; key: string } | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedColKey, setSelectedColKey] = useState<string | null>(null);
  const { overrides, updateOverride } = useColumnTypeOverrides('clienti-sheet');
  const { columns: kanbanCols } = useClientKanbanColumns();
  const [copiedValue, setCopiedValue] = useState<any>(null);
  const [draggedRowId, setDraggedRowId] = useState<string | null>(null);
  const [dragOverRowId, setDragOverRowId] = useState<string | null>(null);
  const [dragOverColKey, setDragOverColKey] = useState<string | null>(null);
  const [rowContextMenu, setRowContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const [cellContextMenu, setCellContextMenu] = useState<{ x: number; y: number; id: string; key: string; value: any } | null>(null);
  const [headerContextMenu, setHeaderContextMenu] = useState<{ x: number; y: number; key: string } | null>(null);
  const [badgePopup, setBadgePopup] = useState<{ x: number; y: number; id: string; key: string; type: 'lingua' | 'portale' | 'tipo_contatto' } | null>(null);

  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('clienti-sheet-font-size');
    return saved ? parseInt(saved) : 12; // Default 12px
  });

  useEffect(() => {
    localStorage.setItem('clienti-sheet-font-size', fontSize.toString());
  }, [fontSize]);

  const [rowFormats, setRowFormats] = useState<Record<string, FormatSettings>>(() => {
    const saved = localStorage.getItem('clienti-sheet-row-formats-v3');
    return saved ? JSON.parse(saved) : {};
  });

  const [colFormats, setColFormats] = useState<Record<string, FormatSettings>>(() => {
    const saved = localStorage.getItem('clienti-sheet-col-formats-v3');
    return saved ? JSON.parse(saved) : {};
  });

  const [linguaColors, setLinguaColors] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('custom-lingua-colors');
    return saved ? JSON.parse(saved) : DEFAULT_LINGUA_COLORS;
  });
  const [linguaOptions, setLinguaOptions] = useState<string[]>(() => {
    const saved = localStorage.getItem('custom-lingua-options');
    return saved ? JSON.parse(saved) : LINGUA_OPTIONS;
  });

  const [portaleColors, setPortaleColors] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('custom-portale-colors');
    return saved ? JSON.parse(saved) : DEFAULT_PORTALE_COLORS;
  });
  const [portaleOptions, setPortaleOptions] = useState<string[]>(() => {
    const saved = localStorage.getItem('custom-portale-options');
    return saved ? JSON.parse(saved) : PORTALE_OPTIONS;
  });

  const [tipoContattoColors, setTipoContattoColors] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('custom-tipo-contatto-colors');
    return saved ? JSON.parse(saved) : DEFAULT_TIPO_CONTATTO_COLORS;
  });
  const [tipoContattoOptions, setTipoContattoOptions] = useState<string[]>(() => {
    const saved = localStorage.getItem('custom-tipo-contatto-options');
    return saved ? JSON.parse(saved) : TIPO_CONTATTO_OPTIONS;
  });

  // --- Persistence ---
  useEffect(() => { localStorage.setItem('custom-lingua-colors', JSON.stringify(linguaColors)); }, [linguaColors]);
  useEffect(() => { localStorage.setItem('custom-lingua-options', JSON.stringify(linguaOptions)); }, [linguaOptions]);
  useEffect(() => { localStorage.setItem('custom-portale-colors', JSON.stringify(portaleColors)); }, [portaleColors]);
  useEffect(() => { localStorage.setItem('custom-portale-options', JSON.stringify(portaleOptions)); }, [portaleOptions]);
  useEffect(() => { localStorage.setItem('custom-tipo-contatto-colors', JSON.stringify(tipoContattoColors)); }, [tipoContattoColors]);
  useEffect(() => { localStorage.setItem('custom-tipo-contatto-options', JSON.stringify(tipoContattoOptions)); }, [tipoContattoOptions]);

  // --- Helpers ---
  const getContrastColor = (hex: string | undefined) => {
    if (!hex || hex === 'transparent') return 'inherit';
    const rgb = hex.replace(/^#/, '').match(/.{2}/g)?.map(x => parseInt(x, 16));
    if (!rgb) return 'inherit';
    const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
    return luminance < 0.5 ? '#FFFFFF' : '#1A1A18';
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
      fontSize: fontSize + 'px',
    };
  };

  // --- Column Management ---
  const handleResizeStart = (e: React.MouseEvent, key: string) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = colWidths[key] || 100;
    const onMouseMove = (moveE: MouseEvent) => {
      const deltaX = moveE.clientX - startX;
      const minWidth = allColumns.find(c => c.key === key)?.minWidth || 50;
      setColWidths(prev => ({ ...prev, [key]: Math.max(minWidth, startWidth + deltaX) }));
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const addCustomColumn = () => {
    const name = prompt("Inserisci il nome della nuova colonna:");
    if (name) {
      const key = 'custom_' + Date.now();
      setCustomCols(prev => [...prev, { key, label: name }]);
      setColOrder(prev => [...prev, key]);
      setColWidths(prev => ({ ...prev, [key]: 150 }));
    }
  };

  const deleteCustomColumn = (key: string) => {
    if (confirm("Eliminare questa colonna personalizzata?")) {
      setCustomCols(prev => prev.filter(c => c.key !== key));
      setColOrder(prev => prev.filter(k => k !== key));
    }
  };

  // --- Filtering & Sorting ---
  const filteredData = useMemo(() => {
    let data = [...clienti];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(c => 
        c.nome?.toLowerCase().includes(q) || 
        c.cognome?.toLowerCase().includes(q) || 
        c.email?.toLowerCase().includes(q) || 
        c.telefono?.toLowerCase().includes(q)
      );
    }
    if (qualificatiOnly) {
      data = data.filter(c => c.status === 'qualified');
    }
    Object.entries(colFilters).forEach(([key, allowed]) => {
      if (allowed.size > 0) {
        data = data.filter(c => {
          const val = String((c as any)[key] || (c.custom_fields as any)?.[key] || "");
          return allowed.has(val);
        });
      }
    });
    return data;
  }, [clienti, searchQuery, qualificatiOnly, colFilters]);

  const sortedData = useMemo(() => {
    const { col, dir } = sortState;
    return [...filteredData].sort((a, b) => {
      const valA = String((a as any)[col] || (a.custom_fields as any)?.[col] || "");
      const valB = String((b as any)[col] || (b.custom_fields as any)?.[col] || "");
      
      if (!isNaN(Number(valA)) && !isNaN(Number(valB)) && valA !== '' && valB !== '') {
        return dir === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
      }
      return dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [filteredData, sortState]);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selectedRowId || !selectedColKey) return;
      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl && e.key === 'c') {
        const cliente = clienti.find(c => c.id === selectedRowId);
        if (cliente) {
          const isCustom = allColumns.find(c => c.key === selectedColKey)?.isCustom;
          const val = String(isCustom ? (cliente.custom_fields as any)?.[selectedColKey] ?? '' : (cliente as any)[selectedColKey] ?? '');
          navigator.clipboard.writeText(val).catch(() => {});
          setCopiedValue(val);
        }
      }
      if (isCtrl && e.key === 'v') {
        navigator.clipboard.readText().then(text => {
          if (text && selectedRowId && selectedColKey) {
            const isCustom = allColumns.find(c => c.key === selectedColKey)?.isCustom;
            if (isCustom) {
              const cliente = clienti.find(c => c.id === selectedRowId);
              const custom = { ...(cliente?.custom_fields || {}), [selectedColKey]: text };
              onUpdate(selectedRowId, { custom_fields: custom });
            } else {
              onUpdate(selectedRowId, { [selectedColKey]: text });
            }
          }
        }).catch(() => {});
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedRowId, selectedColKey, clienti, onUpdate, allColumns]);

  // --- Render Cell ---
  const renderCell = (cliente: Cliente, col: typeof allColumns[0]) => {
    const isCustom = (col as any).isCustom;
    const value = isCustom ? (cliente.custom_fields as any)?.[col.key] : (cliente as any)[col.key];
    const isEditing = editingCell?.id === cliente.id && editingCell?.key === col.key;
    const override = overrides[col.key];
    const cellType = override?.type || col.type;

    const cellStyle: React.CSSProperties = {
      width: colWidths[col.key],
      minWidth: col.minWidth,
      ...getCellFormatting(cliente.id, col.key)
    };

    if (isEditing) {
      return (
        <div className="relative w-full h-full flex items-center px-2" style={cellStyle}>
          <CellInput
            initialValue={value}
            onSave={(val) => {
              if (isCustom) {
                const custom = { ...(cliente.custom_fields || {}), [col.key]: val };
                onUpdate(cliente.id, { custom_fields: custom });
              } else {
                onUpdate(cliente.id, { [col.key]: val });
              }
              setEditingCell(null);
            }}
            onCancel={() => setEditingCell(null)}
          />
        </div>
      );
    }

    let content: React.ReactNode = value;

    if (cellType === 'status') {
      const colConfig = kanbanCols.find(c => c.key === value);
      const color = colConfig?.color || '#E5E7EB';
      content = (
        <div className="px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1.5" style={{ backgroundColor: color + '20', color }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
          {colConfig?.label || value}
        </div>
      );
    } else if (['lingua', 'portale', 'tipo_contatto'].includes(cellType)) {
      const colors = cellType === 'lingua' ? linguaColors : cellType === 'portale' ? portaleColors : tipoContattoColors;
      const color = colors[value] || '#6b7280';
      content = (
        <div 
          className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:opacity-80 transition-opacity"
          style={{ backgroundColor: color + '20', color }}
          onClick={(e) => {
            e.stopPropagation();
            setBadgePopup({ x: e.clientX, y: e.clientY, id: cliente.id, key: col.key, type: cellType as any });
          }}
        >
          {value || "---"}
        </div>
      );
    } else if (col.key === 'telefono') {
      content = (
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'space-between', width: '100%' }}>
          <span className="truncate">{value}</span>
          {value && (
            <a href={`https://wa.me/${String(value).replace(/[\s\-\(\)\+]/g, '')}`}
              target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{ flexShrink: 0, padding: 2, color: '#25D366', display: 'flex', alignItems: 'center' }}
              title="WhatsApp">
              <MessageCircle size={13} />
            </a>
          )}
        </div>
      );
    }

    return (
      <div 
        className="px-2 h-full flex items-center truncate cursor-text min-h-[32px]"
        style={cellStyle}
        onClick={() => col.editable && setEditingCell({ id: cliente.id, key: col.key })}
        onContextMenu={(e) => {
          e.preventDefault();
          setCellContextMenu({ x: e.clientX, y: e.clientY, id: cliente.id, key: col.key, value });
        }}
      >
        {content}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border border-[var(--border-light)] rounded-xl overflow-hidden shadow-sm">
      {/* Toolbar */}
      <AnimatePresence>
        {(selectedRowId || selectedColKey) && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center justify-end gap-1 p-1.5 border-b bg-[var(--bg-subtle)]">
            <div className="flex items-center gap-1 border-r pr-2 mr-2">
              <button onClick={() => setFontSize(p => Math.max(10, p - 1))} className="p-1 hover:bg-black/5 rounded"><Minus size={12} /></button>
              <span className="text-[11px] font-medium w-6 text-center">{fontSize}px</span>
              <button onClick={() => setFontSize(p => Math.min(20, p + 1))} className="p-1 hover:bg-black/5 rounded"><Plus size={12} /></button>
            </div>
            <ToolbarButton icon={<Bold size={16} />} onClick={() => {
              const type = selectedRowId ? 'row' : 'col';
              const id = selectedRowId || selectedColKey!;
              const current = (type === 'row' ? rowFormats[id] : colFormats[id])?.bold;
              if(type === 'row') setRowFormats(p => ({...p, [id]: {...(p[id]||{}), bold: !current}}));
              else setColFormats(p => ({...p, [id]: {...(p[id]||{}), bold: !current}}));
            }} />
            <ToolbarButton icon={<Italic size={16} />} onClick={() => {
              const type = selectedRowId ? 'row' : 'col';
              const id = selectedRowId || selectedColKey!;
              const current = (type === 'row' ? rowFormats[id] : colFormats[id])?.italic;
              if(type === 'row') setRowFormats(p => ({...p, [id]: {...(p[id]||{}), italic: !current}}));
              else setColFormats(p => ({...p, [id]: {...(p[id]||{}), italic: !current}}));
            }} />
            <ToolbarButton icon={<Strikethrough size={16} />} onClick={() => {
              const type = selectedRowId ? 'row' : 'col';
              const id = selectedRowId || selectedColKey!;
              const current = (type === 'row' ? rowFormats[id] : colFormats[id])?.strikethrough;
              if(type === 'row') setRowFormats(p => ({...p, [id]: {...(p[id]||{}), strikethrough: !current}}));
              else setColFormats(p => ({...p, [id]: {...(p[id]||{}), strikethrough: !current}}));
            }} />
            <div className="w-px h-4 bg-gray-300 mx-1" />
            <ColorPickerButton icon={<Type size={16} />} onSelect={(color) => {
              const id = selectedRowId || selectedColKey!;
              if(selectedRowId) setRowFormats(p => ({...p, [id]: {...(p[id]||{}), color}}));
              else setColFormats(p => ({...p, [id]: {...(p[id]||{}), color}}));
            }} />
            <ColorPickerButton icon={<Palette size={16} />} onSelect={(backgroundColor) => {
              const id = selectedRowId || selectedColKey!;
              if(selectedRowId) setRowFormats(p => ({...p, [id]: {...(p[id]||{}), backgroundColor}}));
              else setColFormats(p => ({...p, [id]: {...(p[id]||{}), backgroundColor}}));
            }} />
            <button onClick={() => { setSelectedRowId(null); setSelectedColKey(null); }} className="ml-2 p-1 hover:bg-black/5 rounded"><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-auto relative">
        <table className="border-collapse table-fixed min-w-full">
          <thead>
            <tr className="sticky top-0 z-20 bg-[var(--bg-surface)] shadow-[0_1px_0_rgba(0,0,0,0.05)]">
              <th className="sticky left-0 z-30 bg-[var(--bg-subtle)] w-[52px] min-w-[52px] border-r border-b h-10" />
              {colOrder.map(key => {
                const col = allColumns.find(c => c.key === key)!;
                const isSorted = sortState.col === key;
                const isFiltered = colFilters[key]?.size > 0;
                return (
                  <th 
                    key={key} 
                    draggable
                    onDragStart={e => { e.dataTransfer.setData('col-key', key); e.dataTransfer.effectAllowed = 'move'; }}
                    onDragOver={e => { e.preventDefault(); setDragOverColKey(key); }}
                    onDragLeave={() => setDragOverColKey(null)}
                    onDrop={e => {
                      e.preventDefault();
                      const srcKey = e.dataTransfer.getData('col-key');
                      setDragOverColKey(null);
                      if (!srcKey || srcKey === key) return;
                      setColOrder(prev => {
                        const arr = [...prev];
                        const from = arr.indexOf(srcKey);
                        const to = arr.indexOf(key);
                        if (from === -1 || to === -1) return prev;
                        arr.splice(from, 1);
                        arr.splice(to, 0, srcKey);
                        return arr;
                      });
                    }}
                    className={cn(
                      "relative border-r border-b h-10 px-2 text-left font-outfit text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] select-none group",
                      selectedColKey === key && "bg-primary/5",
                      dragOverColKey === key && "border-l-2 border-l-[#1A1A18]"
                    )}
                    style={{ width: colWidths[key], fontSize: fontSize + 'px' }}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 cursor-pointer truncate flex-1" onClick={() => setSortState(p => ({ col: key, dir: p.col === key && p.dir === 'asc' ? 'desc' : 'asc' }))} onContextMenu={(e) => { e.preventDefault(); setHeaderContextMenu({ x: e.clientX, y: e.clientY, key }); }}>
                        {col.label}
                        {isSorted && (sortState.dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                      </div>
                      <button onClick={() => setActiveFilterCol(activeFilterCol === key ? null : key)} className={cn("p-1 rounded hover:bg-black/5 transition-colors", isFiltered ? "text-primary" : "text-gray-400 opacity-0 group-hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-100")}><Filter size={12} /></button>
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors z-10" onMouseDown={(e) => handleResizeStart(e, key)} onTouchStart={(e) => handleResizeStart(e as any, key)} />
                    {activeFilterCol === key && (
                      <FilterPopover 
                        columnKey={key}
                        values={Array.from(new Set(clienti.map(c => String((c as any)[key] || (c.custom_fields as any)?.[key] || "")))).sort()}
                        selected={colFilters[key] || new Set()}
                        onToggle={(val) => setColFilters(p => {
                          const n = {...p}; const s = new Set(n[key] || []);
                          if(s.has(val)) s.delete(val); else s.add(val);
                          if(s.size === 0) delete n[key]; else n[key] = s;
                          return n;
                        })}
                        onClose={() => setActiveFilterCol(null)}
                        onClear={() => setColFilters(p => { const n = {...p}; delete n[key]; return n; })}
                        search={filterSearch}
                        onSearchChange={setFilterSearch}
                        isStatus={key === 'status'}
                        onQualificatiToggle={() => setQualificatiOnly(!qualificatiOnly)}
                        qualificatiOnly={qualificatiOnly}
                      />
                    )}
                  </th>
                );
              })}
              <th className="w-10 border-b bg-[var(--bg-subtle)]">
                <button onClick={addCustomColumn} className="w-full h-full flex items-center justify-center hover:bg-black/5 text-primary"><Plus size={16} /></button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((cliente, index) => {
              const bg = cliente.card_color || 'transparent';
              const contrastText = getContrastColor(cliente.card_color);
              return (
                <tr 
                  key={cliente.id} 
                  className={cn("group border-b hover:bg-black/[0.02] transition-colors relative", selectedRowId === cliente.id && "bg-primary/5")}
                  style={{ 
                    backgroundColor: bg !== 'transparent' ? bg : undefined, 
                    color: bg !== 'transparent' ? contrastText : undefined,
                    borderTop: dragOverRowId === cliente.id ? '2px solid #1A1A18' : undefined
                  }}
                  onDragOver={e => { e.preventDefault(); if (draggedRowId && draggedRowId !== cliente.id) setDragOverRowId(cliente.id); }}
                  onDragLeave={() => setDragOverRowId(null)}
                  onDrop={e => {
                    e.preventDefault();
                    const srcId = draggedRowId;
                    setDragOverRowId(null);
                    setDraggedRowId(null);
                    if (!srcId || srcId === cliente.id) return;
                    const src = clienti.find(c => c.id === srcId);
                    if (src) {
                      onUpdate(srcId, { display_order: cliente.display_order });
                      onUpdate(cliente.id, { display_order: src.display_order });
                    }
                  }}
                >
                  <td className="sticky left-0 z-10 bg-[var(--bg-subtle)] border-r text-center font-outfit text-[10px] text-[var(--text-muted)] select-none flex items-center justify-center gap-1 px-1 h-full min-h-[32px]" onContextMenu={(e) => { e.preventDefault(); setRowContextMenu({ x: e.clientX, y: e.clientY, id: cliente.id }); }}>
                    <div draggable onDragStart={() => setDraggedRowId(cliente.id)} className="cursor-grab active:cursor-grabbing opacity-30 hover:opacity-70"><GripVertical size={14} /></div>
                    <span className="w-4">{index + 1}</span>
                    <button onClick={() => onCardClick(cliente)} className="p-1 hover:bg-black/5 rounded opacity-0 group-hover:opacity-100"><Eye size={14} /></button>
                  </td>
                  {colOrder.map(key => (
                    <td key={key} className={cn("border-r p-0 h-full overflow-hidden", selectedColKey === key && "bg-primary/5")} onClick={(e) => { if(e.shiftKey) { setSelectedColKey(key); setSelectedRowId(null); } else { setSelectedRowId(cliente.id); setSelectedColKey(null); } }}>
                      {renderCell(cliente, allColumns.find(c => c.key === key)!)}
                    </td>
                  ))}
                  <td className="border-b" />
                </tr>
              );
            })}
            <tr className="h-9 border-b group cursor-pointer hover:bg-black/5" onClick={onAddNew}>
              <td className="sticky left-0 z-10 bg-[var(--bg-subtle)] border-r flex items-center justify-center h-9"><Plus size={14} className="text-primary" /></td>
              <td colSpan={colOrder.length + 1} className="px-3 text-[12px] text-primary font-medium">Aggiungi nuovo cliente...</td>
            </tr>
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {rowContextMenu && (
          <RowContextMenu 
            {...rowContextMenu} 
            onClose={() => setRowContextMenu(null)}
            onUpdate={(u) => onUpdate(rowContextMenu.id, u)}
            onDelete={onDelete ? () => onDelete(rowContextMenu.id) : undefined}
            onDuplicate={onDuplicate ? () => onDuplicate(clienti.find(c => c.id === rowContextMenu.id)!) : undefined}
            currentStatus={clienti.find(c => c.id === rowContextMenu.id)?.status}
            currentLingua={clienti.find(c => c.id === rowContextMenu.id)?.lingua}
            kanbanCols={kanbanCols}
            linguaColors={linguaColors}
          />
        )}
        {cellContextMenu && (
          <CellContextMenu 
            {...cellContextMenu} 
            onClose={() => setCellContextMenu(null)}
            onCopy={() => { navigator.clipboard.writeText(String(cellContextMenu.value || "")); setCopiedValue(cellContextMenu.value); setCellContextMenu(null); }}
            onPaste={() => { if(copiedValue !== null) onUpdate(cellContextMenu.id, { [cellContextMenu.key]: copiedValue }); setCellContextMenu(null); }}
            onReset={() => { onUpdate(cellContextMenu.id, { [cellContextMenu.key]: "" }); setCellContextMenu(null); }}
          />
        )}
        {headerContextMenu && (
          <HeaderContextMenu 
            {...headerContextMenu} 
            onClose={() => setHeaderContextMenu(null)}
            onTypeChange={(t) => updateOverride(headerContextMenu.key, { type: t })}
            isCustom={headerContextMenu.key.startsWith('custom_')}
            onDelete={() => deleteCustomColumn(headerContextMenu.key)}
          />
        )}
        {badgePopup && (
          <BadgePopup 
            key={`${badgePopup.x}-${badgePopup.y}`}
            x={badgePopup.x}
            y={badgePopup.y}
            onClose={() => setBadgePopup(null)}
            options={badgePopup.type === 'lingua' ? linguaOptions : badgePopup.type === 'portale' ? portaleOptions : tipoContattoOptions}
            colors={badgePopup.type === 'lingua' ? linguaColors : badgePopup.type === 'portale' ? portaleColors : tipoContattoColors}
            onSelect={(val) => { onUpdate(badgePopup.id, { [badgePopup.key]: val }); setBadgePopup(null); }}
            onUpdateColor={(val, color) => {
              if(badgePopup.type === 'lingua') setLinguaColors(p => ({...p, [val]: color}));
              else if(badgePopup.type === 'portale') setPortaleColors(p => ({...p, [val]: color}));
              else setTipoContattoColors(p => ({...p, [val]: color}));
            }}
            onUpdateOptions={(opts) => {
              if(badgePopup.type === 'lingua') setLinguaOptions(opts);
              else if(badgePopup.type === 'portale') setPortaleOptions(opts);
              else setTipoContattoOptions(opts);
            }}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 12px', borderTop: '1px solid var(--border-light)',
        fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Outfit'
      }}>
        <span style={{ flex: 1 }}>
          {sortedData.length} buyers
          {sortedData.length !== clienti.length && ` (${clienti.length} totali)`}
        </span>
        {Object.values(colFilters).some(s => s.size > 0) && (
          <button onClick={() => setColFilters({})}
            style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, border: '1px solid var(--border-light)', background: 'white', cursor: 'pointer', fontFamily: 'Outfit', color: 'var(--text-primary)' }}>
            ✕ Rimuovi filtri
          </button>
        )}
      </div>
    </div>
  );
};

// --- Sub-components ---

const ToolbarButton: React.FC<{ icon: React.ReactNode; onClick: () => void; active?: boolean }> = ({ icon, onClick, active }) => (
  <button onClick={onClick} className={cn("p-1.5 rounded transition-colors", active ? "bg-primary text-white" : "hover:bg-black/5 text-[var(--text-primary)]")}>{icon}</button>
);

const ColorPickerButton: React.FC<{ icon: React.ReactNode; onSelect: (color: string) => void }> = ({ icon, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="p-1.5 hover:bg-black/5 rounded">{icon}</button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 p-2 bg-white border rounded-lg shadow-xl z-50 grid grid-cols-8 gap-1 w-[200px]">
          {COLOR_PALETTE.map((color, i) => (
            <button key={i} onClick={() => { onSelect(color || 'transparent'); setIsOpen(false); }} className="w-5 h-5 rounded-sm border border-gray-200" style={{ backgroundColor: color || 'transparent' }} />
          ))}
        </div>
      )}
    </div>
  );
};

const FilterPopover: React.FC<{
  columnKey: string; values: string[]; selected: Set<string>; onToggle: (val: string) => void;
  onClose: () => void; onClear: () => void; search: string; onSearchChange: (val: string) => void;
  isStatus?: boolean; onQualificatiToggle?: () => void; qualificatiOnly?: boolean;
}> = ({ values, selected, onToggle, onClose, onClear, search, onSearchChange, isStatus, onQualificatiToggle, qualificatiOnly }) => (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute top-full left-0 mt-1 w-56 bg-white border rounded-lg shadow-xl z-50 flex flex-col overflow-hidden">
    <div className="p-2 border-b">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        <input autoFocus className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border rounded-md text-[12px] outline-none" placeholder="Cerca..." value={search} onChange={(e) => onSearchChange(e.target.value)} />
      </div>
      {isStatus && (
        <label className="flex items-center gap-2 mt-2 px-1 cursor-pointer">
          <input type="checkbox" checked={qualificatiOnly} onChange={onQualificatiToggle} className="rounded text-primary" />
          <span className="text-[11px] font-medium">Solo Qualificati</span>
        </label>
      )}
    </div>
    <div className="max-h-60 overflow-y-auto p-1">
      {values.filter(v => v.toLowerCase().includes(search.toLowerCase())).map(val => (
        <label key={val} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
          <input type="checkbox" checked={selected.has(val)} onChange={() => onToggle(val)} className="rounded text-primary" />
          <span className="text-[12px] truncate">{val || "(Vuoto)"}</span>
        </label>
      ))}
    </div>
    <div className="p-2 border-t bg-gray-50 flex justify-between">
      <button onClick={onClear} className="text-[11px] text-red-500 hover:underline">Resetta</button>
      <button onClick={onClose} className="text-[11px] font-semibold text-primary">OK</button>
    </div>
  </motion.div>
);

const RowContextMenu: React.FC<{
  x: number; y: number; id: string; onClose: () => void; onUpdate: (u: Partial<Cliente>) => void;
  onDelete?: () => void; onDuplicate?: () => void; currentStatus?: string; currentLingua?: string;
  kanbanCols: any[]; linguaColors: Record<string, string>;
}> = ({ x, y, onClose, onUpdate, onDelete, onDuplicate, currentStatus, currentLingua, kanbanCols, linguaColors }) => {
  const [customEmoji, setCustomEmoji] = useState("");
  const colorInputRef = useRef<HTMLInputElement>(null);

  return (
  <>
    <div className="fixed inset-0 z-[100]" onClick={onClose} />
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="fixed z-[101] w-72 max-w-[90vw] bg-white border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto" style={{ left: Math.min(x, window.innerWidth - (window.innerWidth < 640 ? window.innerWidth * 0.9 : 300)), top: Math.min(y, window.innerHeight - 500) }}>
      <div className="p-3 border-b bg-gray-50/50">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block">Stato</span>
        <div className="flex flex-wrap gap-1.5">
          {kanbanCols.map(s => (
            <button key={s.key} onClick={() => { onUpdate({ status: s.key }); onClose(); }} className={cn("px-2 py-1 rounded-full text-[10px] font-medium transition-all", currentStatus === s.key ? "ring-2 ring-primary" : "hover:scale-105")} style={{ backgroundColor: s.color + '20', color: s.color }}>{s.label}</button>
          ))}
        </div>
      </div>
      <div className="p-3 border-b">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block">Lingua</span>
        <div className="flex flex-wrap gap-1.5">
          {LINGUA_OPTIONS.map(l => (
            <button key={l} onClick={() => { onUpdate({ lingua: l }); onClose(); }} className={cn("px-2 py-1 rounded-full text-[10px] font-bold uppercase transition-all", currentLingua === l ? "ring-2 ring-primary" : "hover:scale-105")} style={{ backgroundColor: (linguaColors[l] || '#6b7280') + '20', color: linguaColors[l] || '#6b7280' }}>{l}</button>
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

      <div className="p-1">
        <ContextMenuItem icon={<CopyIcon size={14} />} label="Duplica cliente" onClick={() => { onDuplicate?.(); onClose(); }} />
        <div className="h-px bg-gray-100 my-1" />
        <ContextMenuItem icon={<Trash2 size={14} />} label="Elimina cliente" onClick={() => { if(confirm("Eliminare?")) onDelete?.(); onClose(); }} className="text-red-500" />
      </div>
    </motion.div>
  </>
  );
};

const CellContextMenu: React.FC<{ x: number; y: number; onClose: () => void; onCopy: () => void; onPaste: () => void; onReset: () => void; }> = ({ x, y, onClose, onCopy, onPaste, onReset }) => (
  <>
    <div className="fixed inset-0 z-[100]" onClick={onClose} />
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="fixed z-[101] w-40 bg-white border rounded-lg shadow-xl overflow-hidden py-1" style={{ left: x, top: y }}>
      <ContextMenuItem icon={<Copy size={14} />} label="Copia" onClick={onCopy} />
      <ContextMenuItem icon={<Clipboard size={14} />} label="Incolla" onClick={onPaste} />
      <div className="h-px bg-gray-100 my-1" />
      <ContextMenuItem icon={<RotateCcw size={14} />} label="Reset" onClick={onReset} className="text-red-500" />
    </motion.div>
  </>
);

const HeaderContextMenu: React.FC<{ x: number; y: number; onClose: () => void; onTypeChange: (t: ColumnType) => void; isCustom?: boolean; onDelete?: () => void; }> = ({ x, y, onClose, onTypeChange, isCustom, onDelete }) => (
  <>
    <div className="fixed inset-0 z-[100]" onClick={onClose} />
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="fixed z-[101] w-48 bg-white border rounded-lg shadow-xl overflow-hidden py-1" style={{ left: x, top: y }}>
      <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Tipo Colonna</span>
      <ContextMenuItem label="Testo" onClick={() => { onTypeChange('text'); onClose(); }} />
      <ContextMenuItem label="Numero" onClick={() => { onTypeChange('number'); onClose(); }} />
      <ContextMenuItem label="Status" onClick={() => { onTypeChange('status'); onClose(); }} />
      <ContextMenuItem label="Checkbox" onClick={() => { onTypeChange('checkbox'); onClose(); }} />
      <ContextMenuItem label="URL" onClick={() => { onTypeChange('url'); onClose(); }} />
      <ContextMenuItem label="Dropdown" onClick={() => { onTypeChange('dropdown'); onClose(); }} />
      {isCustom && (
        <>
          <div className="h-px bg-gray-100 my-1" />
          <ContextMenuItem icon={<Trash2 size={14} />} label="Elimina colonna" onClick={() => { onDelete?.(); onClose(); }} className="text-red-500" />
        </>
      )}
    </motion.div>
  </>
);

const BadgePopup: React.FC<{
  x: number; y: number; onClose: () => void; options: string[]; colors: Record<string, string>;
  onSelect: (v: string) => void; onUpdateColor: (v: string, c: string) => void;
  onUpdateOptions: (opts: string[]) => void;
}> = ({ x, y, onClose, options, colors, onSelect, onUpdateColor, onUpdateOptions }) => {
  const [showPicker, setShowPicker] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
      <div className="fixed inset-0 z-[100]" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="fixed z-[101] w-56 bg-white border rounded-xl shadow-2xl p-2" style={{ left: Math.min(x, window.innerWidth - 250), top: Math.min(y, window.innerHeight - 300) }}>
        <div className="flex justify-between items-center mb-2 px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Opzioni</span>
          <button onClick={() => setIsEditing(!isEditing)} className="text-[10px] text-primary hover:underline">{isEditing ? "Fine" : "Modifica"}</button>
        </div>
        <div className="flex flex-col gap-1">
          {options.map(opt => (
            <div key={opt} className="flex items-center gap-1 group">
              {isEditing && (
                <>
                  <button onClick={() => onUpdateOptions(options.filter(o => o !== opt))} className="text-red-400 hover:text-red-600"><X size={12} /></button>
                  <button onClick={() => setShowPicker(opt)} className="text-gray-400 hover:text-primary"><Palette size={12} /></button>
                </>
              )}
              <button 
                onClick={() => !isEditing && onSelect(opt)}
                onContextMenu={(e) => { e.preventDefault(); setShowPicker(opt); }}
                className={cn("flex-1 px-2 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider text-left transition-colors", !isEditing && "hover:opacity-80")}
                style={{ backgroundColor: (colors[opt] || '#6b7280') + '20', color: colors[opt] || '#6b7280' }}
              >
                {isEditing ? <input className="w-full bg-transparent outline-none" value={opt} onChange={(e) => onUpdateOptions(options.map(o => o === opt ? e.target.value : o))} /> : opt}
              </button>
            </div>
          ))}
          <button onClick={() => { const n = prompt("Nuova opzione:"); if(n) onUpdateOptions([...options, n]); }} className="mt-1 px-2 py-1.5 border border-dashed rounded-md text-[11px] text-gray-400 hover:text-primary hover:border-primary transition-colors flex items-center gap-2 justify-center">
            <Plus size={12} /> Aggiungi
          </button>
        </div>
        {showPicker && (
          <div className="absolute left-full top-0 ml-1 p-2 bg-white border rounded-lg shadow-xl grid grid-cols-5 gap-1 w-[130px]">
            {COLOR_PALETTE.map((c, i) => (
              <button key={i} onClick={() => { onUpdateColor(showPicker, c || '#6b7280'); setShowPicker(null); }} className="w-5 h-5 rounded-sm border" style={{ backgroundColor: c || 'transparent' }} />
            ))}
          </div>
        )}
      </motion.div>
    </>
  );
};

const ContextMenuItem: React.FC<{ icon?: React.ReactNode; label: string; onClick: () => void; className?: string }> = ({ icon, label, onClick, className }) => (
  <button onClick={onClick} className={cn("w-full px-3 py-2 flex items-center gap-2 text-[12px] hover:bg-black/5 transition-colors text-left", className)}>
    {icon}
    {label}
  </button>
);
