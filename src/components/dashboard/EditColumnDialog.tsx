import React, { useState } from 'react';

interface EditColumnDialogProps {
  isOpen: boolean;
  onClose: () => void;
  column: { id: string; label: string; color: string };
  onSave: (id: string, label: string, color: string) => void;
}

export const EditColumnDialog: React.FC<EditColumnDialogProps> = ({ isOpen, onClose, column, onSave }) => {
  const [label, setLabel] = useState(column.label);
  const [color, setColor] = useState(column.color);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
        <h2 className="text-lg font-semibold mb-4">Modifica Colonna</h2>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="label" className="text-sm font-medium">Nome</label>
            <input id="label" className="border rounded p-2" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label htmlFor="color" className="text-sm font-medium">Colore</label>
            <input id="color" type="color" className="border rounded p-2 h-10 w-full" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 border rounded" onClick={onClose}>Annulla</button>
          <button className="px-4 py-2 bg-black text-white rounded" onClick={() => { onSave(column.id, label, color); onClose(); }}>Salva</button>
        </div>
      </div>
    </div>
  );
};
