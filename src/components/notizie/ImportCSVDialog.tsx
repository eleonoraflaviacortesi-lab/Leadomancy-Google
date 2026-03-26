import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Upload, FileText, Check, AlertCircle, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { useNotizie } from "@/src/hooks/useNotizie";
import { Notizia, NotiziaStatus } from "@/src/types";
import { cn } from "@/src/lib/utils";
import { toast } from "sonner";

interface ImportCSVDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'upload' | 'mapping' | 'confirm';

const NOTIZIA_FIELDS = [
  { key: 'name', label: 'Nome/Titolo' },
  { key: 'zona', label: 'Zona' },
  { key: 'telefono', label: 'Telefono' },
  { key: 'type', label: 'Tipologia' },
  { key: 'prezzo_richiesto', label: 'Prezzo Richiesto' },
  { key: 'valore', label: 'Valore Stimato' },
  { key: 'rating', label: 'Rating (1-5)' },
  { key: 'notes', label: 'Note' },
];

export const ImportCSVDialog: React.FC<ImportCSVDialogProps> = ({ isOpen, onClose }) => {
  const { addNotizia } = useNotizie();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string) => {
    // Auto-detect delimiter
    const firstLine = text.split('\n')[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';
    
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (currentField || currentRow.length > 0) {
          currentRow.push(currentField.trim());
          rows.push(currentRow);
          currentRow = [];
          currentField = '';
        }
        if (char === '\r' && nextChar === '\n') i++;
      } else {
        currentField += char;
      }
    }
    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      rows.push(currentRow);
    }
    return rows;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!selectedFile.name.endsWith('.csv')) {
      toast.error("Per favore carica un file .csv");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length < 2) {
        toast.error("Il file CSV sembra vuoto o non valido");
        return;
      }
      setHeaders(rows[0]);
      setCsvData(rows.slice(1));
      setFile(selectedFile);
      
      // Auto-mapping
      const newMapping: Record<string, string> = {};
      NOTIZIA_FIELDS.forEach(field => {
        const match = rows[0].findIndex(h => 
          h.toLowerCase().includes(field.key.toLowerCase()) || 
          h.toLowerCase().includes(field.label.toLowerCase())
        );
        if (match !== -1) newMapping[field.key] = rows[0][match];
      });
      setMapping(newMapping);
      setStep('mapping');
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    setIsImporting(true);
    let successCount = 0;

    try {
      for (const row of csvData) {
        const noticia: Partial<Notizia> = {
          status: 'new',
          emoji: '🏠'
        };

        NOTIZIA_FIELDS.forEach(field => {
          const csvHeader = mapping[field.key];
          if (csvHeader) {
            const headerIndex = headers.indexOf(csvHeader);
            if (headerIndex !== -1) {
              let value: any = row[headerIndex];
              if (field.key === 'prezzo_richiesto' || field.key === 'valore' || field.key === 'rating') {
                value = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
              }
              (noticia as any)[field.key] = value;
            }
          }
        });

        await addNotizia(noticia);
        successCount++;
      }
      toast.success(`Importate con successo ${successCount} notizie`);
      onClose();
    } catch (error) {
      toast.error("Errore durante l'importazione");
      console.error(error);
    } finally {
      setIsImporting(false);
    }
  };

  const reset = () => {
    setStep('upload');
    setFile(null);
    setCsvData([]);
    setHeaders([]);
    setMapping({});
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white shadow-2xl z-[110] rounded-3xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-[var(--border-light)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white">
                  <Upload size={20} />
                </div>
                <div>
                  <h2 className="font-outfit font-semibold text-[20px] text-[var(--text-primary)]">Importa Notizie</h2>
                  <p className="text-[12px] text-[var(--text-muted)] font-outfit uppercase tracking-wider">Carica da file CSV</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 min-h-[400px] flex flex-col">
              {step === 'upload' && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const droppedFile = e.dataTransfer.files[0];
                    if (droppedFile) {
                      const event = { target: { files: [droppedFile] } } as any;
                      handleFileUpload(event);
                    }
                  }}
                  className="flex-1 border-2 border-dashed border-[var(--border-light)] rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-black/20 hover:bg-black/[0.02] transition-all cursor-pointer group"
                >
                  <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center text-[var(--text-muted)] group-hover:scale-110 transition-transform">
                    <Upload size={32} />
                  </div>
                  <div className="text-center">
                    <p className="font-outfit font-bold text-[16px] text-[var(--text-primary)]">Clicca o trascina il file CSV</p>
                    <p className="font-outfit text-[13px] text-[var(--text-muted)]">Solo file .csv supportati</p>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept=".csv" 
                    className="hidden" 
                  />
                </div>
              )}

              {step === 'mapping' && (
                <div className="flex-1 flex flex-col gap-6">
                  <div className="bg-[var(--bg-subtle)] p-4 rounded-xl">
                    <h3 className="font-outfit font-bold text-[12px] uppercase tracking-wider text-[var(--text-muted)] mb-3">Anteprima Dati (Prime 5 righe)</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px] font-outfit">
                        <thead>
                          <tr className="border-b border-black/5">
                            {headers.map((h, i) => (
                              <th key={i} className="text-left py-2 px-3 text-[var(--text-muted)] font-medium">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {csvData.slice(0, 5).map((row, i) => (
                            <tr key={i} className="border-b border-black/5 last:border-0">
                              {row.map((cell, j) => (
                                <td key={j} className="py-2 px-3 text-[var(--text-primary)] truncate max-w-[150px]">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-outfit font-bold text-[12px] uppercase tracking-wider text-[var(--text-muted)]">Mappatura Campi</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {NOTIZIA_FIELDS.map(field => (
                        <div key={field.key} className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-outfit font-bold text-[var(--text-primary)]">{field.label}</label>
                          <select 
                            value={mapping[field.key] || ''}
                            onChange={(e) => setMapping({...mapping, [field.key]: e.target.value})}
                            className="bg-[var(--bg-subtle)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-[12px] font-outfit outline-none focus:ring-1 focus:ring-black/10"
                          >
                            <option value="">Non mappare</option>
                            {headers.map((h, i) => (
                              <option key={i} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 'confirm' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-[var(--sage-bg)] text-[var(--sage-fg)] flex items-center justify-center">
                    <Check size={40} />
                  </div>
                  <div className="text-center">
                    <h3 className="font-outfit font-bold text-[20px] text-[var(--text-primary)]">Pronto per l'importazione</h3>
                    <p className="font-outfit text-[14px] text-[var(--text-muted)] mt-1">
                      Stai per importare <span className="font-bold text-[var(--text-primary)]">{csvData.length}</span> notizie.
                    </p>
                  </div>
                  <div className="w-full max-w-sm bg-[var(--bg-subtle)] p-4 rounded-xl space-y-2">
                    <div className="flex justify-between text-[12px] font-outfit">
                      <span className="text-[var(--text-muted)]">File:</span>
                      <span className="font-bold">{file?.name}</span>
                    </div>
                    <div className="flex justify-between text-[12px] font-outfit">
                      <span className="text-[var(--text-muted)]">Campi mappati:</span>
                      <span className="font-bold">{Object.keys(mapping).length} su {NOTIZIA_FIELDS.length}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-[var(--border-light)] bg-[var(--bg-subtle)] flex items-center justify-between">
              {step !== 'upload' ? (
                <button 
                  onClick={() => setStep(step === 'mapping' ? 'upload' : 'mapping')}
                  className="flex items-center gap-2 px-4 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors font-outfit font-bold text-[13px]"
                >
                  <ChevronLeft size={16} />
                  Indietro
                </button>
              ) : <div />}

              <div className="flex items-center gap-3">
                <button 
                  onClick={onClose}
                  className="px-6 py-2.5 text-[var(--text-muted)] font-outfit font-bold text-[13px] hover:text-[var(--text-primary)] transition-colors"
                >
                  Annulla
                </button>
                {step !== 'upload' && (
                  <button 
                    onClick={() => {
                      if (step === 'mapping') setStep('confirm');
                      else handleImport();
                    }}
                    disabled={isImporting}
                    className="flex items-center gap-2 px-8 py-2.5 bg-black text-white rounded-full font-outfit font-bold text-[13px] hover:bg-black/80 transition-all disabled:opacity-50"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Importazione...
                      </>
                    ) : (
                      <>
                        {step === 'mapping' ? 'Continua' : 'Conferma Import'}
                        <ChevronRight size={16} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
