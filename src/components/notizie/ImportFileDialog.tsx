import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Upload, Check, ChevronRight, ChevronLeft, Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { toast } from "sonner";

interface ImportFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fields: { key: string; label: string }[];
  onImport: (data: any[]) => Promise<void>;
}

type Step = 'upload' | 'mapping' | 'confirm';

export const ImportFileDialog: React.FC<ImportFileDialogProps> = ({ isOpen, onClose, title, fields, onImport }) => {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep('upload');
      setFile(null);
      setFileData([]);
      setHeaders([]);
      setMapping({});
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    const isCSV = selectedFile.name.endsWith('.csv');
    const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');
    
    if (!isCSV && !isExcel) {
      toast.error("Per favore carica un file .csv, .xlsx o .xls");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = event.target?.result;
      let rows: string[][] = [];

      if (isCSV) {
        const text = data as string;
        // Auto-detect delimiter
        const firstLine = text.split('\n')[0];
        const delimiter = firstLine.includes(';') ? ';' : ',';
        
        const csvRows: string[][] = [];
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
              csvRows.push(currentRow);
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
          csvRows.push(currentRow);
        }
        rows = csvRows;
      } else {
        try {
          const XLSX = await import('xlsx');
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        } catch (xlsxError) {
          console.error('[Import] XLSX parse error:', xlsxError);
          toast.error("Errore nella lettura del file Excel. Prova a salvarlo come .csv");
          return;
        }
      }

      if (rows.length < 2) {
        toast.error("Il file sembra vuoto o non valido");
        return;
      }
      // Filter out empty rows
      const dataRows = rows.slice(1).filter(row => 
        row && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
      );
      if (dataRows.length === 0) {
        toast.error("Nessun dato trovato nel file");
        return;
      }
      setHeaders(rows[0].map(h => String(h || '').trim()));
      setFileData(dataRows);
      setFile(selectedFile);
      
      // Auto-mapping with aliases
      const FIELD_ALIASES: Record<string, string[]> = {
        // Notizie
        name: ['name', 'nome', 'titolo', 'title', 'proprietà', 'property'],
        zona: ['zona', 'zone', 'area', 'location', 'luogo', 'città', 'city'],
        phone: ['phone', 'telefono', 'tel', 'cellulare', 'mobile', 'numero'],
        type: ['type', 'tipo', 'tipologia', 'category', 'categoria'],
        status: ['status', 'stato', 'state'],
        prezzo_richiesto: ['prezzo_richiesto', 'prezzo', 'price', 'asking price', 'richiesta', 'asking'],
        valore: ['valore', 'value', 'valutazione', 'stima', 'estimated'],
        rating: ['rating', 'voto', 'score', 'punteggio', 'stars', 'stelle'],
        notes: ['notes', 'note', 'note', 'description', 'descrizione', 'commenti', 'comments'],
        is_online: ['is_online', 'online', 'pubblicato', 'published', 'portale'],
        // Clienti
        nome: ['nome', 'name', 'first name', 'firstname', 'given name'],
        cognome: ['cognome', 'surname', 'last name', 'lastname', 'family name'],
        email: ['email', 'e-mail', 'mail', 'posta'],
        telefono: ['telefono', 'phone', 'tel', 'mobile', 'cellulare', 'numero'],
        paese: ['paese', 'country', 'nazione', 'nation', 'provenienza'],
        lingua: ['lingua', 'language', 'lang', 'idioma'],
        portale: ['portale', 'portal', 'fonte', 'source', 'canale', 'channel'],
        budget_max: ['budget_max', 'budget', 'max budget', 'massimo', 'maximum', 'budget massimo'],
        regioni: ['regioni', 'regione', 'region', 'regions', 'area', 'zone'],
        tipologia: ['tipologia', 'type', 'tipo', 'property type', 'categoria'],
        note_extra: ['note_extra', 'note', 'notes', 'commenti', 'description', 'descrizione'],
        property_name: ['property_name', 'proprietà', 'property', 'immobile', 'nome proprietà'],
        ref_number: ['ref_number', 'ref', 'reference', 'codice', 'rif', 'rif.', 'numero rif'],
      };

      const newMapping: Record<string, string> = {};
      const cleanHeader = (h: string) => String(h || '').toLowerCase().trim()
        .replace(/[_\-\s]+/g, ' ');

      fields.forEach(field => {
        const aliases = FIELD_ALIASES[field.key] || [field.key, field.label];
        
        // 1. Try exact match first
        let matchIdx = rows[0].findIndex(h => 
          cleanHeader(h) === cleanHeader(field.key) ||
          cleanHeader(h) === cleanHeader(field.label)
        );
        
        // 2. Try alias exact match
        if (matchIdx === -1) {
          matchIdx = rows[0].findIndex(h =>
            aliases.some(alias => cleanHeader(h) === cleanHeader(alias))
          );
        }
        
        // 3. Try alias contains match (less greedy — alias must be full word)
        if (matchIdx === -1) {
          matchIdx = rows[0].findIndex(h => {
            const ch = cleanHeader(h);
            return aliases.some(alias => {
              const ca = cleanHeader(alias);
              // Match only if alias is at word boundary, not substring of longer word
              return ch === ca || ch.startsWith(ca + ' ') || ch.endsWith(' ' + ca) || ch.includes(' ' + ca + ' ');
            });
          });
        }
        
        if (matchIdx !== -1) newMapping[field.key] = rows[0][matchIdx];
      });
      setMapping(newMapping);
      setStep('mapping');
    };
    
    if (isCSV) reader.readAsText(selectedFile);
    else reader.readAsBinaryString(selectedFile);
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const dataToImport = fileData.map(row => {
        const item: any = {};
        fields.forEach(field => {
          const csvHeader = mapping[field.key];
          if (csvHeader) {
            const headerIndex = headers.indexOf(csvHeader);
            if (headerIndex !== -1) {
              item[field.key] = row[headerIndex];
            }
          }
        });
        return item;
      });
      await onImport(dataToImport);
      onClose();
    } catch (error) {
      toast.error("Errore durante l'importazione");
      console.error(error);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/25"
          />
          <motion.div
            initial={{ scale: 0.97, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-white rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-[var(--border-light)] shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#1A1A18] flex items-center justify-center text-white shadow-lg shadow-black/10">
                  <Upload size={22} />
                </div>
                <div>
                  <h2 className="font-outfit font-bold text-[20px] text-[var(--text-primary)] tracking-[-0.5px]">{title}</h2>
                  <p className="font-outfit font-bold text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">Carica da file CSV o Excel</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-10 h-10 flex items-center justify-center bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto flex-1">
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
                  className="h-[280px] sm:h-[360px] border-2 border-dashed border-[var(--border-light)] rounded-[24px] flex flex-col items-center justify-center gap-5 hover:border-black/20 hover:bg-[var(--bg-subtle)] transition-all cursor-pointer group"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--text-muted)] group-hover:scale-110 group-hover:bg-white group-hover:shadow-xl transition-all duration-300">
                    <Upload size={32} className="sm:w-9 sm:h-9" />
                  </div>
                  <div className="text-center px-4">
                    <p className="font-outfit font-bold text-[16px] sm:text-[18px] text-[var(--text-primary)] mb-1">Clicca o trascina il file CSV o Excel</p>
                    <p className="font-outfit font-medium text-[13px] sm:text-[14px] text-[var(--text-muted)]">File .csv, .xlsx o .xls supportati</p>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                    className="hidden" 
                  />
                </div>
              )}

              {step === 'mapping' && (
                <div className="flex flex-col gap-8">
                  <div className="bg-[var(--bg-subtle)] p-4 sm:p-6 rounded-[20px] border border-[var(--border-light)]">
                    <h3 className="font-outfit font-bold text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)] mb-4">Anteprima Dati (Prime 5 righe)</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[12px] font-outfit border-collapse">
                        <thead>
                          <tr className="border-b border-[var(--border-light)]">
                            {headers.map((h, i) => (
                              <th key={i} className="text-left py-3 px-4 text-[var(--text-muted)] font-bold whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {fileData.slice(0, 5).map((row, i) => (
                            <tr key={i} className="border-b border-black/[0.03] last:border-0">
                              {row.map((cell, j) => (
                                <td key={j} className="py-3 px-4 text-[var(--text-primary)] truncate max-w-[150px]">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <h3 className="font-outfit font-bold text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">Mappatura Campi</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {fields.map(field => (
                        <div key={field.key} className="flex flex-col gap-2">
                          <label className="font-outfit font-bold text-[11px] text-[var(--text-primary)] px-1">{field.label}</label>
                          <div className="relative">
                            <select 
                              value={mapping[field.key] || ''}
                              onChange={(e) => setMapping({...mapping, [field.key]: e.target.value})}
                              className="w-full h-11 bg-[var(--bg-subtle)] border border-[var(--border-light)] rounded-[14px] px-4 text-[13px] font-outfit font-bold text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--text-primary)]/10 appearance-none cursor-pointer hover:border-[var(--border-medium)] transition-all shadow-sm"
                            >
                              <option value="">Non mappare</option>
                              {headers.map((h, i) => (
                                <option key={i} value={h}>{h}</option>
                              ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 'confirm' && (
                isImporting ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <Loader2 size={48} className="animate-spin text-[var(--text-muted)]" />
                    <p className="font-outfit font-bold text-[16px] text-[var(--text-primary)]">
                      Importazione in corso...
                    </p>
                    <p className="font-outfit text-[13px] text-[var(--text-muted)]">
                      Non chiudere questa finestra
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-8 py-8">
                    <div className="w-24 h-24 rounded-full bg-[#F0FFF4] text-[#2D8A4E] border-2 border-[#6DC88A] flex items-center justify-center shadow-lg shadow-green-500/10">
                      <Check size={48} />
                    </div>
                    <div className="text-center">
                      <h3 className="font-outfit font-bold text-[24px] text-[var(--text-primary)] mb-2">Pronto per l'importazione</h3>
                      <p className="font-outfit font-medium text-[16px] text-[var(--text-muted)]">
                        Stai per importare <span className="font-bold text-[var(--text-primary)]">{fileData.length}</span> elementi nel sistema.
                      </p>
                    </div>
                    <div className="w-full max-w-sm bg-[var(--bg-subtle)] p-6 rounded-[20px] border border-[var(--border-light)] space-y-4">
                      <div className="flex justify-between items-center text-[13px] font-outfit">
                        <span className="text-[var(--text-muted)] font-medium">File:</span>
                        <span className="font-bold text-[var(--text-primary)]">{file?.name}</span>
                      </div>
                      <div className="flex justify-between items-center text-[13px] font-outfit">
                        <span className="text-[var(--text-muted)] font-medium">Campi mappati:</span>
                        <span className="font-bold text-[var(--text-primary)]">{Object.keys(mapping).length} su {fields.length}</span>
                      </div>
                      
                      {(() => {
                        // Check required fields
                        const requiredKey = fields.find(f => 
                          f.key === 'name' || f.key === 'nome'
                        )?.key;
                        if (!requiredKey || !mapping[requiredKey]) return null;
                        
                        const headerIndex = headers.indexOf(mapping[requiredKey]);
                        const emptyCount = fileData.filter(row => 
                          !row[headerIndex] || String(row[headerIndex]).trim() === ''
                        ).length;
                        
                        if (emptyCount === 0) return (
                          <div className="flex items-center gap-2 text-[13px] font-outfit text-[#2D8A4E]">
                            <Check size={16} />
                            Tutti i record hanno il campo nome compilato
                          </div>
                        );
                        
                        return (
                          <div className="flex items-center gap-2 text-[13px] font-outfit text-amber-600 bg-amber-50 px-4 py-3 rounded-[12px] border border-amber-100">
                            <span>⚠️</span>
                            {emptyCount} record senza nome — verranno importati senza titolo
                          </div>
                        );
                      })()}
                    </div>

                    <div className="pt-3 border-t border-[var(--border-light)]">
                      <p className="text-[11px] font-outfit font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                        Campi mappati:
                      </p>
                      <div className="flex flex-col gap-1">
                        {fields.map(field => {
                          const isMapped = !!mapping[field.key];
                          return (
                            <div key={field.key} className="flex items-center justify-between text-[12px] font-outfit">
                              <span className={isMapped ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}>
                                {field.label}
                              </span>
                              {isMapped ? (
                                <span className="text-[#2D8A4E] font-bold">
                                  ✓ {mapping[field.key]}
                                </span>
                              ) : (
                                <span className="text-[var(--text-muted)]">— non mappato</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="p-8 border-t border-[var(--border-light)] bg-[var(--bg-subtle)] flex items-center justify-between shrink-0">
              {step !== 'upload' ? (
                <button 
                  onClick={() => setStep(step === 'mapping' ? 'upload' : 'mapping')}
                  className="flex items-center gap-2 px-6 h-12 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-light)] rounded-full transition-all font-outfit font-bold text-[13px] uppercase tracking-[0.15em] border border-transparent hover:border-[var(--border-light)]"
                >
                  <ChevronLeft size={18} />
                  Indietro
                </button>
              ) : <div />}

              <div className="flex items-center gap-4">
                <button 
                  onClick={onClose}
                  className="px-6 h-12 text-[var(--text-secondary)] font-outfit font-bold text-[13px] uppercase tracking-[0.15em] hover:text-[var(--text-primary)] transition-colors"
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
                    className="flex items-center gap-3 px-8 h-12 bg-[var(--text-primary)] text-white rounded-full font-outfit font-bold text-[13px] uppercase tracking-[0.2em] hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-[var(--text-primary)]/10"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Importazione...
                      </>
                    ) : (
                      <>
                        {step === 'mapping' ? 'Continua' : 'Conferma Import'}
                        <ChevronRight size={18} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
