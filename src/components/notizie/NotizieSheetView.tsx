import React, { useMemo } from 'react';
import { Notizia } from '@/src/types';

interface NotizieSheetViewProps {
  notizie: Notizia[];
  onNotiziaClick: (notizia: Notizia) => void;
  onUpdate: (id: string, updates: Partial<Notizia>) => void;
  onDelete?: (id: string) => void;
  searchQuery: string;
  onAddNew?: () => void;
}

const COLUMNS = [
  { key: 'name',             label: 'Nome',         width: 180 },
  { key: 'zona',             label: 'Zona',         width: 140 },
  { key: 'phone',            label: 'Telefono',     width: 140 },
  { key: 'type',             label: 'Tipo',         width: 120 },
  { key: 'status',           label: 'Status',       width: 130 },
  { key: 'prezzo_richiesto', label: 'Prezzo Rich.', width: 120 },
  { key: 'valore',           label: 'Valore',       width: 120 },
  { key: 'is_online',        label: 'Online',       width: 80  },
  { key: 'notes',            label: 'Note',         width: 250 },
  { key: 'created_at',       label: 'Creata',       width: 100 },
];

export const NotizieSheetView: React.FC<NotizieSheetViewProps> = ({
  notizie,
  onNotiziaClick,
  onUpdate,
  onDelete,
  searchQuery,
  onAddNew
}) => {
  const displayData = useMemo(() => {
    if (!notizie || notizie.length === 0) return []
    let result = [...notizie]
    if (searchQuery?.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(n =>
        n.name?.toLowerCase().includes(q) ||
        n.zona?.toLowerCase().includes(q)
      )
    }
    return result
  }, [notizie, searchQuery]);

  if (displayData.length === 0 && !searchQuery?.trim()) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'Outfit', fontSize: 13 }}>
        Nessuna notizia. Clicca "+ Aggiungi Notizia" per iniziare.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: 800 }}>
        {/* HEADER ROW */}
        <div style={{ display: 'flex', position: 'sticky', top: 0, background: 'var(--bg-page)', zIndex: 10, borderBottom: '2px solid var(--border-medium)' }}>
          <div style={{ width: 52, flexShrink: 0 }} /> {/* row number */}
          {COLUMNS.map(col => (
            <div key={col.key} style={{ width: col.width, flexShrink: 0, padding: '0 12px', height: 36, display: 'flex', alignItems: 'center', fontFamily: 'Outfit', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              {col.label}
            </div>
          ))}
        </div>

        {/* DATA ROWS */}
        {displayData.map((notizia, idx) => (
          <div key={notizia.id}
            style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', minHeight: 44, background: notizia.card_color || (idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-subtle)'), cursor: 'pointer' }}
            onClick={() => onNotiziaClick(notizia)}
          >
            {/* Row number */}
            <div style={{ width: 52, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: 11 }}>
              {idx + 1}
            </div>
            {/* Data cells */}
            {COLUMNS.map(col => (
              <div key={col.key}
                style={{ width: col.width, flexShrink: 0, padding: '0 12px', display: 'flex', alignItems: 'center', borderRight: '1px solid var(--border-light)', fontSize: 13, fontFamily: 'Outfit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                onClick={e => e.stopPropagation()}
              >
                {col.key === 'status' ? (
                  <span style={{ background: 'var(--slate-bg)', color: 'var(--slate-fg)', borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {String((notizia as any)[col.key] ?? '')}
                  </span>
                ) : col.key === 'is_online' ? (
                  <span>{(notizia as any)[col.key] ? '✓' : ''}</span>
                ) : col.key === 'prezzo_richiesto' || col.key === 'valore' ? (
                  <span>{(notizia as any)[col.key] ? `€ ${Number((notizia as any)[col.key]).toLocaleString('it-IT')}` : ''}</span>
                ) : col.key === 'created_at' ? (
                  <span>{(notizia as any)[col.key] ? new Date((notizia as any)[col.key]).toLocaleDateString('it-IT') : ''}</span>
                ) : (
                  <input
                    defaultValue={String((notizia as any)[col.key] ?? '')}
                    onBlur={e => { if (e.target.value !== String((notizia as any)[col.key] ?? '')) onUpdate(notizia.id, { [col.key]: e.target.value } as any) }}
                    onClick={e => e.stopPropagation()}
                    style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Outfit', fontSize: 13, color: 'inherit', cursor: 'text' }}
                  />
                )}
              </div>
            ))}
          </div>
        ))}

        {/* ADD ROW */}
        <div
          onClick={onAddNew}
          style={{ display: 'flex', alignItems: 'center', paddingLeft: 64, height: 36, cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'Outfit' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = '')}
        >
          + Aggiungi notizia
        </div>
      </div>
    </div>
  );
};
