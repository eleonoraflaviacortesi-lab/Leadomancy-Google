import React, { useState } from 'react';

import { ColorPicker } from '@/src/components/ui/ColorPicker';

interface EditColumnDialogProps {
  isOpen: boolean;
  onClose: () => void;
  column: { id: string; label: string; color: string };
  onSave: (id: string, label: string, color: string) => void;
}

export const EditColumnDialog: React.FC<EditColumnDialogProps> = ({ isOpen, onClose, column, onSave }) => {
  const [label, setLabel] = useState(column.label);
  const [color, setColor] = useState(column.color || '#000000');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 font-outfit">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl border border-gray-100 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-gray-900 leading-tight">Modifica colonna</h2>
          <p className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">Workspace personalizzato</p>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="label" className="text-[10px] uppercase tracking-wider font-bold text-gray-400 ml-1">Nome Etichetta</label>
            <input 
              id="label" 
              className="w-full bg-gray-50/50 border border-gray-100 rounded-xl p-3.5 text-sm font-medium focus:ring-2 focus:ring-black/10 focus:bg-white transition-all outline-none" 
              value={label} 
              onChange={(e) => setLabel(e.target.value)} 
              placeholder="Esempio: In Trattativa"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 ml-1">Colore Identificativo</label>
            <ColorPicker color={color} onChange={setColor} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button 
            className="px-6 py-2.5 text-sm font-bold text-gray-400 hover:text-black transition-colors" 
            onClick={onClose}
          >
            Annulla
          </button>
          <button 
            className="px-8 py-2.5 bg-black text-white text-sm font-bold rounded-[14px] hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-black/20" 
            onClick={() => { onSave(column.id, label, color); onClose(); }}
          >
            Salva
          </button>
        </div>
      </div>
    </div>
  );
};
