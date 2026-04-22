import React, { useState, useMemo } from 'react';
import { Cliente } from '@/src/types';
import { useClienti } from '@/src/hooks/useClienti';
import { toast } from 'sonner';
import { Search, Merge } from 'lucide-react';

interface MergeClienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: Cliente;
  onMerged: () => void;
  tallyOnly?: boolean;
}

const MergeClienteDialog: React.FC<MergeClienteDialogProps> = ({
  open, onOpenChange, cliente, onMerged, tallyOnly = false
}) => {
  const { clienti, updateCliente, deleteCliente } = useClienti();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [merging, setMerging] = useState(false);

  const candidates = useMemo(() => {
    return clienti.filter(c => {
      if (c.id === cliente.id) return false;
      if (tallyOnly && c.portale !== 'TALLY') return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          c.nome?.toLowerCase().includes(s) ||
          c.cognome?.toLowerCase().includes(s) ||
          c.telefono?.toLowerCase().includes(s) ||
          c.email?.toLowerCase().includes(s)
        );
      }
      // Show potential duplicates by default
      return (
        c.telefono === cliente.telefono ||
        c.email === cliente.email ||
        c.nome?.toLowerCase() === cliente.nome?.toLowerCase()
      );
    });
  }, [clienti, cliente, search, tallyOnly]);

  const handleMerge = async () => {
    if (!selectedId) return;
    const target = clienti.find(c => c.id === selectedId);
    if (!target) return;
    setMerging(true);
    try {
      // Merge: keep primary cliente, fill empty fields from target
      const merged: Partial<Cliente> = {};
      const fields: (keyof Cliente)[] = [
        'telefono', 'email', 'paese', 'lingua', 'budget_max', 'mutuo',
        'tempo_ricerca', 'regioni', 'tipologia', 'stile', 'contesto',
        'camere', 'bagni', 'piscina', 'terreno', 'uso', 'interesse_affitto',
        'descrizione', 'note_extra'
      ];
      fields.forEach(f => {
        const primaryVal = cliente[f];
        const targetVal = target[f];
        const isEmpty = (v: any) => !v || (Array.isArray(v) && v.length === 0);
        if (isEmpty(primaryVal) && !isEmpty(targetVal)) {
          (merged as any)[f] = targetVal;
        }
      });
      // Append notes
      if (target.note_extra) {
        merged.note_extra = [cliente.note_extra, target.note_extra]
          .filter(Boolean).join('\n\n---\n\n');
      }
      await updateCliente({ id: cliente.id, ...merged });
      if (!window.confirm('Eliminare questo buyer?')) return;
      await deleteCliente(target.id);
      toast.success(`Unito con ${target.nome}`);
      onMerged();
      onOpenChange(false);
    } catch (err) {
      toast.error('Errore durante il merge');
    } finally {
      setMerging(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={() => onOpenChange(false)}>
      <div style={{
        background: 'white', borderRadius: 20, padding: 24,
        width: 420, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
      }} onClick={e => e.stopPropagation()}>
        
        <p style={{ fontSize: 16, fontWeight: 600, fontFamily: 'Outfit', marginBottom: 4 }}>
          <Merge size={16} style={{ display: 'inline', marginRight: 8 }} />
          {tallyOnly ? 'Associa Questionario Tally' : 'Unisci Duplicati'}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Outfit', marginBottom: 16 }}>
          {tallyOnly 
            ? `Cerca una submission Tally da associare a ${cliente.nome}`
            : `Cerca il duplicato di ${cliente.nome} da unire`}
        </p>

        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca per nome, telefono, email..."
            style={{
              width: '100%', height: 36, borderRadius: 999,
              border: '1px solid var(--border-light)', paddingLeft: 36,
              fontFamily: 'Outfit', fontSize: 13, outline: 'none'
            }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {candidates.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0', fontFamily: 'Outfit' }}>
              Nessun candidato trovato
            </p>
          ) : candidates.map(c => (
            <div
              key={c.id}
              onClick={() => setSelectedId(c.id === selectedId ? null : c.id)}
              style={{
                padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                border: `1.5px solid ${c.id === selectedId ? '#1A1A18' : 'var(--border-light)'}`,
                background: c.id === selectedId ? '#F5F4F0' : 'white',
                transition: 'all 150ms'
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 600, fontFamily: 'Outfit', margin: 0 }}>
                {c.nome} {c.cognome}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Outfit', margin: '2px 0 0' }}>
                {c.telefono} · {c.email} · {c.portale}
              </p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={() => onOpenChange(false)} style={{
            flex: 1, height: 38, borderRadius: 999, border: '1px solid var(--border-light)',
            background: 'white', cursor: 'pointer', fontFamily: 'Outfit', fontSize: 12
          }}>Annulla</button>
          <button
            onClick={handleMerge}
            disabled={!selectedId || merging}
            style={{
              flex: 1, height: 38, borderRadius: 999, border: 'none',
              background: selectedId ? '#1A1A18' : 'var(--bg-subtle)',
              color: selectedId ? 'white' : 'var(--text-muted)',
              cursor: selectedId ? 'pointer' : 'not-allowed',
              fontFamily: 'Outfit', fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
            }}
          >
            <Merge size={14} />
            {merging ? 'Unendo...' : 'Unisci'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MergeClienteDialog;
